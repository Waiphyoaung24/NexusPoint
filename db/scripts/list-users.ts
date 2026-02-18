import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema, casing: "snake_case" });

async function listUsers() {
  console.log("👥 Listing all users in database:\n");

  const users = await db.query.user.findMany({
    with: {
      sessions: true,
    },
  });

  if (users.length === 0) {
    console.log("❌ No users found in database!");
    console.log("💡 Run: bun --filter @repo/db seed");
  } else {
    console.log(`Found ${users.length} user(s):\n`);

    for (const user of users) {
      console.log(`📧 ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || "(no name)"}`);
      console.log(`   Email Verified: ${user.emailVerified ? "✅" : "❌"}`);
      console.log(
        `   Active Sessions: ${user.sessions?.filter((s) => s.expiresAt > new Date()).length || 0}`,
      );

      // Get memberships
      const memberships = await db.query.member.findMany({
        where: (member, { eq }) => eq(member.userId, user.id),
        with: { organization: true },
      });

      if (memberships.length > 0) {
        console.log(`   Organizations:`);
        memberships.forEach((m) => {
          console.log(`      - ${m.organization.name} (${m.role})`);
        });
      } else {
        console.log(`   Organizations: ⚠️  None`);
      }

      console.log("");
    }
  }

  await client.end();
}

listUsers().catch(console.error);
