// Orders table for unified order storage (FR-BR-02)

import { relations, sql } from "drizzle-orm";
import {
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { branch } from "./branch";
import { organization } from "./organization";

/**
 * Order source enum - where the order originated.
 * Note: Adding new sources requires an enum migration.
 */
export const orderSourceEnum = pgEnum("order_source", [
  "pos",
  "grab",
  "wongnai",
  "lineman",
]);

/**
 * Order status enum - lifecycle states.
 * Note: Adding new statuses requires an enum migration.
 */
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

/**
 * Order item structure stored in JSONB.
 * Captures point-in-time data (price at order time, not current price).
 */
export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: string; // Decimal as string for precision
  notes?: string;
}

/**
 * Orders table for unified order storage (FR-BR-02).
 * Stores orders from all channels with tenant isolation.
 *
 * Design note: Items stored as JSONB to capture point-in-time order data
 * (prices, names at time of order) rather than referencing current menu items.
 */
export const order = pgTable(
  "order",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text().references(() => branch.id, { onDelete: "set null" }),
    externalOrderId: text(),
    source: orderSourceEnum().notNull(),
    status: orderStatusEnum().default("pending").notNull(),
    customerName: text(),
    customerPhone: text(),
    items: jsonb().$type<OrderItem[]>().notNull(),
    subtotal: numeric({ precision: 10, scale: 2 }).notNull(),
    discount: numeric({ precision: 10, scale: 2 }).default("0"),
    total: numeric({ precision: 10, scale: 2 }).notNull(),
    notes: text(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    acceptedAt: timestamp({ withTimezone: true, mode: "date" }),
    completedAt: timestamp({ withTimezone: true, mode: "date" }),
  },
  (table) => [
    index("order_organization_id_idx").on(table.organizationId),
    index("order_branch_id_idx").on(table.branchId),
    index("order_source_idx").on(table.source),
    index("order_status_idx").on(table.status),
    index("order_external_id_idx").on(table.externalOrderId),
    index("order_created_at_idx").on(table.createdAt),
  ],
);

export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;

export const orderRelations = relations(order, ({ one }) => ({
  organization: one(organization, {
    fields: [order.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [order.branchId],
    references: [branch.id],
  }),
}));
