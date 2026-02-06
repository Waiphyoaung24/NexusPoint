import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import * as schema from "../schema";
import {
  organization,
  branch,
  menuItem,
  paymentConfig,
  member,
  user,
} from "../schema";

/**
 * Seeds the database with comprehensive business domain data for MVP demo.
 * Creates a realistic Thai restaurant chain scenario for showcasing to potential clients.
 */
export async function seedBusinessData(db: PostgresJsDatabase<typeof schema>) {
  console.log("Seeding business domain data...");

  // 1. Create or get demo organization
  let demoOrg;
  const [insertedOrg] = await db
    .insert(organization)
    .values({
      name: "Golden Pad Thai",
      slug: "golden-pad-thai",
      logo: "https://via.placeholder.com/150?text=GPT",
      metadata: JSON.stringify({
        businessType: "restaurant",
        cuisine: "Thai",
        founded: "2020",
      }),
    })
    .onConflictDoNothing()
    .returning();

  if (insertedOrg) {
    demoOrg = insertedOrg;
    console.log(`✅ Created organization: ${demoOrg.name}`);
  } else {
    // Organization already exists, fetch it
    const [existingOrg] = await db
      .select()
      .from(organization)
      .where(eq(organization.slug, "golden-pad-thai"))
      .limit(1);
    demoOrg = existingOrg;
    console.log(`⏭️  Using existing organization: ${demoOrg.name}`);
  }

  // Get or create a demo user for testing
  let demoUser;
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, "demo@goldenpadthai.com"))
    .limit(1);

  if (existingUser.length > 0) {
    demoUser = existingUser[0];
    console.log(`✅ Using existing demo user: ${demoUser.email}`);
  } else {
    [demoUser] = await db
      .insert(user)
      .values({
        email: "demo@goldenpadthai.com",
        name: "Demo Owner",
        emailVerified: true,
      })
      .returning();
    console.log(`✅ Created demo user: ${demoUser.email}`);
  }

  // Create organization membership
  const existingMembership = await db
    .select()
    .from(member)
    .where(
      and(
        eq(member.userId, demoUser.id),
        eq(member.organizationId, demoOrg.id),
      ),
    )
    .limit(1);

  if (existingMembership.length === 0) {
    await db.insert(member).values({
      userId: demoUser.id,
      organizationId: demoOrg.id,
      role: "owner",
    });
    console.log(
      `✅ Created organization membership for ${demoUser.email} as owner`,
    );
  } else {
    console.log(`⏭️  Membership already exists for ${demoUser.email}`);
  }

  // 2. Create branches (Idempotent)
  const branchNames = [
    "Siam Paragon Branch",
    "Thong Lo Branch",
    "Silom Branch",
  ];
  const branches = [];

  for (const name of branchNames) {
    const [existingBranch] = await db
      .select()
      .from(branch)
      .where(and(eq(branch.organizationId, demoOrg.id), eq(branch.name, name)))
      .limit(1);

    if (!existingBranch) {
      const [newBranch] = await db
        .insert(branch)
        .values({
          organizationId: demoOrg.id,
          name: name,
          address: name.includes("Siam")
            ? "991 Rama I Rd, Pathum Wan, Bangkok 10330"
            : name.includes("Thong Lo")
              ? "55 Sukhumvit 55, Khlong Tan Nuea, Bangkok 10110"
              : "189 Silom Rd, Silom, Bang Rak, Bangkok 10500",
          isActive: true,
        })
        .returning();
      branches.push(newBranch);
      console.log(`✅ Created branch: ${name}`);
    } else {
      branches.push(existingBranch);
      console.log(`⏭️  Branch already exists: ${name}`);
    }
  }

  // 3. Create menu items (Idempotent)
  const menuItemsData = [
    {
      sku: "PAD-001",
      name: "Pad Thai (Shrimp)",
      nameTh: "ผัดไทยกุ้ง",
      price: "150.00",
      category: "Main Course",
    },
    {
      sku: "PAD-002",
      name: "Pad Thai (Chicken)",
      nameTh: "ผัดไทยไก่",
      price: "120.00",
      category: "Main Course",
    },
    {
      sku: "TOM-001",
      name: "Tom Yum Goong",
      nameTh: "ต้มยำกุ้ง",
      price: "180.00",
      category: "Soup",
    },
    {
      sku: "SOM-001",
      name: "Som Tam (Papaya Salad)",
      nameTh: "ส้มตำ",
      price: "80.00",
      category: "Salad",
    },
  ];

  const menuItems = [];
  for (const item of menuItemsData) {
    const [existingItem] = await db
      .select()
      .from(menuItem)
      .where(
        and(
          eq(menuItem.organizationId, demoOrg.id),
          eq(menuItem.sku, item.sku),
        ),
      )
      .limit(1);

    if (!existingItem) {
      const [newItem] = await db
        .insert(menuItem)
        .values({
          organizationId: demoOrg.id,
          ...item,
          isAvailable: true,
        })
        .returning();
      menuItems.push(newItem);
      console.log(`✅ Created menu item: ${item.name}`);
    } else {
      menuItems.push(existingItem);
      console.log(`⏭️  Menu item already exists: ${item.sku}`);
    }
  }

  // 4. Create payment configuration (Idempotent)
  for (let i = 0; i < Math.min(branches.length, 2); i++) {
    const [existingConfig] = await db
      .select()
      .from(paymentConfig)
      .where(
        and(
          eq(paymentConfig.organizationId, demoOrg.id),
          eq(paymentConfig.branchId, branches[i].id),
        ),
      )
      .limit(1);

    if (!existingConfig) {
      await db.insert(paymentConfig).values({
        organizationId: demoOrg.id,
        branchId: branches[i].id,
        promptPayId: i === 0 ? "0812345678" : "0898765432",
        promptPayName: `Golden Pad Thai - ${branches[i].name}`,
      });
      console.log(`✅ Created payment configuration for: ${branches[i].name}`);
    } else {
      console.log(
        `⏭️  Payment configuration already exists for: ${branches[i].name}`,
      );
    }
  }

  console.log("✨ Business domain seeding completed!");
}
