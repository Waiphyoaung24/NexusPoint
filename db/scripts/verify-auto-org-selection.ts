import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema, casing: "snake_case" });

const testUserId = "8281eba5-09bb-4315-84be-2dfb78a0e51b";

async function verifyAutoOrgSelection() {
  console.log("🔍 Verifying Auto-Organization Selection Logic\n");

  // 1. Check user exists
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, testUserId),
  });

  if (!user) {
    console.log("❌ User not found!");
    await client.end();
    return;
  }

  console.log("✅ User found:");
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name || "(no name)"}`);
  console.log("");

  // 2. Check organization memberships with role priority
  const memberships = await db
    .select({
      orgId: schema.organization.id,
      orgName: schema.organization.name,
      role: schema.member.role,
    })
    .from(schema.member)
    .innerJoin(
      schema.organization,
      eq(schema.member.organizationId, schema.organization.id),
    )
    .where(eq(schema.member.userId, testUserId));

  console.log(`📋 Organization Memberships (${memberships.length}):`);

  if (memberships.length === 0) {
    console.log("   ⚠️  User has NO organization memberships!");
    console.log(
      "   💡 Solution: Create an organization or add user to existing one",
    );
    console.log("");
    console.log("   To fix, run one of these commands:");
    console.log("   1. Seed business data: bun --filter @repo/db seed");
    console.log(
      `   2. Or manually assign user to an organization in the database`,
    );
  } else {
    // Sort by role priority to show what auto-selection will choose
    const rolePriority: Record<string, number> = {
      owner: 1,
      admin: 2,
      member: 3,
    };

    const sortedMemberships = memberships.sort(
      (a, b) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99),
    );

    sortedMemberships.forEach((m, i) => {
      const indicator = i === 0 ? "👑 [AUTO-SELECTED]" : "  ";
      console.log(`   ${indicator} ${m.orgName} (${m.role}) - ID: ${m.orgId}`);
    });

    console.log("");
    console.log(
      `✅ Auto-selection will choose: ${sortedMemberships[0].orgName} (${sortedMemberships[0].role})`,
    );
  }

  console.log("");

  // 3. Check current sessions
  const sessions = await db.query.session.findMany({
    where: eq(schema.session.userId, testUserId),
  });

  console.log(`🔐 Active Sessions (${sessions.length}):`);
  if (sessions.length === 0) {
    console.log("   No active sessions");
  } else {
    sessions.forEach((s) => {
      const orgStatus = s.activeOrganizationId
        ? `✅ Org: ${s.activeOrganizationId}`
        : "⚠️  No active org";
      console.log(`   - Session ${s.id.slice(0, 8)}... ${orgStatus}`);
      console.log(`     Expires: ${s.expiresAt}`);
    });
  }

  console.log("");
  console.log("✨ Verification complete!");
  console.log("");
  console.log("📝 Next steps:");
  console.log(
    "   1. If user has no memberships, run: bun --filter @repo/db seed",
  );
  console.log("   2. Test login from Flutter app to trigger auto-selection");
  console.log("   3. Verify activeOrganizationId is set in session response");

  await client.end();
}

verifyAutoOrgSelection().catch(console.error);
