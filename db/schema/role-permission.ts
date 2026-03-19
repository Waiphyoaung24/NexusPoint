// Per-organization role permission matrix (F-009, FR-027)

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { staffRoleEnum } from "./order-item";
import { organization } from "./organization";

/**
 * Configurable permission matrix: maps (organization, role, action) to allowed/requiresPin.
 * Seeded with 70 rows (14 actions x 5 roles) on organization creation.
 * Owners can customize per organization from the admin UI.
 *
 * UNIQUE(organization_id, role, action) — one permission entry per role-action pair per org.
 */
export const rolePermission = pgTable(
  "role_permission",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: staffRoleEnum().notNull(),
    action: text().notNull(), // e.g. "order.void", "discount.apply"
    allowed: boolean().notNull().default(false),
    requiresPin: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("role_permission_org_role_action_unique").on(
      table.organizationId,
      table.role,
      table.action,
    ),
    index("role_permission_org_role_idx").on(table.organizationId, table.role),
    index("role_permission_org_action_idx").on(
      table.organizationId,
      table.action,
    ),
  ],
);

export type RolePermission = typeof rolePermission.$inferSelect;
export type NewRolePermission = typeof rolePermission.$inferInsert;

// —————————————————————————————————————————————————————————————————————————————
// Relations for better query experience
// —————————————————————————————————————————————————————————————————————————————

export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
  organization: one(organization, {
    fields: [rolePermission.organizationId],
    references: [organization.id],
  }),
}));
