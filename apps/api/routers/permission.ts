// Permission matrix CRUD (F-009, FR-027)

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { rolePermission } from "@repo/db";
import { router, protectedProcedure } from "../lib/trpc.js";
// Inline seed logic to avoid cross-rootDir import from @repo/db/scripts
// See db/scripts/seed-permissions.ts for standalone backfill script
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { DatabaseSchema } from "@repo/db";

const ROLES = ["owner", "manager", "cashier", "waiter", "kitchen"] as const;
type Perm = { allowed: boolean; requiresPin: boolean };
const A: Perm = { allowed: true, requiresPin: false };
const P: Perm = { allowed: true, requiresPin: true };
const D: Perm = { allowed: false, requiresPin: false };
type Row = { action: string } & Record<(typeof ROLES)[number], Perm>;

const MATRIX: Row[] = [
  {
    action: "order.create",
    owner: A,
    manager: A,
    cashier: A,
    waiter: A,
    kitchen: D,
  },
  {
    action: "order.view",
    owner: A,
    manager: A,
    cashier: A,
    waiter: A,
    kitchen: A,
  },
  {
    action: "order.void",
    owner: A,
    manager: P,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "order.cancel",
    owner: A,
    manager: P,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "discount.apply",
    owner: A,
    manager: P,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "refund.issue",
    owner: A,
    manager: P,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "payment.process",
    owner: A,
    manager: A,
    cashier: A,
    waiter: D,
    kitchen: D,
  },
  {
    action: "menu.manage",
    owner: A,
    manager: A,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "staff.manage",
    owner: A,
    manager: D,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "report.view",
    owner: A,
    manager: A,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "table.manage",
    owner: A,
    manager: A,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "floorplan.edit",
    owner: A,
    manager: A,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "zreport.generate",
    owner: A,
    manager: P,
    cashier: D,
    waiter: D,
    kitchen: D,
  },
  {
    action: "kds.view",
    owner: A,
    manager: A,
    cashier: D,
    waiter: D,
    kitchen: A,
  },
];

async function seedDefaults(
  db: PostgresJsDatabase<DatabaseSchema>,
  orgId: string,
) {
  const rows = MATRIX.flatMap((entry) =>
    ROLES.map((role) => ({
      organizationId: orgId,
      role,
      action: entry.action,
      allowed: entry[role].allowed,
      requiresPin: entry[role].requiresPin,
    })),
  );
  await db
    .insert(rolePermission)
    .values(rows)
    .onConflictDoNothing({
      target: [
        rolePermission.organizationId,
        rolePermission.role,
        rolePermission.action,
      ],
    });
}

export const permissionRouter = router({
  // Get full permission matrix for current org (70 rows)
  getMatrix: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.session?.activeOrganizationId;
    if (!orgId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization selected",
      });
    }

    return ctx.db
      .select()
      .from(rolePermission)
      .where(eq(rolePermission.organizationId, orgId));
  }),

  // Update a single permission cell
  update: protectedProcedure
    .input(
      z.object({
        role: z.enum(["owner", "manager", "cashier", "waiter", "kitchen"]),
        action: z.string(),
        allowed: z.boolean().optional(),
        requiresPin: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session?.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      const updateData: Record<string, unknown> = {};
      if (input.allowed !== undefined) updateData.allowed = input.allowed;
      if (input.requiresPin !== undefined)
        updateData.requiresPin = input.requiresPin;

      const [updated] = await ctx.dbDirect
        .update(rolePermission)
        .set(updateData)
        .where(
          and(
            eq(rolePermission.organizationId, orgId),
            eq(rolePermission.role, input.role),
            eq(rolePermission.action, input.action),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Permission entry not found",
        });
      }
      return updated;
    }),

  // Bulk update multiple permission cells
  bulkUpdate: protectedProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            role: z.enum(["owner", "manager", "cashier", "waiter", "kitchen"]),
            action: z.string(),
            allowed: z.boolean(),
            requiresPin: z.boolean(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session?.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      const results = [];
      for (const update of input.updates) {
        const [updated] = await ctx.dbDirect
          .update(rolePermission)
          .set({
            allowed: update.allowed,
            requiresPin: update.requiresPin,
          })
          .where(
            and(
              eq(rolePermission.organizationId, orgId),
              eq(rolePermission.role, update.role),
              eq(rolePermission.action, update.action),
            ),
          )
          .returning();
        if (updated) results.push(updated);
      }

      return { updated: results.length };
    }),

  // Reset to defaults (delete all + re-seed)
  resetDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    const orgId = ctx.session?.activeOrganizationId;
    if (!orgId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization selected",
      });
    }

    // Delete all existing permissions for this org
    await ctx.dbDirect
      .delete(rolePermission)
      .where(eq(rolePermission.organizationId, orgId));

    // Re-seed defaults
    await seedDefaults(ctx.dbDirect, orgId);

    return { success: true };
  }),
});
