import {
  pgTable,
  unique,
  text,
  timestamp,
  index,
  foreignKey,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "canceled",
]);

export const organization = pgTable(
  "organization",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    logo: text(),
    metadata: text(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("organization_slug_unique").on(table.slug)],
);

export const teamMember = pgTable(
  "team_member",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    teamId: text("team_id").notNull(),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("team_member_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("text_ops"),
    ),
    index("team_member_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [team.id],
      name: "team_member_team_id_team_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "team_member_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("team_member_team_user_unique").on(table.teamId, table.userId),
  ],
);

export const passkey = pgTable(
  "passkey",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    name: text(),
    publicKey: text("public_key").notNull(),
    userId: text("user_id").notNull(),
    credentialId: text("credential_id").notNull(),
    counter: integer().default(0).notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text(),
    aaguid: text(),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
    deviceName: text("device_name"),
    platform: text(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("passkey_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "passkey_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("passkey_credentialID_unique").on(table.credentialId),
  ],
);

export const member = pgTable(
  "member",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id").notNull(),
    role: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("member_organization_id_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("member_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "member_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "member_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("member_user_org_unique").on(table.userId, table.organizationId),
  ],
);

export const identity = pgTable(
  "identity",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
      mode: "string",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
      mode: "string",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("identity_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "identity_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("identity_provider_account_unique").on(
      table.accountId,
      table.providerId,
    ),
  ],
);

export const team = pgTable(
  "team",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    name: text().notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("team_organization_id_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "team_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
    activeOrganizationId: text("active_organization_id"),
    activeTeamId: text("active_team_id"),
  },
  (table) => [
    index("session_active_org_id_idx").using(
      "btree",
      table.activeOrganizationId.asc().nullsLast().op("text_ops"),
    ),
    index("session_active_team_id_idx").using(
      "btree",
      table.activeTeamId.asc().nullsLast().op("text_ops"),
    ),
    index("session_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    email: text().notNull(),
    inviterId: text("inviter_id").notNull(),
    organizationId: text("organization_id").notNull(),
    role: text().notNull(),
    status: invitationStatus().default("pending").notNull(),
    teamId: text("team_id"),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    acceptedAt: timestamp("accepted_at", {
      withTimezone: true,
      mode: "string",
    }),
    rejectedAt: timestamp("rejected_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invitation_email_idx").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
    index("invitation_inviter_id_idx").using(
      "btree",
      table.inviterId.asc().nullsLast().op("text_ops"),
    ),
    index("invitation_organization_id_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("invitation_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [user.id],
      name: "invitation_inviter_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invitation_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [team.id],
      name: "invitation_team_id_team_id_fk",
    }).onDelete("cascade"),
    unique("invitation_org_email_team_unique").on(
      table.email,
      table.organizationId,
      table.teamId,
    ),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("verification_expires_at_idx").using(
      "btree",
      table.expiresAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("verification_identifier_idx").using(
      "btree",
      table.identifier.asc().nullsLast().op("text_ops"),
    ),
    index("verification_value_idx").using(
      "btree",
      table.value.asc().nullsLast().op("text_ops"),
    ),
    unique("verification_identifier_value_unique").on(
      table.identifier,
      table.value,
    ),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text().default(gen_random_uuid()).primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text(),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("user_email_unique").on(table.email)],
);
