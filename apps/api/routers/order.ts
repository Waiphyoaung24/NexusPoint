import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { order, member, branch } from "@repo/db";
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

const orderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.string(),
  notes: z.string().optional(),
});

export const orderRouter = router({
  // Create a new order (called by Flutter POS and delivery webhooks)
  create: protectedProcedure
    .input(
      z.object({
        branchId: z.string().optional(),
        externalOrderId: z.string().optional(),
        source: z.enum(["pos", "grab", "wongnai", "lineman"]).default("pos"),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        items: z.array(orderItemSchema).min(1),
        subtotal: z.string(),
        discount: z.string().optional(),
        total: z.string(),
        notes: z.string().optional(),
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

      const [newOrder] = await ctx.db
        .insert(order)
        .values({
          organizationId: orgId,
          branchId: resolvedBranchId,
          externalOrderId: input.externalOrderId,
          source: input.source,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          items: input.items,
          subtotal: input.subtotal,
          discount: input.discount ?? "0",
          total: input.total,
          notes: input.notes,
        })
        .returning();

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
});
