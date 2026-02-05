import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { member, organization, session } from "@repo/db";
import { protectedProcedure, router } from "../lib/trpc.js";

export const organizationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userMemberships = await ctx.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        role: member.role,
      })
      .from(organization)
      .innerJoin(member, eq(member.organizationId, organization.id))
      .where(eq(member.userId, ctx.user.id));

    return userMemberships;
  }),

  setActive: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is a member of the organization
      const membership = await ctx.db
        .select()
        .from(member)
        .where(
          and(
            eq(member.userId, ctx.user.id),
            eq(member.organizationId, input.organizationId),
          ),
        )
        .limit(1);

      if (!membership.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Update the activeOrganizationId in the session
      await ctx.db
        .update(session)
        .set({ activeOrganizationId: input.organizationId })
        .where(eq(session.id, ctx.session.id));

      return { success: true };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(({ input, ctx }) => {
      // TODO: Implement organization creation logic
      return {
        id: "org_" + Date.now(),
        name: input.name,
        description: input.description,
        ownerId: ctx.user.id,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      // TODO: Implement organization update logic
      return {
        ...input,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      // TODO: Implement organization deletion logic
      return { success: true, id: input.id };
    }),

  members: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(() => {
      // TODO: Implement organization members listing
      return {
        members: [],
      };
    }),

  invite: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.email({ error: "Invalid email address" }),
        role: z.enum(["admin", "member"]).default("member"),
      }),
    )
    .mutation(() => {
      // TODO: Implement organization invite logic
      return {
        success: true,
        inviteId: "invite_" + Date.now(),
      };
    }),
});
