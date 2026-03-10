// Combo meals, time-based pricing schedules, and ingredient recipes (FR-003, FR-025, FR-040)

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
import { inventory } from "./inventory";
import { menuItem } from "./menu-item";
import { organization } from "./organization";

/**
 * Combo meal — a bundled product at a fixed price (FR-003).
 * e.g. "Set A: Pad Thai + Spring Roll + Drink = ฿250"
 *
 * Combo appears as a single line item on the order (expandable).
 * Kitchen ticket prints each component separately via combo_item rows.
 */
export const comboMeal = pgTable(
  "combo_meal",
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
    description: text(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    isAvailable: boolean().default(true).notNull(),
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
    index("combo_meal_org_id_idx").on(table.organizationId),
    index("combo_meal_branch_id_idx").on(table.branchId),
    index("combo_meal_is_available_idx").on(table.isAvailable),
  ],
);

export type ComboMeal = typeof comboMeal.$inferSelect;
export type NewComboMeal = typeof comboMeal.$inferInsert;

/**
 * Individual component items within a combo meal.
 * is_substitutable: staff can swap this component with another item.
 */
export const comboItem = pgTable(
  "combo_item",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    comboMealId: text()
      .notNull()
      .references(() => comboMeal.id, { onDelete: "cascade" }),
    menuItemId: text()
      .notNull()
      .references(() => menuItem.id, { onDelete: "cascade" }),
    quantity: integer().default(1).notNull(),
    isSubstitutable: boolean().default(false).notNull(),
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
    index("combo_item_combo_meal_id_idx").on(table.comboMealId),
    index("combo_item_menu_item_id_idx").on(table.menuItemId),
  ],
);

export type ComboItem = typeof comboItem.$inferSelect;
export type NewComboItem = typeof comboItem.$inferInsert;

/**
 * Pricing schedule — time-based price rules (FR-025).
 * e.g. Happy Hour: Mon–Fri 16:00–18:00
 *
 * days_of_week: array of integers 0–6 (0 = Sunday, 6 = Saturday).
 * start_time / end_time: HH:MM string in Asia/Bangkok timezone.
 * Applied automatically by POS — no manual activation required.
 */
export const pricingSchedule = pgTable(
  "pricing_schedule",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text().references(() => branch.id, { onDelete: "set null" }),
    name: text().notNull(),
    startTime: text().notNull(),
    endTime: text().notNull(),
    daysOfWeek: integer().array().notNull(),
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
    index("pricing_schedule_org_id_idx").on(table.organizationId),
    index("pricing_schedule_branch_id_idx").on(table.branchId),
    index("pricing_schedule_is_active_idx").on(table.isActive),
  ],
);

export type PricingSchedule = typeof pricingSchedule.$inferSelect;
export type NewPricingSchedule = typeof pricingSchedule.$inferInsert;

/**
 * Per-item price override within a pricing schedule.
 * e.g. Beer ฿120 normally → ฿80 during Happy Hour.
 */
export const pricingScheduleItem = pgTable(
  "pricing_schedule_item",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    pricingScheduleId: text()
      .notNull()
      .references(() => pricingSchedule.id, { onDelete: "cascade" }),
    menuItemId: text()
      .notNull()
      .references(() => menuItem.id, { onDelete: "cascade" }),
    overridePrice: numeric({ precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("pricing_schedule_item_schedule_id_idx").on(table.pricingScheduleId),
    index("pricing_schedule_item_menu_item_id_idx").on(table.menuItemId),
    unique("pricing_schedule_item_unique").on(
      table.pricingScheduleId,
      table.menuItemId,
    ),
  ],
);

export type PricingScheduleItem = typeof pricingScheduleItem.$inferSelect;
export type NewPricingScheduleItem = typeof pricingScheduleItem.$inferInsert;

/**
 * Recipe — ingredient-level deduction mapping (FR-040).
 * Maps inventory items to menu items for auto-deduction on order.
 * e.g. 1 serving Pad Thai deducts: 200g rice noodles, 2 eggs, 50ml sauce.
 *
 * quantity_per_serving uses 4 decimal places for precision (e.g. 0.0125 kg).
 */
export const recipe = pgTable(
  "recipe",
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
    inventoryId: text()
      .notNull()
      .references(() => inventory.id, { onDelete: "cascade" }),
    quantityPerServing: numeric({ precision: 10, scale: 4 }).notNull(),
    unit: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("recipe_org_id_idx").on(table.organizationId),
    index("recipe_menu_item_id_idx").on(table.menuItemId),
    index("recipe_inventory_id_idx").on(table.inventoryId),
    unique("recipe_menu_item_inventory_unique").on(
      table.menuItemId,
      table.inventoryId,
    ),
  ],
);

export type Recipe = typeof recipe.$inferSelect;
export type NewRecipe = typeof recipe.$inferInsert;

export const comboMealRelations = relations(comboMeal, ({ one, many }) => ({
  organization: one(organization, {
    fields: [comboMeal.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [comboMeal.branchId],
    references: [branch.id],
  }),
  items: many(comboItem),
}));

export const comboItemRelations = relations(comboItem, ({ one }) => ({
  comboMeal: one(comboMeal, {
    fields: [comboItem.comboMealId],
    references: [comboMeal.id],
  }),
  menuItem: one(menuItem, {
    fields: [comboItem.menuItemId],
    references: [menuItem.id],
  }),
}));

export const pricingScheduleRelations = relations(
  pricingSchedule,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [pricingSchedule.organizationId],
      references: [organization.id],
    }),
    branch: one(branch, {
      fields: [pricingSchedule.branchId],
      references: [branch.id],
    }),
    items: many(pricingScheduleItem),
  }),
);

export const pricingScheduleItemRelations = relations(
  pricingScheduleItem,
  ({ one }) => ({
    schedule: one(pricingSchedule, {
      fields: [pricingScheduleItem.pricingScheduleId],
      references: [pricingSchedule.id],
    }),
    menuItem: one(menuItem, {
      fields: [pricingScheduleItem.menuItemId],
      references: [menuItem.id],
    }),
  }),
);

export const recipeRelations = relations(recipe, ({ one }) => ({
  organization: one(organization, {
    fields: [recipe.organizationId],
    references: [organization.id],
  }),
  menuItem: one(menuItem, {
    fields: [recipe.menuItemId],
    references: [menuItem.id],
  }),
  inventory: one(inventory, {
    fields: [recipe.inventoryId],
    references: [inventory.id],
  }),
}));
