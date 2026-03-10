// Modifier groups and options for menu item customizations (FR-002)

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { branch } from "./branch";
import { menuItem } from "./menu-item";
import { organization } from "./organization";

/**
 * Modifier groups — collections of options attached to menu items.
 * e.g. "Choose spice level", "Add-ons", "Size"
 *
 * Design: Organization-scoped. branch_id optional for org-wide modifier groups.
 */
export const modifierGroup = pgTable(
  "modifier_group",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text().references(() => branch.id, { onDelete: "set null" }),
    name: text().notNull(),
    nameTh: text(),
    isRequired: boolean().default(false).notNull(),
    minSelections: integer().default(0).notNull(),
    maxSelections: integer().default(1).notNull(),
    sortOrder: integer().default(0).notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("modifier_group_org_id_idx").on(table.organizationId),
    index("modifier_group_branch_id_idx").on(table.branchId),
  ],
);

export type ModifierGroup = typeof modifierGroup.$inferSelect;
export type NewModifierGroup = typeof modifierGroup.$inferInsert;

/**
 * Individual selectable options within a modifier group.
 * e.g. "Extra spicy (+฿10)", "No chili (free)"
 */
export const modifierOption = pgTable(
  "modifier_option",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    modifierGroupId: text()
      .notNull()
      .references(() => modifierGroup.id, { onDelete: "cascade" }),
    name: text().notNull(),
    nameTh: text(),
    priceAdjustment: numeric({ precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    isDefault: boolean().default(false).notNull(),
    sortOrder: integer().default(0).notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("modifier_option_group_id_idx").on(table.modifierGroupId),
    index("modifier_option_org_id_idx").on(table.organizationId),
  ],
);

export type ModifierOption = typeof modifierOption.$inferSelect;
export type NewModifierOption = typeof modifierOption.$inferInsert;

/**
 * Junction table: menu items ↔ modifier groups (many-to-many).
 * Controls which modifier groups appear for a given menu item.
 */
export const menuItemModifierGroup = pgTable(
  "menu_item_modifier_group",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    menuItemId: text()
      .notNull()
      .references(() => menuItem.id, { onDelete: "cascade" }),
    modifierGroupId: text()
      .notNull()
      .references(() => modifierGroup.id, { onDelete: "cascade" }),
    sortOrder: integer().default(0).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("menu_item_mod_group_item_idx").on(table.menuItemId),
    index("menu_item_mod_group_group_idx").on(table.modifierGroupId),
    unique("menu_item_mod_group_unique").on(
      table.menuItemId,
      table.modifierGroupId,
    ),
  ],
);

export type MenuItemModifierGroup = typeof menuItemModifierGroup.$inferSelect;
export type NewMenuItemModifierGroup =
  typeof menuItemModifierGroup.$inferInsert;

export const modifierGroupRelations = relations(
  modifierGroup,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [modifierGroup.organizationId],
      references: [organization.id],
    }),
    branch: one(branch, {
      fields: [modifierGroup.branchId],
      references: [branch.id],
    }),
    options: many(modifierOption),
    menuItemLinks: many(menuItemModifierGroup),
  }),
);

export const modifierOptionRelations = relations(modifierOption, ({ one }) => ({
  organization: one(organization, {
    fields: [modifierOption.organizationId],
    references: [organization.id],
  }),
  group: one(modifierGroup, {
    fields: [modifierOption.modifierGroupId],
    references: [modifierGroup.id],
  }),
}));

export const menuItemModifierGroupRelations = relations(
  menuItemModifierGroup,
  ({ one }) => ({
    menuItem: one(menuItem, {
      fields: [menuItemModifierGroup.menuItemId],
      references: [menuItem.id],
    }),
    modifierGroup: one(modifierGroup, {
      fields: [menuItemModifierGroup.modifierGroupId],
      references: [modifierGroup.id],
    }),
  }),
);
