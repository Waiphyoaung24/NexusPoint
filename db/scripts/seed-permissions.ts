// Seeds the default 5-role permission matrix (F-009, FR-027).
// Can be run standalone or imported by routers/hooks.

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { DatabaseSchema } from "../index";
import { organization, rolePermission } from "../schema";

const ROLES = ["owner", "manager", "cashier", "waiter", "kitchen"] as const;
type StaffRole = (typeof ROLES)[number];

type Perm = { allowed: boolean; requiresPin: boolean };
const ALLOW: Perm = { allowed: true, requiresPin: false };
const PIN: Perm = { allowed: true, requiresPin: true };
const DENY: Perm = { allowed: false, requiresPin: false };

type MatrixRow = { action: string } & Record<StaffRole, Perm>;

/**
 * Default permission matrix — 14 actions × 5 roles = 70 rows.
 * Matches spec.md section 4.
 */
const DEFAULT_MATRIX: MatrixRow[] = [
  {
    action: "order.create",
    owner: ALLOW,
    manager: ALLOW,
    cashier: ALLOW,
    waiter: ALLOW,
    kitchen: DENY,
  },
  {
    action: "order.view",
    owner: ALLOW,
    manager: ALLOW,
    cashier: ALLOW,
    waiter: ALLOW,
    kitchen: ALLOW,
  },
  {
    action: "order.void",
    owner: ALLOW,
    manager: PIN,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "order.cancel",
    owner: ALLOW,
    manager: PIN,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "discount.apply",
    owner: ALLOW,
    manager: PIN,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "refund.issue",
    owner: ALLOW,
    manager: PIN,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "payment.process",
    owner: ALLOW,
    manager: ALLOW,
    cashier: ALLOW,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "menu.manage",
    owner: ALLOW,
    manager: ALLOW,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "staff.manage",
    owner: ALLOW,
    manager: DENY,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "report.view",
    owner: ALLOW,
    manager: ALLOW,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "table.manage",
    owner: ALLOW,
    manager: ALLOW,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "floorplan.edit",
    owner: ALLOW,
    manager: ALLOW,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "zreport.generate",
    owner: ALLOW,
    manager: PIN,
    cashier: DENY,
    waiter: DENY,
    kitchen: DENY,
  },
  {
    action: "kds.view",
    owner: ALLOW,
    manager: ALLOW,
    cashier: DENY,
    waiter: DENY,
    kitchen: ALLOW,
  },
];

function buildRows(organizationId: string) {
  const rows: {
    organizationId: string;
    role: StaffRole;
    action: string;
    allowed: boolean;
    requiresPin: boolean;
  }[] = [];

  for (const entry of DEFAULT_MATRIX) {
    for (const role of ROLES) {
      rows.push({
        organizationId,
        role,
        action: entry.action,
        allowed: entry[role].allowed,
        requiresPin: entry[role].requiresPin,
      });
    }
  }
  return rows;
}

/**
 * Seed default permissions for a single organization.
 * Idempotent — uses ON CONFLICT DO NOTHING.
 */
export async function seedDefaultPermissions(
  db: PostgresJsDatabase<DatabaseSchema>,
  organizationId: string,
): Promise<void> {
  const rows = buildRows(organizationId);
  await db
    .insert(rolePermission)
    .values(rows)
    .onConflictDoNothing({
      target: [
        rolePermission.organizationId,
        rolePermission.role,
        rolePermission.action,
      ],
    });
}

/**
 * Backfill permissions for ALL existing organizations.
 * Run once when deploying F-009 to an existing system.
 */
export async function backfillAllOrganizations(
  db: PostgresJsDatabase<DatabaseSchema>,
): Promise<number> {
  const orgs = await db.select({ id: organization.id }).from(organization);
  for (const org of orgs) {
    await seedDefaultPermissions(db, org.id);
  }
  return orgs.length;
}
