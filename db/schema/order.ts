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
import { restaurantTable } from "./floor-plan";
import { organization } from "./organization";
import { user } from "./user";

/**
 * Order source enum - where the order originated (channel).
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
 * Order type enum - service mode (separate from source/channel).
 * An order can be: source="pos", type="dine_in"
 * or: source="grab", type="delivery"
 */
export const orderTypeEnum = pgEnum("order_type", [
  "dine_in",
  "takeaway",
  "delivery",
]);

/**
 * JSONB snapshot of an order item at the time of order placement.
 * Renamed from OrderItem to avoid collision with the normalized order_item table type.
 * This snapshot is used for receipt rendering and is immutable after order creation.
 */
export interface OrderItemSnapshot {
  menuItemId: string;
  name: string;
  quantity: number;
  price: string; // Decimal as string for precision
  notes?: string;
  modifiers?: Array<{
    modifierOptionId?: string;
    name: string;
    priceAdjustment: string;
  }>;
}

/**
 * Orders table for unified order storage (FR-BR-02).
 * Stores orders from all channels with tenant isolation.
 *
 * Design: Dual storage pattern
 * - items (JSONB): point-in-time snapshot for receipt rendering — immutable
 * - order_item rows (see order-item.ts): normalized for voids, splits, analytics
 *
 * New columns (F-000 / group 3) are nullable for backward compatibility.
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
    items: jsonb().$type<OrderItemSnapshot[]>().notNull(),
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
    // F-000: Group 3 — Order Enhancements
    tableId: text().references(() => restaurantTable.id, {
      onDelete: "set null",
    }),
    orderType: orderTypeEnum(),
    createdBy: text().references(() => user.id, { onDelete: "set null" }),
    processedBy: text().references(() => user.id, { onDelete: "set null" }),
    discountAmount: numeric({ precision: 10, scale: 2 }),
    vatAmount: numeric({ precision: 10, scale: 2 }),
    vatRate: numeric({ precision: 5, scale: 2 }).default("7.00"),
    tipAmount: numeric({ precision: 10, scale: 2 }),
  },
  (table) => [
    index("order_organization_id_idx").on(table.organizationId),
    index("order_branch_id_idx").on(table.branchId),
    index("order_source_idx").on(table.source),
    index("order_status_idx").on(table.status),
    index("order_external_id_idx").on(table.externalOrderId),
    index("order_created_at_idx").on(table.createdAt),
    index("order_table_id_idx").on(table.tableId),
    index("order_order_type_idx").on(table.orderType),
    index("order_created_by_idx").on(table.createdBy),
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
  table: one(restaurantTable, {
    fields: [order.tableId],
    references: [restaurantTable.id],
  }),
  createdByUser: one(user, {
    fields: [order.createdBy],
    references: [user.id],
  }),
  processedByUser: one(user, {
    fields: [order.processedBy],
    references: [user.id],
  }),
}));
