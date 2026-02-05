// Menu mapping table linking internal SKUs to external platforms (FR-BR-01)

import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { menuItem } from "./menu-item";
import { organization } from "./organization";

/**
 * External platform enum for menu mappings.
 * Note: Adding new platforms requires an enum migration.
 */
export const platformEnum = pgEnum("platform", ["grab", "wongnai", "lineman"]);

/**
 * Menu mappings table linking internal SKUs to external platform IDs (FR-BR-01).
 * Maps Internal_SKU_ID to Grab_Item_ID, Wongnai_Item_ID, etc.
 *
 * Constraint: One mapping per (menuItem, platform) combination.
 */
export const menuMapping = pgTable(
  "menu_mapping",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    menuItemId: text()
      .notNull()
      .references(() => menuItem.id, { onDelete: "cascade" }),
    platform: platformEnum().notNull(),
    externalId: text().notNull(),
    externalName: text(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("menu_mapping_organization_id_idx").on(table.organizationId),
    index("menu_mapping_menu_item_id_idx").on(table.menuItemId),
    index("menu_mapping_platform_idx").on(table.platform),
    unique("menu_mapping_item_platform_unique").on(
      table.menuItemId,
      table.platform,
    ),
  ],
);

export type MenuMapping = typeof menuMapping.$inferSelect;
export type NewMenuMapping = typeof menuMapping.$inferInsert;

export const menuMappingRelations = relations(menuMapping, ({ one }) => ({
  organization: one(organization, {
    fields: [menuMapping.organizationId],
    references: [organization.id],
  }),
  menuItem: one(menuItem, {
    fields: [menuMapping.menuItemId],
    references: [menuItem.id],
  }),
}));
