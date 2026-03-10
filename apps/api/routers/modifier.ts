// Modifier groups, options, and menu item assignments (FR-002)

import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  member,
  menuItem,
  menuItemModifierGroup,
  modifierGroup,
  modifierOption,
} from "@repo/db";
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

/** Restrict mutations to owner/manager roles only. */
async function requireManagerRole(
  ctx: TRPCContext & {
    user: NonNullable<TRPCContext["user"]>;
    session: NonNullable<TRPCContext["session"]>;
  },
  orgId: string,
): Promise<void> {
  const membership = await ctx.db
    .select({ role: member.role })
    .from(member)
    .where(
      and(eq(member.userId, ctx.user.id), eq(member.organizationId, orgId)),
    )
    .limit(1);

  const role = membership[0]?.role;
  if (role !== "owner" && role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Owner or manager role required",
    });
  }
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const createModifierGroupInput = z.object({
  branchId: z.string().optional(),
  name: z.string().min(1).max(100),
  nameTh: z.string().max(100).optional(),
  isRequired: z.boolean().default(false),
  minSelections: z.number().int().min(0).default(0),
  maxSelections: z.number().int().min(1).default(1),
  sortOrder: z.number().int().default(0),
});

const updateModifierGroupInput = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  nameTh: z.string().max(100).optional(),
  isRequired: z.boolean().optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const createModifierOptionInput = z.object({
  modifierGroupId: z.string(),
  name: z.string().min(1).max(100),
  nameTh: z.string().max(100).optional(),
  priceAdjustment: z
    .string()
    .regex(/^-?\d+(\.\d{1,2})?$/, "Must be a valid price (e.g. 10, -5, 0)")
    .default("0"),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const updateModifierOptionInput = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  nameTh: z.string().max(100).optional(),
  priceAdjustment: z
    .string()
    .regex(/^-?\d+(\.\d{1,2})?$/)
    .optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const modifierRouter = router({
  // ── Group queries ────────────────────────────────────────────────────────

  /** List all active modifier groups with their options nested. */
  list: protectedProcedure
    .input(z.object({ branchId: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      const orgId = await getOrganizationId(ctx);

      const groups = await ctx.db
        .select()
        .from(modifierGroup)
        .where(
          and(
            eq(modifierGroup.organizationId, orgId),
            eq(modifierGroup.isActive, true),
          ),
        )
        .orderBy(asc(modifierGroup.sortOrder), asc(modifierGroup.name));

      const options = await ctx.db
        .select()
        .from(modifierOption)
        .where(
          and(
            eq(modifierOption.organizationId, orgId),
            eq(modifierOption.isActive, true),
          ),
        )
        .orderBy(asc(modifierOption.sortOrder), asc(modifierOption.name));

      // Nest options under their parent group
      return groups.map((g) => ({
        ...g,
        options: options.filter((o) => o.modifierGroupId === g.id),
      }));
    }),

  /** Get a single modifier group with its options. */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const [group] = await ctx.db
        .select()
        .from(modifierGroup)
        .where(
          and(
            eq(modifierGroup.id, input.id),
            eq(modifierGroup.organizationId, orgId),
          ),
        )
        .limit(1);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modifier group not found",
        });
      }

      const options = await ctx.db
        .select()
        .from(modifierOption)
        .where(eq(modifierOption.modifierGroupId, group.id))
        .orderBy(asc(modifierOption.sortOrder));

      return { ...group, options };
    }),

  // ── Group mutations ──────────────────────────────────────────────────────

  /** Create a modifier group. Requires owner/manager role. */
  create: protectedProcedure
    .input(createModifierGroupInput)
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      const [created] = await ctx.db
        .insert(modifierGroup)
        .values({
          organizationId: orgId,
          branchId: input.branchId,
          name: input.name,
          nameTh: input.nameTh,
          isRequired: input.isRequired,
          minSelections: input.minSelections,
          maxSelections: input.maxSelections,
          sortOrder: input.sortOrder,
        })
        .returning();

      return created;
    }),

  /** Update a modifier group. Requires owner/manager role. */
  update: protectedProcedure
    .input(updateModifierGroupInput)
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      const { id, ...fields } = input;

      const [updated] = await ctx.db
        .update(modifierGroup)
        .set({ ...fields, updatedAt: new Date() })
        .where(
          and(
            eq(modifierGroup.id, id),
            eq(modifierGroup.organizationId, orgId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modifier group not found",
        });
      }

      return updated;
    }),

  /** Soft-delete a modifier group (isActive = false). Requires owner/manager. */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      const [deleted] = await ctx.db
        .update(modifierGroup)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(modifierGroup.id, input.id),
            eq(modifierGroup.organizationId, orgId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modifier group not found",
        });
      }

      return deleted;
    }),

  // ── Option mutations ─────────────────────────────────────────────────────

  /** Add an option to a modifier group. */
  addOption: protectedProcedure
    .input(createModifierOptionInput)
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      // Verify the group belongs to this org
      const [group] = await ctx.db
        .select({ id: modifierGroup.id })
        .from(modifierGroup)
        .where(
          and(
            eq(modifierGroup.id, input.modifierGroupId),
            eq(modifierGroup.organizationId, orgId),
          ),
        )
        .limit(1);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modifier group not found",
        });
      }

      const [created] = await ctx.db
        .insert(modifierOption)
        .values({
          organizationId: orgId,
          modifierGroupId: input.modifierGroupId,
          name: input.name,
          nameTh: input.nameTh,
          priceAdjustment: input.priceAdjustment,
          isDefault: input.isDefault,
          sortOrder: input.sortOrder,
        })
        .returning();

      return created;
    }),

  /** Update a modifier option. */
  updateOption: protectedProcedure
    .input(updateModifierOptionInput)
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      const { id, ...fields } = input;

      const [updated] = await ctx.db
        .update(modifierOption)
        .set({ ...fields, updatedAt: new Date() })
        .where(
          and(
            eq(modifierOption.id, id),
            eq(modifierOption.organizationId, orgId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modifier option not found",
        });
      }

      return updated;
    }),

  /** Soft-delete a modifier option. */
  deleteOption: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      const [deleted] = await ctx.db
        .update(modifierOption)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(modifierOption.id, input.id),
            eq(modifierOption.organizationId, orgId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modifier option not found",
        });
      }

      return deleted;
    }),

  // ── Assignment procedures ────────────────────────────────────────────────

  /** List all modifier groups assigned to a menu item, with options nested. */
  listForItem: protectedProcedure
    .input(z.object({ menuItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);

      const links = await ctx.db
        .select()
        .from(menuItemModifierGroup)
        .innerJoin(
          modifierGroup,
          eq(menuItemModifierGroup.modifierGroupId, modifierGroup.id),
        )
        .where(
          and(
            eq(menuItemModifierGroup.menuItemId, input.menuItemId),
            eq(modifierGroup.organizationId, orgId),
            eq(modifierGroup.isActive, true),
          ),
        )
        .orderBy(asc(menuItemModifierGroup.sortOrder));

      if (links.length === 0) return [];

      const groupIds = links.map((l) => l.modifier_group.id);
      const options = await ctx.db
        .select()
        .from(modifierOption)
        .where(
          and(
            eq(modifierOption.organizationId, orgId),
            eq(modifierOption.isActive, true),
            inArray(modifierOption.modifierGroupId, groupIds),
          ),
        )
        .orderBy(asc(modifierOption.sortOrder));

      return links.map((l) => ({
        ...l.modifier_group,
        linkId: l.menu_item_modifier_group.id,
        linkSortOrder: l.menu_item_modifier_group.sortOrder,
        options: options.filter(
          (o) => o.modifierGroupId === l.modifier_group.id,
        ),
      }));
    }),

  /** Assign a modifier group to a menu item. Idempotent — ignores duplicates. */
  assignToItem: protectedProcedure
    .input(
      z.object({
        menuItemId: z.string(),
        modifierGroupId: z.string(),
        sortOrder: z.number().int().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      // Verify both menu item and modifier group belong to this org
      const [item] = await ctx.db
        .select({ id: menuItem.id })
        .from(menuItem)
        .where(
          and(
            eq(menuItem.id, input.menuItemId),
            eq(menuItem.organizationId, orgId),
          ),
        )
        .limit(1);

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }

      const [group] = await ctx.db
        .select({ id: modifierGroup.id })
        .from(modifierGroup)
        .where(
          and(
            eq(modifierGroup.id, input.modifierGroupId),
            eq(modifierGroup.organizationId, orgId),
          ),
        )
        .limit(1);

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Modifier group not found",
        });
      }

      // Upsert — unique constraint (menuItemId, modifierGroupId) handles duplicates
      const [link] = await ctx.db
        .insert(menuItemModifierGroup)
        .values({
          menuItemId: input.menuItemId,
          modifierGroupId: input.modifierGroupId,
          sortOrder: input.sortOrder,
        })
        .onConflictDoUpdate({
          target: [
            menuItemModifierGroup.menuItemId,
            menuItemModifierGroup.modifierGroupId,
          ],
          set: { sortOrder: input.sortOrder, updatedAt: new Date() },
        })
        .returning();

      return link;
    }),

  /** Remove a modifier group assignment from a menu item. */
  unassignFromItem: protectedProcedure
    .input(
      z.object({
        menuItemId: z.string(),
        modifierGroupId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await getOrganizationId(ctx);
      await requireManagerRole(ctx, orgId);

      const [deleted] = await ctx.db
        .delete(menuItemModifierGroup)
        .where(
          and(
            eq(menuItemModifierGroup.menuItemId, input.menuItemId),
            eq(menuItemModifierGroup.modifierGroupId, input.modifierGroupId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      return deleted;
    }),
});
