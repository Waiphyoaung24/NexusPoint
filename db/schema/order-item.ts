// Normalized order items and modifiers (FR-004, FR-006)
// Also defines staff_role and order_type enums used across the system.

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { menuItem } from "./menu-item";
import { order } from "./order";
import { organization } from "./organization";

/**
 * Staff role enum — the 5-role permission matrix (FR-027).
 * Exported for use in the member table (F-009) and tRPC middleware.
 *
 * Note: order_type enum lives in order.ts (co-located with the order table).
 */
export const staffRoleEnum = pgEnum("staff_role", [
  "owner",
  "manager",
  "cashier",
  "waiter",
  "kitchen",
]);

/**
 * Normalized order line items.
 *
 * Design: Written alongside the JSONB items snapshot in the order table.
 * - JSONB items → point-in-time receipt rendering (immutable)
 * - order_item rows → voids, split bills, analytics, modifier breakdowns
 *
 * menu_item_id is nullable to support open/custom price items (FR-005).
 * name is a snapshot — not a FK lookup — to survive menu item deletion.
 */
export const orderItem = pgTable(
  "order_item",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: text()
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    menuItemId: text().references(() => menuItem.id, {
      onDelete: "set null",
    }),
    name: text().notNull(),
    nameTh: text(),
    quantity: integer().notNull(),
    unitPrice: numeric({ precision: 10, scale: 2 }).notNull(),
    subtotal: numeric({ precision: 10, scale: 2 }).notNull(),
    notes: text(),
    isVoided: boolean().default(false).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("order_item_order_id_idx").on(table.orderId),
    index("order_item_org_id_idx").on(table.organizationId),
    index("order_item_menu_item_id_idx").on(table.menuItemId),
    index("order_item_is_voided_idx").on(table.isVoided),
  ],
);

export type OrderItem = typeof orderItem.$inferSelect;
export type NewOrderItem = typeof orderItem.$inferInsert;

/**
 * Modifier selections captured at order time — immutable after order is placed.
 *
 * Design: modifier_option_id stored but NOT a FK (set null on delete would
 * lose modifier names from historical receipts). name and price_adjustment
 * are point-in-time snapshots of the modifier option at order time.
 */
export const orderItemModifier = pgTable(
  "order_item_modifier",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderItemId: text()
      .notNull()
      .references(() => orderItem.id, { onDelete: "cascade" }),
    modifierOptionId: text(),
    name: text().notNull(),
    priceAdjustment: numeric({ precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("order_item_modifier_item_id_idx").on(table.orderItemId)],
);

export type OrderItemModifier = typeof orderItemModifier.$inferSelect;
export type NewOrderItemModifier = typeof orderItemModifier.$inferInsert;

export const orderItemRelations = relations(orderItem, ({ one, many }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  organization: one(organization, {
    fields: [orderItem.organizationId],
    references: [organization.id],
  }),
  menuItem: one(menuItem, {
    fields: [orderItem.menuItemId],
    references: [menuItem.id],
  }),
  modifiers: many(orderItemModifier),
}));

export const orderItemModifierRelations = relations(
  orderItemModifier,
  ({ one }) => ({
    orderItem: one(orderItem, {
      fields: [orderItemModifier.orderItemId],
      references: [orderItem.id],
    }),
  }),
);
