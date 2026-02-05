// Branch table for multi-location support (FR-WEB-01)

import { relations, sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";

/**
 * Branches table for multi-branch support (FR-WEB-01).
 * Each branch belongs to an organization (tenant).
 */
export const branch = pgTable(
  "branch",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text().notNull(),
    address: text(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("branch_organization_id_idx").on(table.organizationId)],
);

export type Branch = typeof branch.$inferSelect;
export type NewBranch = typeof branch.$inferInsert;

export const branchRelations = relations(branch, ({ one }) => ({
  organization: one(organization, {
    fields: [branch.organizationId],
    references: [organization.id],
  }),
}));
