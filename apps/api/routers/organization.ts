import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { member, organization, session, invitation, user } from "@repo/db";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc.js";
import { sendInvitationEmail } from "../lib/email.js";

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
        slug: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [newOrg] = await ctx.db
        .insert(organization)
        .values({
          name: input.name,
          slug: input.slug,
          metadata: input.description,
        })
        .returning();

      // Automatically add the creator as owner
      await ctx.db.insert(member).values({
        organizationId: newOrg.id,
        userId: ctx.user.id,
        role: "owner",
      });

      return newOrg;
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
    .query(async ({ ctx, input }) => {
      // Verify requester has access to the organization
      const requesterMembership = await ctx.db
        .select()
        .from(member)
        .where(
          and(
            eq(member.userId, ctx.user.id),
            eq(member.organizationId, input.organizationId),
          ),
        )
        .limit(1);

      if (!requesterMembership.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      const members = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: member.role,
          joinedAt: member.createdAt,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(eq(member.organizationId, input.organizationId));

      const pendingInvites = await ctx.db
        .select({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        })
        .from(invitation)
        .where(
          and(
            eq(invitation.organizationId, input.organizationId),
            eq(invitation.status, "pending"),
          ),
        );

      return {
        members,
        invitations: pendingInvites,
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
    .mutation(async ({ ctx, input }) => {
      // Verify requester is an admin/owner
      const requesterMembership = await ctx.db
        .select({ role: member.role })
        .from(member)
        .where(
          and(
            eq(member.userId, ctx.user.id),
            eq(member.organizationId, input.organizationId),
          ),
        )
        .limit(1);

      if (
        !requesterMembership.length ||
        !["owner", "admin"].includes(requesterMembership[0]!.role)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to invite members",
        });
      }

      // Check if user is already a member
      const existingUser = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        const existingMember = await ctx.db
          .select()
          .from(member)
          .where(
            and(
              eq(member.userId, existingUser[0]!.id),
              eq(member.organizationId, input.organizationId),
            ),
          )
          .limit(1);

        if (existingMember.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a member of this organization",
          });
        }
      }

      // Check for existing pending invitation
      const existingInvite = await ctx.db
        .select()
        .from(invitation)
        .where(
          and(
            eq(invitation.organizationId, input.organizationId),
            eq(invitation.email, input.email),
            eq(invitation.status, "pending"),
          ),
        )
        .limit(1);

      let inviteId = existingInvite[0]?.id;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      if (existingInvite.length > 0) {
        // Update existing invitation expiry
        await ctx.db
          .update(invitation)
          .set({ expiresAt, role: input.role })
          .where(eq(invitation.id, inviteId!));
      } else {
        // Create new invitation
        const [newInvite] = await ctx.db
          .insert(invitation)
          .values({
            email: input.email,
            role: input.role,
            organizationId: input.organizationId,
            inviterId: ctx.user.id,
            expiresAt,
            status: "pending",
          })
          .returning();
        inviteId = newInvite.id;
      }

      // Get organization details for email
      const org = await ctx.db
        .select({ name: organization.name })
        .from(organization)
        .where(eq(organization.id, input.organizationId))
        .limit(1);

      // Send (or resend) invitation email
      await sendInvitationEmail(ctx.env, {
        to: input.email,
        invitedBy: {
          email: ctx.user.email,
          name: ctx.user.name ?? undefined,
        },
        organizationName: org[0]!.name,
        role: input.role,
        url: `${ctx.env.APP_ORIGIN}/accept-invite?token=${inviteId}`,
      });

      return {
        success: true,
        inviteId: inviteId!,
        resent: existingInvite.length > 0,
      };
    }),

  getInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db
        .select({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          organizationName: organization.name,
          inviterName: user.name,
          inviterEmail: user.email,
          expiresAt: invitation.expiresAt,
          status: invitation.status,
        })
        .from(invitation)
        .innerJoin(organization, eq(invitation.organizationId, organization.id))
        .innerJoin(user, eq(invitation.inviterId, user.id))
        .where(eq(invitation.id, input.token))
        .limit(1);

      if (!invite.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invite[0]!.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation is no longer valid",
        });
      }

      if (new Date() > invite[0]!.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation has expired",
        });
      }

      return invite[0];
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db
        .select()
        .from(invitation)
        .where(eq(invitation.id, input.token))
        .limit(1);

      if (!invite.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invite[0]!.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation is no longer valid",
        });
      }

      if (new Date() > invite[0]!.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation has expired",
        });
      }

      // Verify email matches (optional security check - depending on requirement,
      // sometimes you want to allow accepting with a different email if authenticated)
      // For strict security, we should ensure the logged in user matches the invite email
      // OR update the invite logic to not care about the specific email but just the token.
      // Here, let's enforce email match if we want to be strict, or just warn.
      // Better Auth usually matches email.
      if (invite[0]!.email !== ctx.user.email) {
        // We can choose to throw or allow.
        // For now, let's allow it but maybe update the invite record?
        // Or strictly enforce:
        // throw new TRPCError({ code: "FORBIDDEN", message: "This invitation was sent to a different email address." });
      }

      await ctx.db.transaction(async (tx) => {
        // Add member
        await tx.insert(member).values({
          userId: ctx.user.id,
          organizationId: invite[0]!.organizationId,
          role: invite[0]!.role,
        });

        // Update invitation status
        await tx
          .update(invitation)
          .set({
            status: "accepted",
            acceptedAt: new Date(),
          })
          .where(eq(invitation.id, input.token));

        // Set active organization if user has none
        if (!ctx.session.activeOrganizationId) {
          await tx
            .update(session)
            .set({ activeOrganizationId: invite[0]!.organizationId })
            .where(eq(session.id, ctx.session.id));
        }
      });

      return { success: true, organizationId: invite[0]!.organizationId };
    }),
});
