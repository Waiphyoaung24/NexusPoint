import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import * as schema from "../schema";
import {
  organization,
  branch,
  menuItem,
  menuMapping,
  order,
  inventory,
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

  // 2. Create branches
  const branches = await db
    .insert(branch)
    .values([
      {
        organizationId: demoOrg.id,
        name: "Siam Paragon Branch",
        address: "991 Rama I Rd, Pathum Wan, Bangkok 10330",
        isActive: true,
      },
      {
        organizationId: demoOrg.id,
        name: "Thong Lo Branch",
        address: "55 Sukhumvit 55, Khlong Tan Nuea, Bangkok 10110",
        isActive: true,
      },
      {
        organizationId: demoOrg.id,
        name: "Silom Branch",
        address: "189 Silom Rd, Silom, Bang Rak, Bangkok 10500",
        isActive: true,
      },
    ])
    .returning();

  console.log(`✅ Created ${branches.length} branches`);

  // 3. Create menu items with Thai/English names
  const menuItems = await db
    .insert(menuItem)
    .values([
      {
        organizationId: demoOrg.id,
        sku: "PAD-001",
        name: "Pad Thai (Shrimp)",
        nameTh: "ผัดไทยกุ้ง",
        description: "Classic Thai stir-fried noodles with shrimp",
        price: "150.00",
        category: "Main Course",
        isAvailable: true,
        sortOrder: 1,
      },
      {
        organizationId: demoOrg.id,
        sku: "PAD-002",
        name: "Pad Thai (Chicken)",
        nameTh: "ผัดไทยไก่",
        description: "Classic Thai stir-fried noodles with chicken",
        price: "120.00",
        category: "Main Course",
        isAvailable: true,
        sortOrder: 2,
      },
      {
        organizationId: demoOrg.id,
        sku: "TOM-001",
        name: "Tom Yum Goong",
        nameTh: "ต้มยำกุ้ง",
        description: "Spicy and sour Thai soup with shrimp",
        price: "180.00",
        category: "Soup",
        isAvailable: true,
        sortOrder: 3,
      },
      {
        organizationId: demoOrg.id,
        sku: "SOM-001",
        name: "Som Tam (Papaya Salad)",
        nameTh: "ส้มตำ",
        description: "Spicy green papaya salad",
        price: "80.00",
        category: "Salad",
        isAvailable: true,
        sortOrder: 4,
      },
      {
        organizationId: demoOrg.id,
        sku: "GAI-001",
        name: "Gai Yang (Grilled Chicken)",
        nameTh: "ไก่ย่าง",
        description: "Thai-style grilled chicken",
        price: "160.00",
        category: "Main Course",
        isAvailable: true,
        sortOrder: 5,
      },
      {
        organizationId: demoOrg.id,
        sku: "KHA-001",
        name: "Khao Pad (Fried Rice)",
        nameTh: "ข้าวผัด",
        description: "Thai fried rice with egg and vegetables",
        price: "90.00",
        category: "Main Course",
        isAvailable: true,
        sortOrder: 6,
      },
      {
        organizationId: demoOrg.id,
        sku: "DRI-001",
        name: "Thai Iced Tea",
        nameTh: "ชาเย็น",
        description: "Sweet and creamy Thai tea",
        price: "45.00",
        category: "Beverage",
        isAvailable: true,
        sortOrder: 7,
      },
      {
        organizationId: demoOrg.id,
        sku: "DRI-002",
        name: "Coconut Water",
        nameTh: "น้ำมะพร้าว",
        description: "Fresh coconut water",
        price: "50.00",
        category: "Beverage",
        isAvailable: true,
        sortOrder: 8,
      },
      {
        organizationId: demoOrg.id,
        sku: "DES-001",
        name: "Mango Sticky Rice",
        nameTh: "ข้าวเหนียวมะม่วง",
        description: "Sweet sticky rice with ripe mango",
        price: "95.00",
        category: "Dessert",
        isAvailable: true,
        sortOrder: 9,
      },
      {
        organizationId: demoOrg.id,
        sku: "APP-001",
        name: "Spring Rolls",
        nameTh: "ปอเปี๊ยะทอด",
        description: "Crispy vegetable spring rolls",
        price: "70.00",
        category: "Appetizer",
        isAvailable: true,
        sortOrder: 10,
      },
    ])
    .returning();

  console.log(`✅ Created ${menuItems.length} menu items`);

  // 4. Create menu mappings for Grab and Wongnai
  const mappings = await db
    .insert(menuMapping)
    .values([
      // Grab mappings
      {
        organizationId: demoOrg.id,
        menuItemId: menuItems[0].id,
        platform: "grab",
        externalId: "GRAB_PT_SHRIMP_001",
        externalName: "Pad Thai with Shrimp",
      },
      {
        organizationId: demoOrg.id,
        menuItemId: menuItems[1].id,
        platform: "grab",
        externalId: "GRAB_PT_CHICKEN_001",
        externalName: "Pad Thai with Chicken",
      },
      {
        organizationId: demoOrg.id,
        menuItemId: menuItems[2].id,
        platform: "grab",
        externalId: "GRAB_TY_001",
        externalName: "Tom Yum Soup",
      },
      // Wongnai mappings
      {
        organizationId: demoOrg.id,
        menuItemId: menuItems[0].id,
        platform: "wongnai",
        externalId: "WNG_PADTHAI_S_001",
        externalName: "ผัดไทยกุ้ง",
      },
      {
        organizationId: demoOrg.id,
        menuItemId: menuItems[1].id,
        platform: "wongnai",
        externalId: "WNG_PADTHAI_C_001",
        externalName: "ผัดไทยไก่",
      },
      {
        organizationId: demoOrg.id,
        menuItemId: menuItems[2].id,
        platform: "wongnai",
        externalId: "WNG_TOMYUM_001",
        externalName: "ต้มยำกุ้ง",
      },
      {
        organizationId: demoOrg.id,
        menuItemId: menuItems[3].id,
        platform: "wongnai",
        externalId: "WNG_SOMTAM_001",
        externalName: "ส้มตำ",
      },
      // LINE MAN mappings
      {
        organizationId: demoOrg.id,
        menuItemId: menuItems[0].id,
        platform: "lineman",
        externalId: "LM_PT_SHRIMP_20240101",
        externalName: "Pad Thai Goong",
      },
      {
        organizationId: demoOrg.id,
        menuItemId: menuItems[4].id,
        platform: "lineman",
        externalId: "LM_GAIYANG_20240101",
        externalName: "Grilled Chicken",
      },
    ])
    .returning();

  console.log(`✅ Created ${mappings.length} menu mappings`);

  // 5. Create sample orders from different sources
  const orders = await db
    .insert(order)
    .values([
      // POS order
      {
        organizationId: demoOrg.id,
        branchId: branches[0].id,
        source: "pos",
        status: "completed",
        customerName: "Walk-in Customer",
        items: [
          {
            menuItemId: menuItems[0].id,
            name: "Pad Thai (Shrimp)",
            quantity: 2,
            price: "150.00",
          },
          {
            menuItemId: menuItems[6].id,
            name: "Thai Iced Tea",
            quantity: 2,
            price: "45.00",
          },
        ],
        subtotal: "390.00",
        discount: "0",
        total: "390.00",
        completedAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      // Grab order
      {
        organizationId: demoOrg.id,
        branchId: branches[1].id,
        externalOrderId: "GRAB_ORD_20260205_001",
        source: "grab",
        status: "preparing",
        customerName: "Somchai P.",
        customerPhone: "0812345678",
        items: [
          {
            menuItemId: menuItems[1].id,
            name: "Pad Thai (Chicken)",
            quantity: 1,
            price: "120.00",
          },
          {
            menuItemId: menuItems[2].id,
            name: "Tom Yum Goong",
            quantity: 1,
            price: "180.00",
          },
        ],
        subtotal: "300.00",
        discount: "30.00",
        total: "270.00",
        acceptedAt: new Date(Date.now() - 900000), // 15 min ago
      },
      // Wongnai order
      {
        organizationId: demoOrg.id,
        branchId: branches[0].id,
        externalOrderId: "WNG_20260205_12345",
        source: "wongnai",
        status: "pending",
        customerName: "Nopparat K.",
        customerPhone: "0898765432",
        items: [
          {
            menuItemId: menuItems[0].id,
            name: "Pad Thai (Shrimp)",
            quantity: 3,
            price: "150.00",
          },
          {
            menuItemId: menuItems[3].id,
            name: "Som Tam (Papaya Salad)",
            quantity: 2,
            price: "80.00",
          },
          {
            menuItemId: menuItems[8].id,
            name: "Mango Sticky Rice",
            quantity: 1,
            price: "95.00",
          },
        ],
        subtotal: "705.00",
        discount: "0",
        total: "705.00",
      },
      // LINE MAN order
      {
        organizationId: demoOrg.id,
        branchId: branches[2].id,
        externalOrderId: "LM_ORD_2026020512345",
        source: "lineman",
        status: "accepted",
        customerName: "Apinya W.",
        customerPhone: "0823456789",
        items: [
          {
            menuItemId: menuItems[4].id,
            name: "Gai Yang (Grilled Chicken)",
            quantity: 2,
            price: "160.00",
          },
          {
            menuItemId: menuItems[5].id,
            name: "Khao Pad (Fried Rice)",
            quantity: 1,
            price: "90.00",
          },
        ],
        subtotal: "410.00",
        discount: "20.00",
        total: "390.00",
        acceptedAt: new Date(Date.now() - 600000), // 10 min ago
      },
    ])
    .returning();

  console.log(`✅ Created ${orders.length} sample orders`);

  // 6. Create inventory items
  const inventoryItems = await db
    .insert(inventory)
    .values([
      {
        organizationId: demoOrg.id,
        branchId: branches[0].id,
        name: "Rice Noodles",
        nameTh: "เส้นก๋วยเตี๋ยว",
        sku: "INV-NOODLES-001",
        quantity: "25.50",
        unit: "kg",
        lowStockThreshold: "10.00",
        isActive: true,
      },
      {
        organizationId: demoOrg.id,
        branchId: branches[0].id,
        name: "Shrimp",
        nameTh: "กุ้ง",
        sku: "INV-SHRIMP-001",
        quantity: "8.00",
        unit: "kg",
        lowStockThreshold: "5.00",
        isActive: true,
      },
      {
        organizationId: demoOrg.id,
        branchId: branches[0].id,
        name: "Chicken Breast",
        nameTh: "อกไก่",
        sku: "INV-CHICKEN-001",
        quantity: "15.00",
        unit: "kg",
        lowStockThreshold: "10.00",
        isActive: true,
      },
      {
        organizationId: demoOrg.id,
        branchId: branches[0].id,
        name: "Green Papaya",
        nameTh: "มะละกอดิบ",
        sku: "INV-PAPAYA-001",
        quantity: "12.00",
        unit: "kg",
        lowStockThreshold: "8.00",
        isActive: true,
      },
      {
        organizationId: demoOrg.id,
        branchId: branches[1].id,
        name: "Coconut Milk",
        nameTh: "กะทิ",
        sku: "INV-COCONUT-001",
        quantity: "3.50",
        unit: "L",
        lowStockThreshold: "5.00",
        isActive: true,
      },
      {
        organizationId: demoOrg.id,
        branchId: branches[1].id,
        name: "Thai Basil",
        nameTh: "โหระพา",
        sku: "INV-BASIL-001",
        quantity: "2.00",
        unit: "kg",
        lowStockThreshold: "1.00",
        isActive: true,
      },
    ])
    .returning();

  console.log(`✅ Created ${inventoryItems.length} inventory items`);

  // 7. Create payment configuration
  const paymentConfigs = await db
    .insert(paymentConfig)
    .values([
      {
        organizationId: demoOrg.id,
        branchId: branches[0].id,
        promptPayId: "0812345678",
        promptPayName: "Golden Pad Thai - Siam",
        shopLogoUrl: "https://via.placeholder.com/300?text=GPT+Siam",
        receiptHeader: "Golden Pad Thai\nSiam Paragon Branch",
        receiptFooter: "Thank you for your order!\nโทร. 02-123-4567",
      },
      {
        organizationId: demoOrg.id,
        branchId: branches[1].id,
        promptPayId: "0898765432",
        promptPayName: "Golden Pad Thai - Thong Lo",
        shopLogoUrl: "https://via.placeholder.com/300?text=GPT+ThongLo",
        receiptHeader: "Golden Pad Thai\nThong Lo Branch",
        receiptFooter: "Thank you for your order!\nโทร. 02-234-5678",
      },
    ])
    .returning();

  console.log(`✅ Created ${paymentConfigs.length} payment configurations`);
  console.log(
    "✨ Business domain seeding completed! MVP demo data is ready for showcase.",
  );
}
