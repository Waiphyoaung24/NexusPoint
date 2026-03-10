// Floor plan tables and reservations (FR-010, FR-012)

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
  unique,
} from "drizzle-orm/pg-core";
import { branch } from "./branch";
import { organization } from "./organization";

/**
 * Physical shape of a restaurant table for floor plan rendering.
 */
export const tableShapeEnum = pgEnum("table_shape", [
  "round",
  "rectangle",
  "bar_stool",
]);

/**
 * Real-time status of a restaurant table.
 * Updated by POS when orders are opened/closed or reservations are seated.
 */
export const tableStatusEnum = pgEnum("table_status", [
  "available",
  "occupied",
  "reserved",
  "cleaning",
]);

/**
 * Status lifecycle for a guest reservation.
 */
export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "seated",
  "cancelled",
  "no_show",
]);

/**
 * Restaurant table — physical seating in the floor plan.
 *
 * Design note: Named "restaurantTable" in TypeScript to avoid collision with
 * the SQL reserved word "table". The DB table name remains "table".
 *
 * position_x / position_y are canvas coordinates for the floor plan editor.
 * The unique constraint (branch_id, number) prevents duplicate table numbers.
 */
export const restaurantTable = pgTable(
  "table",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text()
      .notNull()
      .references(() => branch.id, { onDelete: "cascade" }),
    number: integer().notNull(),
    label: text(),
    seats: integer().default(4).notNull(),
    shape: tableShapeEnum().default("rectangle").notNull(),
    positionX: numeric({ precision: 8, scale: 2 }).default("0").notNull(),
    positionY: numeric({ precision: 8, scale: 2 }).default("0").notNull(),
    status: tableStatusEnum().default("available").notNull(),
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
    index("table_org_id_idx").on(table.organizationId),
    index("table_branch_id_idx").on(table.branchId),
    index("table_status_idx").on(table.status),
    unique("table_branch_number_unique").on(table.branchId, table.number),
  ],
);

export type RestaurantTable = typeof restaurantTable.$inferSelect;
export type NewRestaurantTable = typeof restaurantTable.$inferInsert;

/**
 * Guest reservations for pre-booked tables.
 *
 * auto_clear_at: computed at creation (reserved_at + 2h by default).
 * A background job or check at seating time cancels no-shows.
 */
export const reservation = pgTable(
  "reservation",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text()
      .notNull()
      .references(() => branch.id, { onDelete: "cascade" }),
    tableId: text().references(() => restaurantTable.id, {
      onDelete: "set null",
    }),
    guestName: text().notNull(),
    guestPhone: text(),
    partySize: integer().notNull(),
    reservedAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    notes: text(),
    status: reservationStatusEnum().default("pending").notNull(),
    autoClearAt: timestamp({ withTimezone: true, mode: "date" }),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("reservation_org_id_idx").on(table.organizationId),
    index("reservation_branch_id_idx").on(table.branchId),
    index("reservation_table_id_idx").on(table.tableId),
    index("reservation_reserved_at_idx").on(table.reservedAt),
    index("reservation_status_idx").on(table.status),
  ],
);

export type Reservation = typeof reservation.$inferSelect;
export type NewReservation = typeof reservation.$inferInsert;

export const restaurantTableRelations = relations(
  restaurantTable,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [restaurantTable.organizationId],
      references: [organization.id],
    }),
    branch: one(branch, {
      fields: [restaurantTable.branchId],
      references: [branch.id],
    }),
    reservations: many(reservation),
  }),
);

export const reservationRelations = relations(reservation, ({ one }) => ({
  organization: one(organization, {
    fields: [reservation.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [reservation.branchId],
    references: [branch.id],
  }),
  table: one(restaurantTable, {
    fields: [reservation.tableId],
    references: [restaurantTable.id],
  }),
}));
