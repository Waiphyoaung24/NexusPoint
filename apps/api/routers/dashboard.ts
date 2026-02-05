import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, sum, count } from "drizzle-orm";
import { order, menuItem, member } from "@repo/db";
import { router, protectedProcedure } from "../lib/trpc.js";

export const dashboardRouter = router({
  // Get dashboard statistics
  getStats: protectedProcedure
    .input(z.object({ branchId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      let orgId = ctx.session.activeOrganizationId;

      // If no active org in session, try to find user's first organization
      if (!orgId) {
        const userMemberships = await ctx.db
          .select({ organizationId: member.organizationId })
          .from(member)
          .where(eq(member.userId, ctx.user.id))
          .limit(1);

        if (userMemberships.length > 0) {
          orgId = userMemberships[0].organizationId;
        } else {
          // No organization membership - return empty stats
          return {
            revenue: "0",
            totalOrders: 0,
            activeItems: 0,
            totalUsers: 0,
          };
        }
      }

      const branchId = input?.branchId;

      // Base conditions for organization
      const orgCondition = eq(order.organizationId, orgId);
      const menuOrgCondition = eq(menuItem.organizationId, orgId);
      const memberOrgCondition = eq(member.organizationId, orgId);

      // Branch conditions
      const branchCondition = branchId
        ? eq(order.branchId, branchId)
        : undefined;
      const menuBranchCondition = branchId
        ? eq(menuItem.branchId, branchId)
        : undefined;

      // 1. Fetch Total Revenue and Order Count
      const orderStats = await ctx.db
        .select({
          revenue: sum(order.total),
          count: count(order.id),
        })
        .from(order)
        .where(and(orgCondition, branchCondition));

      // 2. Fetch Active Items Count
      const menuStats = await ctx.db
        .select({
          count: count(menuItem.id),
        })
        .from(menuItem)
        .where(
          and(
            menuOrgCondition,
            menuBranchCondition,
            eq(menuItem.isAvailable, true),
          ),
        );

      // 3. Fetch Total Users (Members)
      const userStats = await ctx.db
        .select({
          count: count(member.id),
        })
        .from(member)
        .where(memberOrgCondition);

      return {
        revenue: orderStats[0]?.revenue || "0",
        totalOrders: orderStats[0]?.count || 0,
        activeItems: menuStats[0]?.count || 0,
        totalUsers: userStats[0]?.count || 0,
      };
    }),
});
