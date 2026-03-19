// Staff management + Manager PIN verification (F-009, FR-027)

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, or } from "drizzle-orm";
import { branchMember } from "@repo/db";
import { router, protectedProcedure } from "../lib/trpc.js";

/** SHA-256 hash using Web Crypto API (Cloudflare Workers compatible) */
async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const staffRouter = router({
  // List branch members for a branch
  list: protectedProcedure
    .input(z.object({ branchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.session?.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      return ctx.db
        .select()
        .from(branchMember)
        .where(
          and(
            eq(branchMember.organizationId, orgId),
            eq(branchMember.branchId, input.branchId),
          ),
        );
    }),

  // Get a single branch member
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.session?.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      const result = await ctx.db
        .select()
        .from(branchMember)
        .where(
          and(
            eq(branchMember.id, input.id),
            eq(branchMember.organizationId, orgId),
          ),
        )
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff member not found",
        });
      }
      return result[0];
    }),

  // Assign a user to a branch with a role
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        branchId: z.string(),
        staffRole: z.enum(["owner", "manager", "cashier", "waiter", "kitchen"]),
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

      const [created] = await ctx.dbDirect
        .insert(branchMember)
        .values({
          organizationId: orgId,
          branchId: input.branchId,
          userId: input.userId,
          staffRole: input.staffRole,
        })
        .returning();

      return created;
    }),

  // Update role or active status
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        staffRole: z
          .enum(["owner", "manager", "cashier", "waiter", "kitchen"])
          .optional(),
        isActive: z.boolean().optional(),
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
      if (input.staffRole !== undefined) updateData.staffRole = input.staffRole;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      const [updated] = await ctx.dbDirect
        .update(branchMember)
        .set(updateData)
        .where(
          and(
            eq(branchMember.id, input.id),
            eq(branchMember.organizationId, orgId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff member not found",
        });
      }
      return updated;
    }),

  // Set or reset Manager PIN (owner/manager only)
  setPin: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        pin: z
          .string()
          .length(4)
          .regex(/^\d{4}$/, "PIN must be 4 digits"),
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

      // Verify the target is owner or manager
      const target = await ctx.db
        .select()
        .from(branchMember)
        .where(
          and(
            eq(branchMember.id, input.id),
            eq(branchMember.organizationId, orgId),
          ),
        )
        .limit(1);

      if (!target[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff member not found",
        });
      }
      if (
        target[0].staffRole !== "owner" &&
        target[0].staffRole !== "manager"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PIN can only be set for owner or manager roles",
        });
      }

      const pinHash = await hashPin(input.pin);

      const [updated] = await ctx.dbDirect
        .update(branchMember)
        .set({
          managerPinHash: pinHash,
          pinFailedAttempts: 0,
          pinLockedUntil: null,
        })
        .where(
          and(
            eq(branchMember.id, input.id),
            eq(branchMember.organizationId, orgId),
          ),
        )
        .returning();

      return { success: true, id: updated?.id };
    }),

  // Remove PIN
  removePin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session?.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      const [updated] = await ctx.dbDirect
        .update(branchMember)
        .set({
          managerPinHash: null,
          pinFailedAttempts: 0,
          pinLockedUntil: null,
        })
        .where(
          and(
            eq(branchMember.id, input.id),
            eq(branchMember.organizationId, orgId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff member not found",
        });
      }
      return { success: true };
    }),

  // List managers at a branch (for mobile PIN dropdown)
  listManagers: protectedProcedure
    .input(z.object({ branchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.session?.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      return ctx.db
        .select({
          id: branchMember.id,
          userId: branchMember.userId,
          staffRole: branchMember.staffRole,
        })
        .from(branchMember)
        .where(
          and(
            eq(branchMember.organizationId, orgId),
            eq(branchMember.branchId, input.branchId),
            eq(branchMember.isActive, true),
            or(
              eq(branchMember.staffRole, "owner"),
              eq(branchMember.staffRole, "manager"),
            ),
          ),
        );
    }),

  // Verify Manager PIN (server-side, F-009)
  verifyManagerPin: protectedProcedure
    .input(
      z.object({
        managerId: z.string(),
        pin: z
          .string()
          .length(4)
          .regex(/^\d{4}$/, "PIN must be 4 digits"),
        branchId: z.string(),
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

      // Look up the manager's branch_member record
      const result = await ctx.db
        .select()
        .from(branchMember)
        .where(
          and(
            eq(branchMember.id, input.managerId),
            eq(branchMember.organizationId, orgId),
            eq(branchMember.branchId, input.branchId),
          ),
        )
        .limit(1);

      const manager = result[0];
      if (!manager) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Manager not found at this branch",
        });
      }

      // Must be owner or manager
      if (manager.staffRole !== "owner" && manager.staffRole !== "manager") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owner or manager can approve",
        });
      }

      if (!manager.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Staff member is deactivated",
        });
      }

      if (!manager.managerPinHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Manager has no PIN set",
        });
      }

      // Check lockout (5 failed attempts, 5-minute window)
      if (manager.pinLockedUntil && manager.pinLockedUntil > new Date()) {
        const remainingMs = manager.pinLockedUntil.getTime() - Date.now();
        const remainingSec = Math.ceil(remainingMs / 1000);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `PIN locked. Try again in ${remainingSec} seconds.`,
        });
      }

      // Verify PIN
      const inputHash = await hashPin(input.pin);

      if (inputHash !== manager.managerPinHash) {
        // Increment failed attempts
        const newAttempts = (manager.pinFailedAttempts ?? 0) + 1;
        const lockUntil =
          newAttempts >= 5
            ? new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
            : null;

        await ctx.dbDirect
          .update(branchMember)
          .set({
            pinFailedAttempts: newAttempts,
            pinLockedUntil: lockUntil,
          })
          .where(eq(branchMember.id, manager.id));

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            newAttempts >= 5
              ? "Too many failed attempts. PIN locked for 5 minutes."
              : `Incorrect PIN. ${5 - newAttempts} attempts remaining.`,
        });
      }

      // PIN correct — reset counter
      await ctx.dbDirect
        .update(branchMember)
        .set({ pinFailedAttempts: 0, pinLockedUntil: null })
        .where(eq(branchMember.id, manager.id));

      return { verified: true, managerId: manager.id };
    }),
});
