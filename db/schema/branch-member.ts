// Branch-level staff membership with POS role assignment (F-009, FR-027)

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { branch } from "./branch";
import { staffRoleEnum } from "./order-item";
import { organization } from "./organization";
import { user } from "./user";

/**
 * Per-branch staff membership table.
 * Links users to branches with a specific POS role (owner/manager/cashier/waiter/kitchen).
 * Separate from Better Auth's `member` table to support per-branch role assignment
 * without modifying Better Auth internals.
 *
 * UNIQUE(branch_id, user_id) — one role per person per branch.
 */
export const branchMember = pgTable(
  "branch_member",
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
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    staffRole: staffRoleEnum().notNull(),
    managerPinHash: text(), // SHA-256, only for owner/manager
    pinFailedAttempts: integer().notNull().default(0),
    pinLockedUntil: timestamp({ withTimezone: true, mode: "date" }),
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
    unique("branch_member_branch_user_unique").on(table.branchId, table.userId),
    index("branch_member_org_id_idx").on(table.organizationId),
    index("branch_member_branch_id_idx").on(table.branchId),
    index("branch_member_user_id_idx").on(table.userId),
    index("branch_member_branch_user_idx").on(table.branchId, table.userId),
  ],
);

export type BranchMember = typeof branchMember.$inferSelect;
export type NewBranchMember = typeof branchMember.$inferInsert;

// —————————————————————————————————————————————————————————————————————————————
// Relations for better query experience
// —————————————————————————————————————————————————————————————————————————————

export const branchMemberRelations = relations(branchMember, ({ one }) => ({
  organization: one(organization, {
    fields: [branchMember.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [branchMember.branchId],
    references: [branch.id],
  }),
  user: one(user, {
    fields: [branchMember.userId],
    references: [user.id],
  }),
}));
