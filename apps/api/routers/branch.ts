import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { branch } from "@repo/db";
import { router, protectedProcedure } from "../lib/trpc.js";

export const branchRouter = router({
  // List branches for the current organization
  list: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.session?.activeOrganizationId;
    if (!orgId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization selected",
      });
    }

    return ctx.db
      .select()
      .from(branch)
      .where(and(eq(branch.organizationId, orgId), eq(branch.isActive, true)));
  }),

  // Get a single branch by ID
  get: protectedProcedure
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
        .from(branch)
        .where(and(eq(branch.id, input.id), eq(branch.organizationId, orgId)))
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Branch not found",
        });
      }

      return result[0];
    }),

  // Create a new branch
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional(),
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

      const [newBranch] = await ctx.db
        .insert(branch)
        .values({
          organizationId: orgId,
          name: input.name,
          address: input.address,
        })
        .returning();

      return newBranch;
    }),

  // Update a branch
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
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

      const [updated] = await ctx.db
        .update(branch)
        .set({
          name: input.name,
          address: input.address,
          isActive: input.isActive,
        })
        .where(and(eq(branch.id, input.id), eq(branch.organizationId, orgId)))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Branch not found",
        });
      }

      return updated;
    }),
});
