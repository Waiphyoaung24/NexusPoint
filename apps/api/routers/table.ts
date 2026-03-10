// Table CRUD + status updates (FR-010, F-002)
// Grid coordinate system: positionX = col (0–23), positionY = row (0–15)

import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { member, restaurantTable } from "@repo/db";
import { router, protectedProcedure } from "../lib/trpc.js";
import type { TRPCContext } from "../lib/context.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function requireManagerRole(
  ctx: TRPCContext & {
    user: NonNullable<TRPCContext["user"]>;
    session: NonNullable<TRPCContext["session"]>;
  },
  organizationId: string,
) {
  const membership = await ctx.db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.userId, ctx.user.id),
        eq(member.organizationId, organizationId),
      ),
    )
    .limit(1);
  const role = membership[0]?.role;
  if (role !== "owner" && role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Manager role required",
    });
  }
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const tableShapeSchema = z.enum(["round", "rectangle", "bar_stool"]);
const tableStatusSchema = z.enum([
  "available",
  "occupied",
  "reserved",
  "cleaning",
]);

// Grid constraints: 24 columns (0–23), 16 rows (0–15)
const gridColSchema = z.number().int().min(0).max(23);
const gridRowSchema = z.number().int().min(0).max(15);

// ─── Router ───────────────────────────────────────────────────────────────────

export const tableRouter = router({
  // Lightweight status-only payload for 2-second polling on mobile
  listWithStatus: protectedProcedure
    .input(z.object({ branchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      return ctx.db
        .select({
          id: restaurantTable.id,
          number: restaurantTable.number,
          status: restaurantTable.status,
          positionX: restaurantTable.positionX,
          positionY: restaurantTable.positionY,
        })
        .from(restaurantTable)
        .where(
          and(
            eq(restaurantTable.organizationId, orgId),
            eq(restaurantTable.branchId, input.branchId),
            eq(restaurantTable.isActive, true),
          ),
        )
        .orderBy(asc(restaurantTable.number));
    }),

  // Full table data for initial sync / admin editor
  list: protectedProcedure
    .input(z.object({ branchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      return ctx.db
        .select()
        .from(restaurantTable)
        .where(
          and(
            eq(restaurantTable.organizationId, orgId),
            eq(restaurantTable.branchId, input.branchId),
            eq(restaurantTable.isActive, true),
          ),
        )
        .orderBy(asc(restaurantTable.number));
    }),

  create: protectedProcedure
    .input(
      z.object({
        branchId: z.string(),
        number: z.number().int().min(1).max(99),
        seats: z.number().int().min(1).max(20).default(4),
        shape: tableShapeSchema.default("rectangle"),
        label: z.string().max(20).optional(),
        positionX: gridColSchema.default(0),
        positionY: gridRowSchema.default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      // Enforce unique table number per branch
      const existing = await ctx.db
        .select({ id: restaurantTable.id })
        .from(restaurantTable)
        .where(
          and(
            eq(restaurantTable.branchId, input.branchId),
            eq(restaurantTable.number, input.number),
            eq(restaurantTable.isActive, true),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Table ${input.number} already exists in this branch`,
        });
      }

      const [created] = await ctx.db
        .insert(restaurantTable)
        .values({
          organizationId: orgId,
          branchId: input.branchId,
          number: input.number,
          seats: input.seats,
          shape: input.shape,
          label: input.label,
          positionX: input.positionX.toString(),
          positionY: input.positionY.toString(),
          status: "available",
          isActive: true,
        })
        .returning();

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        seats: z.number().int().min(1).max(20).optional(),
        shape: tableShapeSchema.optional(),
        label: z.string().max(20).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      const { id, ...updates } = input;
      const [updated] = await ctx.db
        .update(restaurantTable)
        .set(updates)
        .where(
          and(
            eq(restaurantTable.id, id),
            eq(restaurantTable.organizationId, orgId),
          ),
        )
        .returning();

      if (!updated)
        throw new TRPCError({ code: "NOT_FOUND", message: "Table not found" });
      return updated;
    }),

  // POS devices call this when opening/closing orders
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: tableStatusSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const [updated] = await ctx.db
        .update(restaurantTable)
        .set({ status: input.status })
        .where(
          and(
            eq(restaurantTable.id, input.id),
            eq(restaurantTable.organizationId, orgId),
          ),
        )
        .returning({ id: restaurantTable.id, status: restaurantTable.status });

      if (!updated)
        throw new TRPCError({ code: "NOT_FOUND", message: "Table not found" });
      return updated;
    }),

  // Admin saves all table positions after drag session
  batchUpdatePositions: protectedProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.string(),
            positionX: gridColSchema,
            positionY: gridRowSchema,
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      // Execute all position updates in a single transaction
      await ctx.db.transaction(async (tx) => {
        for (const { id, positionX, positionY } of input.updates) {
          await tx
            .update(restaurantTable)
            .set({
              positionX: positionX.toString(),
              positionY: positionY.toString(),
            })
            .where(
              and(
                eq(restaurantTable.id, id),
                eq(restaurantTable.organizationId, orgId),
              ),
            );
        }
      });

      return { updated: input.updates.length };
    }),

  // Soft delete — preserves order history
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      const [deleted] = await ctx.db
        .update(restaurantTable)
        .set({ isActive: false })
        .where(
          and(
            eq(restaurantTable.id, input.id),
            eq(restaurantTable.organizationId, orgId),
          ),
        )
        .returning({ id: restaurantTable.id });

      if (!deleted)
        throw new TRPCError({ code: "NOT_FOUND", message: "Table not found" });
      return deleted;
    }),
});
