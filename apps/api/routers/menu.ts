import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { menuItem, menuMapping, member } from "@repo/db";
import { router, protectedProcedure } from "../lib/trpc.js";
import type { TRPCContext } from "../lib/context.js";

/**
 * Helper to get organization ID with fallback for legacy sessions.
 * If session lacks activeOrganizationId (old sessions before auto-select),
 * fetches user's first organization membership.
 *
 * @param ctx - Context from protectedProcedure (user and session guaranteed non-null)
 */
async function getOrganizationId(
  ctx: TRPCContext & {
    user: NonNullable<TRPCContext["user"]>;
    session: NonNullable<TRPCContext["session"]>;
  },
): Promise<string> {
  let orgId = ctx.session.activeOrganizationId;

  // Fallback for legacy sessions without activeOrganizationId
  if (!orgId) {
    const userMemberships = await ctx.db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, ctx.user.id))
      .limit(1);

    if (userMemberships.length > 0) {
      orgId = userMemberships[0].organizationId;
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization selected",
      });
    }
  }

  return orgId;
}

export const menuRouter = router({
  // List all menu items for the current organization
  listItems: protectedProcedure
    .input(z.object({ branchId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const conditions = [eq(menuItem.organizationId, orgId)];
      if (input?.branchId) {
        conditions.push(eq(menuItem.branchId, input.branchId));
      }

      return ctx.db
        .select()
        .from(menuItem)
        .where(and(...conditions))
        .orderBy(menuItem.sortOrder, menuItem.name);
    }),

  // Get a single menu item by ID
  getItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const result = await ctx.db
        .select()
        .from(menuItem)
        .where(
          and(eq(menuItem.id, input.id), eq(menuItem.organizationId, orgId)),
        )
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }

      return result[0];
    }),

  // Create a new menu item
  createItem: protectedProcedure
    .input(
      z.object({
        sku: z.string().min(1),
        name: z.string().min(1),
        nameTh: z.string().optional(),
        description: z.string().optional(),
        price: z.string(), // numeric is returned as string
        category: z.string().optional(),
        isAvailable: z.boolean().default(true),
        sortOrder: z.number().default(0),
        branchId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const [newItem] = await ctx.db
        .insert(menuItem)
        .values({
          organizationId: orgId,
          branchId: input.branchId,
          sku: input.sku,
          name: input.name,
          nameTh: input.nameTh,
          description: input.description,
          price: input.price,
          category: input.category,
          isAvailable: input.isAvailable,
          sortOrder: input.sortOrder,
        })
        .returning();

      return newItem;
    }),

  // Update a menu item
  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        sku: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        nameTh: z.string().optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        category: z.string().optional(),
        isAvailable: z.boolean().optional(),
        sortOrder: z.number().optional(),
        branchId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const [updated] = await ctx.db
        .update(menuItem)
        .set({
          sku: input.sku,
          name: input.name,
          nameTh: input.nameTh,
          description: input.description,
          price: input.price,
          category: input.category,
          isAvailable: input.isAvailable,
          sortOrder: input.sortOrder,
          branchId: input.branchId,
        })
        .where(
          and(eq(menuItem.id, input.id), eq(menuItem.organizationId, orgId)),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }

      return updated;
    }),

  // Delete a menu item
  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const [deleted] = await ctx.db
        .delete(menuItem)
        .where(
          and(eq(menuItem.id, input.id), eq(menuItem.organizationId, orgId)),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }

      return deleted;
    }),

  // List all mappings for the current organization
  listMappings: protectedProcedure
    .input(z.object({ menuItemId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const conditions = [eq(menuMapping.organizationId, orgId)];
      if (input?.menuItemId) {
        conditions.push(eq(menuMapping.menuItemId, input.menuItemId));
      }

      return ctx.db
        .select()
        .from(menuMapping)
        .where(and(...conditions));
    }),

  // Create or update a mapping
  upsertMapping: protectedProcedure
    .input(
      z.object({
        menuItemId: z.string(),
        platform: z.enum(["grab", "wongnai", "lineman"]),
        externalId: z.string(),
        externalName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      // Check if item exists and belongs to org
      const item = await ctx.db
        .select()
        .from(menuItem)
        .where(
          and(
            eq(menuItem.id, input.menuItemId),
            eq(menuItem.organizationId, orgId),
          ),
        )
        .limit(1);

      if (!item[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }

      const [upserted] = await ctx.db
        .insert(menuMapping)
        .values({
          organizationId: orgId,
          menuItemId: input.menuItemId,
          platform: input.platform,
          externalId: input.externalId,
          externalName: input.externalName,
        })
        .onConflictDoUpdate({
          target: [menuMapping.menuItemId, menuMapping.platform],
          set: {
            externalId: input.externalId,
            externalName: input.externalName,
            updatedAt: new Date(),
          },
        })
        .returning();

      return upserted;
    }),

  // Delete a mapping
  deleteMapping: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const [deleted] = await ctx.db
        .delete(menuMapping)
        .where(
          and(
            eq(menuMapping.id, input.id),
            eq(menuMapping.organizationId, orgId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mapping not found",
        });
      }

      return deleted;
    }),
});
