// Payment configuration table for PromptPay and receipt settings (FR-WEB-03)

import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { branch } from "./branch";
import { organization } from "./organization";

/**
 * Payment configuration table for PromptPay and receipt settings (FR-WEB-03).
 *
 * Design note: branchId is optional to support organization-wide defaults.
 * The unique constraint on (organizationId, branchId) allows:
 * - One config per branch (when branchId is set)
 * - Multiple org-level configs if branchId is null (PostgreSQL NULL behavior)
 *
 * Application layer should enforce single org-level default if needed.
 */
export const paymentConfig = pgTable(
  "payment_config",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text().references(() => branch.id, { onDelete: "cascade" }),
    promptPayId: text(),
    promptPayName: text(),
    shopLogoUrl: text(),
    receiptHeader: text(),
    receiptFooter: text(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payment_config_organization_id_idx").on(table.organizationId),
    index("payment_config_branch_id_idx").on(table.branchId),
    unique("payment_config_org_branch_unique").on(
      table.organizationId,
      table.branchId,
    ),
  ],
);

export type PaymentConfig = typeof paymentConfig.$inferSelect;
export type NewPaymentConfig = typeof paymentConfig.$inferInsert;

export const paymentConfigRelations = relations(paymentConfig, ({ one }) => ({
  organization: one(organization, {
    fields: [paymentConfig.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [paymentConfig.branchId],
    references: [branch.id],
  }),
}));
