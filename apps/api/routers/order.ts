import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import {
  order,
  orderItem,
  orderItemModifier,
  member,
  branch,
  restaurantTable,
  voidLog,
  discountLog,
} from "@repo/db";
import { router, protectedProcedure } from "../lib/trpc.js";
import type { TRPCContext } from "../lib/context.js";

/**
 * Reuses the same fallback pattern as other routers:
 * if session lacks activeOrganizationId (legacy sessions),
 * fetch user's first org membership.
 */
async function getOrganizationId(
  ctx: TRPCContext & {
    user: NonNullable<TRPCContext["user"]>;
    session: NonNullable<TRPCContext["session"]>;
  },
): Promise<string> {
  let orgId = ctx.session.activeOrganizationId;

  if (!orgId) {
    const memberships = await ctx.db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, ctx.user.id))
      .limit(1);

    if (memberships.length > 0) {
      orgId = memberships[0].organizationId;
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization selected",
      });
    }
  }

  return orgId;
}

const orderItemModifierSchema = z.object({
  modifierOptionId: z.string().optional(),
  name: z.string(),
  priceAdjustment: z.string(),
});

const orderItemSchema = z.object({
  menuItemId: z.string().optional(),
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.string(),
  notes: z.string().optional(),
  modifiers: z.array(orderItemModifierSchema).optional(),
});

export const orderRouter = router({
  // Create a new order (called by Flutter POS and delivery webhooks)
  create: protectedProcedure
    .input(
      z.object({
        branchId: z.string().optional(),
        externalOrderId: z.string().optional(),
        source: z.enum(["pos", "grab", "wongnai", "lineman"]).default("pos"),
        orderType: z.enum(["dine_in", "takeaway", "delivery"]).optional(),
        tableId: z.string().uuid().optional(),
        createdBy: z.string().uuid().optional(),
        vatAmount: z.string().optional(),
        vatRate: z.string().optional().default("7.00"),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        items: z.array(orderItemSchema).min(1),
        subtotal: z.string(),
        discount: z.string().optional(),
        discountAmount: z.string().optional(),
        total: z.string(),
        notes: z.string().optional(),
        // F-006: Payment fields
        paymentMethod: z
          .enum(["cash", "promptpay", "card"])
          .optional()
          .default("cash"),
        payments: z
          .array(
            z.object({
              method: z.enum(["cash", "promptpay", "card"]),
              amount: z.string(),
            }),
          )
          .optional(),
        tenderedAmount: z.string().optional(),
        changeAmount: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      // Validate branchId — Flutter may send orgId as branchId if no branches exist.
      // Set to null instead of letting a FK violation silently kill the insert.
      let resolvedBranchId: string | undefined = undefined;
      if (input.branchId) {
        const exists = await ctx.db
          .select({ id: branch.id })
          .from(branch)
          .where(eq(branch.id, input.branchId))
          .limit(1);
        resolvedBranchId = exists[0]?.id;
      }

      const newOrder = await ctx.dbDirect.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(order)
          .values({
            organizationId: orgId,
            branchId: resolvedBranchId,
            externalOrderId: input.externalOrderId,
            source: input.source,
            orderType: input.orderType,
            tableId: input.tableId,
            createdBy: input.createdBy ?? ctx.user.id,
            vatAmount: input.vatAmount,
            vatRate: input.vatRate,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            items: input.items,
            subtotal: input.subtotal,
            discount: input.discount ?? "0",
            discountAmount: input.discountAmount,
            total: input.total,
            notes: input.notes,
            paymentMethod: input.paymentMethod,
            payments: input.payments,
            tenderedAmount: input.tenderedAmount,
            changeAmount: input.changeAmount,
          })
          .returning();

        // Write normalized order_item rows (and order_item_modifier if present)
        for (const item of input.items) {
          const [insertedItem] = await tx
            .insert(orderItem)
            .values({
              orderId: inserted.id,
              organizationId: orgId,
              menuItemId: item.menuItemId ?? null,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              subtotal: (parseFloat(item.price) * item.quantity).toFixed(2),
              notes: item.notes,
            })
            .returning();

          if (item.modifiers?.length) {
            await tx.insert(orderItemModifier).values(
              item.modifiers.map((mod) => ({
                orderItemId: insertedItem.id,
                modifierOptionId: mod.modifierOptionId,
                name: mod.name,
                priceAdjustment: mod.priceAdjustment,
              })),
            );
          }
        }

        // Mark table as occupied for dine-in orders
        if (input.tableId && input.orderType === "dine_in") {
          await tx
            .update(restaurantTable)
            .set({ status: "occupied", updatedAt: new Date() })
            .where(eq(restaurantTable.id, input.tableId));
        }

        return inserted;
      });

      return newOrder;
    }),

  // List orders for current organization, optionally filtered by branch or status
  list: protectedProcedure
    .input(
      z
        .object({
          branchId: z.string().optional(),
          status: z
            .enum([
              "pending",
              "accepted",
              "preparing",
              "ready",
              "completed",
              "cancelled",
            ])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const conditions = [eq(order.organizationId, orgId)];
      // Only filter by branchId if it actually exists in the branch table —
      // Flutter may send the org ID as branchId when no branches are configured.
      if (input?.branchId) {
        const branchExists = await ctx.db
          .select({ id: branch.id })
          .from(branch)
          .where(eq(branch.id, input.branchId))
          .limit(1);
        if (branchExists[0]) {
          conditions.push(eq(order.branchId, input.branchId));
        }
      }
      if (input?.status) {
        conditions.push(eq(order.status, input.status));
      }

      return ctx.db
        .select()
        .from(order)
        .where(and(...conditions))
        .orderBy(desc(order.createdAt));
    }),

  // Update order status (accept, prepare, complete, cancel)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "accepted",
          "preparing",
          "ready",
          "completed",
          "cancelled",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const timestamps: Record<string, Date | null> = {};
      if (input.status === "accepted") timestamps.acceptedAt = new Date();
      if (input.status === "completed") timestamps.completedAt = new Date();

      const [updated] = await ctx.db
        .update(order)
        .set({ status: input.status, ...timestamps })
        .where(and(eq(order.id, input.id), eq(order.organizationId, orgId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      return updated;
    }),

  // Void a single order item — marks isVoided, creates void_log, recalculates total
  voidItem: protectedProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        orderId: z.string(),
        reason: z.string().optional(),
        requesterId: z.string(),
        approverId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      return ctx.dbDirect.transaction(async (tx) => {
        // 1. Mark item as voided
        const [voided] = await tx
          .update(orderItem)
          .set({ isVoided: true })
          .where(
            and(
              eq(orderItem.id, input.orderItemId),
              eq(orderItem.orderId, input.orderId),
            ),
          )
          .returning();

        if (!voided) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order item not found",
          });
        }

        // 2. Create void log
        await tx.insert(voidLog).values({
          organizationId: orgId,
          orderId: input.orderId,
          orderItemId: input.orderItemId,
          requesterId: input.requesterId,
          approverId: input.approverId,
          voidType: "item",
          reason: input.reason,
        });

        // 3. Recalculate order total from non-voided items
        const remainingItems = await tx
          .select()
          .from(orderItem)
          .where(
            and(
              eq(orderItem.orderId, input.orderId),
              eq(orderItem.isVoided, false),
            ),
          );

        const newTotal = remainingItems
          .reduce((sum, i) => sum + parseFloat(i.subtotal), 0)
          .toFixed(2);

        await tx
          .update(order)
          .set({ total: newTotal })
          .where(eq(order.id, input.orderId));

        return { voidedItemId: input.orderItemId, newTotal };
      });
    }),

  // Cancel entire order — sets status to cancelled, voids all items, creates void_log
  voidOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.string().optional(),
        requesterId: z.string(),
        approverId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      return ctx.dbDirect.transaction(async (tx) => {
        // 1. Set order status to cancelled
        const [cancelled] = await tx
          .update(order)
          .set({ status: "cancelled", total: "0" })
          .where(
            and(eq(order.id, input.orderId), eq(order.organizationId, orgId)),
          )
          .returning();

        if (!cancelled) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // 2. Void all items
        await tx
          .update(orderItem)
          .set({ isVoided: true })
          .where(eq(orderItem.orderId, input.orderId));

        // 3. Create void log
        await tx.insert(voidLog).values({
          organizationId: orgId,
          orderId: input.orderId,
          requesterId: input.requesterId,
          approverId: input.approverId,
          voidType: "order",
          reason: input.reason,
        });

        return cancelled;
      });
    }),

  // F-008: Apply percentage discount to an order
  applyDiscount: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        discountPercent: z.number().min(0).max(100),
        reason: z.string().optional(),
        requesterId: z.string(),
        approverId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      return ctx.dbDirect.transaction(async (tx) => {
        // 1. Fetch order
        const [existing] = await tx
          .select()
          .from(order)
          .where(
            and(eq(order.id, input.orderId), eq(order.organizationId, orgId)),
          )
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // 2. Calculate discount
        const subtotal = parseFloat(existing.subtotal ?? existing.total ?? "0");
        const discountAmount = subtotal * (input.discountPercent / 100);
        const taxableAmount = subtotal - discountAmount;
        const vatRate = parseFloat(existing.vatRate ?? "7.00");
        const vatAmount = taxableAmount * (vatRate / 100);
        const newTotal = taxableAmount + vatAmount;

        // 3. Update order
        const [updated] = await tx
          .update(order)
          .set({
            discountAmount: discountAmount.toFixed(2),
            discount: input.discountPercent.toFixed(2),
            vatAmount: vatAmount.toFixed(2),
            total: newTotal.toFixed(2),
          })
          .where(eq(order.id, input.orderId))
          .returning();

        // 4. Create audit log
        await tx.insert(discountLog).values({
          organizationId: orgId,
          branchId: existing.branchId,
          orderId: input.orderId,
          requesterId: input.requesterId,
          approverId: input.approverId,
          discountType: "percentage",
          discountValue: input.discountPercent.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          reason: input.reason,
        });

        return {
          discountAmount: discountAmount.toFixed(2),
          newTotal: newTotal.toFixed(2),
          order: updated,
        };
      });
    }),
});
