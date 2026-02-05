// Menu items table for internal POS items (FR-BR-01)

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { branch } from "./branch";
import { organization } from "./organization";

/**
 * Menu items table for internal POS items (FR-BR-01).
 * Contains the master menu with tenant isolation.
 *
 * Design note: branchId is optional to support organization-wide items
 * with optional branch-level overrides. If a branch is deleted, items
 * become organization-wide (set null behavior).
 */
export const menuItem = pgTable(
  "menu_item",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text().references(() => branch.id, { onDelete: "set null" }),
    sku: text().notNull(),
    name: text().notNull(),
    nameTh: text(),
    description: text(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    category: text(),
    isAvailable: boolean().default(true).notNull(),
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
    index("menu_item_organization_id_idx").on(table.organizationId),
    index("menu_item_branch_id_idx").on(table.branchId),
    index("menu_item_sku_idx").on(table.sku),
    index("menu_item_category_idx").on(table.category),
  ],
);

export type MenuItem = typeof menuItem.$inferSelect;
export type NewMenuItem = typeof menuItem.$inferInsert;

export const menuItemRelations = relations(menuItem, ({ one }) => ({
  organization: one(organization, {
    fields: [menuItem.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [menuItem.branchId],
    references: [branch.id],
  }),
}));
