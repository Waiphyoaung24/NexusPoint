#!/usr/bin/env bun
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "../schema";
import { user, organization, member, menuItem } from "../schema";
import "../drizzle.config";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema, casing: "snake_case" });

console.log("🌱 Seeding Wai's menu items...");

try {
  // 1. Get or create user
  let targetUser;
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, "wai.1998@gmail.com"))
    .limit(1);

  if (existingUser.length > 0) {
    targetUser = existingUser[0];
    console.log(`✅ Found user: ${targetUser.email}`);
  } else {
    [targetUser] = await db
      .insert(user)
      .values({
        email: "wai.1998@gmail.com",
        name: "Wai Phyo Aung",
        emailVerified: true,
      })
      .returning();
    console.log(`✅ Created user: ${targetUser.email}`);
  }

  // 2. Get or create organization
  let targetOrg;
  const orgSlug = "wais-kitchen";
  const existingOrg = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, orgSlug))
    .limit(1);

  if (existingOrg.length > 0) {
    targetOrg = existingOrg[0];
    console.log(`✅ Found organization: ${targetOrg.name}`);
  } else {
    [targetOrg] = await db
      .insert(organization)
      .values({
        name: "Wai's Kitchen",
        slug: orgSlug,
        metadata: JSON.stringify({
          businessType: "restaurant",
          cuisine: "Burmese",
        }),
      })
      .returning();
    console.log(`✅ Created organization: ${targetOrg.name}`);
  }

  // 3. Ensure membership
  const existingMembership = await db
    .select()
    .from(member)
    .where(
      and(
        eq(member.userId, targetUser.id),
        eq(member.organizationId, targetOrg.id),
      ),
    )
    .limit(1);

  if (existingMembership.length === 0) {
    await db.insert(member).values({
      userId: targetUser.id,
      organizationId: targetOrg.id,
      role: "owner",
    });
    console.log(`✅ Added ${targetUser.email} to ${targetOrg.name} as owner`);
  }

  // 4. Create menu items
  const menuItemsData = [
    {
      sku: "MOH-001",
      name: "Mohinga",
      nameTh: "ขนมจีนน้ำยาพม่า",
      description: "Traditional Burmese rice noodle fish soup",
      price: "120.00",
      category: "Breakfast",
    },
    {
      sku: "TEA-001",
      name: "Burmese Tea Salad",
      nameTh: "ยำใบชา",
      description: "Fermented tea leaves with nuts and beans",
      price: "150.00",
      category: "Salad",
    },
    {
      sku: "CUR-001",
      name: "Burmese Chicken Curry",
      nameTh: "แกงไก่พม่า",
      description: "Rich and oily chicken curry",
      price: "180.00",
      category: "Main Course",
    },
    {
      sku: "DRI-001",
      name: "Burmese Milk Tea",
      nameTh: "ชาพม่า",
      description: "Sweet and creamy tea",
      price: "50.00",
      category: "Drinks",
    },
  ];

  for (const item of menuItemsData) {
    const [existingItem] = await db
      .select()
      .from(menuItem)
      .where(
        and(
          eq(menuItem.organizationId, targetOrg.id),
          eq(menuItem.sku, item.sku),
        ),
      )
      .limit(1);

    if (!existingItem) {
      await db.insert(menuItem).values({
        organizationId: targetOrg.id,
        ...item,
        isAvailable: true,
      });
      console.log(`✅ Created menu item: ${item.name}`);
    } else {
      console.log(`⏭️  Menu item already exists: ${item.sku}`);
    }
  }

  console.log("✨ Wai's menu seeding completed!");
} catch (error) {
  console.error("❌ Seeding failed:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
