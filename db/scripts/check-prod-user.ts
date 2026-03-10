import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../schema";

// Production database URL
const PROD_DATABASE_URL =
  process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

if (!PROD_DATABASE_URL) {
  console.error(
    "❌ Set PROD_DATABASE_URL or DATABASE_URL environment variable",
  );
  process.exit(1);
}

const client = postgres(PROD_DATABASE_URL);
const db = drizzle(client, { schema, casing: "snake_case" });

const userId = "8281eba5-09bb-4315-84be-2dfb78a0e51b";

async function checkProductionUser() {
  console.log("🔍 Checking Production User\n");
  console.log(`User ID: ${userId}`);
  console.log(`Email: entertainmentkwg@gmail.com\n`);

  try {
    // Get user
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    });

    if (!user) {
      console.log("❌ User NOT found in production database!");
      console.log(
        "This means your Flutter app is hitting a different API/database.\n",
      );
      await client.end();
      return;
    }

    console.log("✅ User found in production!");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || "(no name)"}\n`);

    // Get organization memberships
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
      .where(eq(schema.member.userId, userId));

    console.log(`📋 Organization Memberships: ${memberships.length}`);

    if (memberships.length === 0) {
      console.log("❌ User has NO organizations in production!");
      console.log("\n🔧 Fix: Assign user to an organization:");
      console.log("   1. Run: bun --filter @repo/db seed (if using seed data)");
      console.log("   2. Or manually assign via admin panel/database\n");
    } else {
      memberships.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.orgName} (${m.role}) - ID: ${m.orgId}`);
      });

      console.log("\n✅ Auto-selection will choose:");
      console.log(`   Organization: ${memberships[0].orgName}`);
      console.log(`   Role: ${memberships[0].role}`);
      console.log(`   ID: ${memberships[0].orgId}\n`);
    }

    // Check active sessions
    const sessions = await db.query.session.findMany({
      where: eq(schema.session.userId, userId),
    });

    console.log(`🔐 Active Sessions: ${sessions.length}`);
    sessions.forEach((s) => {
      const isExpired = s.expiresAt < new Date();
      const status = isExpired ? "❌ Expired" : "✅ Active";
      console.log(`   - ${status} - Org: ${s.activeOrganizationId || "null"}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end();
  }
}

checkProductionUser().catch(console.error);
