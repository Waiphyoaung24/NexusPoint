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
const db = drizzle(client, { schema });

const userId = "8281eba5-09bb-4315-84be-2dfb78a0e51b";

async function checkUserOrganizations() {
  console.log(`Checking organization memberships for user: ${userId}\n`);

  // Get user details
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
  });

  console.log("User details:", user);
  console.log("");

  // Get organization memberships
  const memberships = await db.query.member.findMany({
    where: eq(schema.member.userId, userId),
    with: {
      organization: true,
    },
  });

  console.log(`Found ${memberships.length} organization membership(s):`);
  memberships.forEach((m) => {
    console.log(`  - ${m.organization.name} (${m.role})`);
  });

  // Get sessions for this user
  const sessions = await db.query.session.findMany({
    where: eq(schema.session.userId, userId),
  });

  console.log(`\nFound ${sessions.length} active session(s):`);
  sessions.forEach((s) => {
    console.log(`  - Session ID: ${s.id}`);
    console.log(
      `    Active Organization ID: ${s.activeOrganizationId ?? "null"}`,
    );
    console.log(`    Expires At: ${s.expiresAt}`);
  });

  await client.end();
}

checkUserOrganizations().catch(console.error);
