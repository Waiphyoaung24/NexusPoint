import { initTRPC, TRPCError, type TRPCProcedureBuilder } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { flattenError, ZodError } from "zod";
import { branchMember, rolePermission } from "@repo/db";
import type { TRPCContext } from "./context.js";

const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? flattenError(error.cause) : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Derive type from publicProcedure to stay in sync with initTRPC config.
// Explicit annotation required to avoid TS2742 (non-portable inferred type).
type ProtectedProcedure =
  typeof publicProcedure extends TRPCProcedureBuilder<
    infer TContext,
    infer TMeta,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer TContextOverrides,
    infer TInputIn,
    infer TInputOut,
    infer TOutputIn,
    infer TOutputOut,
    infer TCaller
  >
    ? TRPCProcedureBuilder<
        TContext,
        TMeta,
        {
          session: NonNullable<TRPCContext["session"]>;
          user: NonNullable<TRPCContext["user"]>;
        },
        TInputIn,
        TInputOut,
        TOutputIn,
        TOutputOut,
        TCaller
      >
    : never;

export const protectedProcedure: ProtectedProcedure = t.procedure.use(
  ({ ctx, next }) => {
    if (!ctx.session || !ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.user,
      },
    });
  },
);

// ---------------------------------------------------------------------------
// F-009: Branch member resolution + permission middleware
// ---------------------------------------------------------------------------

const BRANCH_MEMBER_CACHE_KEY = Symbol("branchMember");

/**
 * Middleware that resolves the user's branch_member for the active branch.
 * Caches the result in ctx.cache for the request lifetime.
 */
const _withBranchMember = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const orgId = ctx.session.activeOrganizationId;
  if (!orgId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No organization selected",
    });
  }

  // Check cache first (avoids repeat queries within same request)
  const cached = ctx.cache.get(BRANCH_MEMBER_CACHE_KEY);
  if (cached !== undefined) {
    const member = cached as (typeof result)[0] | null;
    return next({
      ctx: {
        ...ctx,
        branchMember: member ?? null,
        staffRole: member?.staffRole ?? null,
      },
    });
  }

  // Resolve branch — use branchId from request headers or first active branch
  const branchIdHeader = ctx.req.headers.get("x-branch-id");

  const result = branchIdHeader
    ? await ctx.db
        .select()
        .from(branchMember)
        .where(
          and(
            eq(branchMember.userId, ctx.user.id),
            eq(branchMember.organizationId, orgId),
            eq(branchMember.branchId, branchIdHeader),
          ),
        )
        .limit(1)
    : await ctx.db
        .select()
        .from(branchMember)
        .where(
          and(
            eq(branchMember.userId, ctx.user.id),
            eq(branchMember.organizationId, orgId),
            eq(branchMember.isActive, true),
          ),
        )
        .limit(1);

  const member = result[0] ?? null;
  ctx.cache.set(BRANCH_MEMBER_CACHE_KEY, member);

  return next({
    ctx: {
      ...ctx,
      branchMember: member,
      staffRole: member?.staffRole ?? null,
    },
  });
});

/**
 * Creates a middleware that checks if the user's role has permission for the given action.
 * Sets ctx.permissionRequiresPin if the action needs Manager PIN approval.
 *
 * Usage: `protectedProcedure.use(requirePermission("order.void"))`
 */
export function requirePermission(action: string) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session || !ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const orgId = ctx.session.activeOrganizationId;
    if (!orgId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization selected",
      });
    }

    // Ensure branchMember is resolved
    let member = (ctx as TRPCContext).branchMember;
    if (!member) {
      const result = await ctx.db
        .select()
        .from(branchMember)
        .where(
          and(
            eq(branchMember.userId, ctx.user.id),
            eq(branchMember.organizationId, orgId),
            eq(branchMember.isActive, true),
          ),
        )
        .limit(1);
      member = result[0] ?? null;
    }

    if (!member || !member.isActive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active staff assignment for this branch",
      });
    }

    // Look up permission for this role + action
    const perms = await ctx.db
      .select()
      .from(rolePermission)
      .where(
        and(
          eq(rolePermission.organizationId, orgId),
          eq(rolePermission.role, member.staffRole),
          eq(rolePermission.action, action),
        ),
      )
      .limit(1);

    const perm = perms[0];
    if (!perm || !perm.allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Role "${member.staffRole}" does not have permission for "${action}"`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        branchMember: member,
        staffRole: member.staffRole,
        permissionRequiresPin: perm.requiresPin,
      },
    });
  });
}
