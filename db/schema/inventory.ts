// Inventory table for stock tracking (FR-BR-03)

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { branch } from "./branch";
import { organization } from "./organization";

/**
 * Inventory table for stock tracking (FR-BR-03).
 * Tracks ingredient/item quantities with tenant isolation.
 *
 * Stop-sell logic: When quantity <= 0 or isActive = false,
 * the application layer should trigger sync to external platforms.
 */
export const inventory = pgTable(
  "inventory",
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
    sku: text(),
    quantity: numeric({ precision: 10, scale: 2 }).default("0").notNull(),
    unit: text().notNull(),
    lowStockThreshold: numeric({ precision: 10, scale: 2 }).default("10"),
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
    index("inventory_organization_id_idx").on(table.organizationId),
    index("inventory_branch_id_idx").on(table.branchId),
    index("inventory_sku_idx").on(table.sku),
  ],
);

export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;

export const inventoryRelations = relations(inventory, ({ one }) => ({
  organization: one(organization, {
    fields: [inventory.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [inventory.branchId],
    references: [branch.id],
  }),
}));
