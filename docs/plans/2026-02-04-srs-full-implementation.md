# SRS Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement full SRS compliance for the Unified POS & Delivery Bridge System, including bilingual support, business domain database tables, tenant isolation, and all web dashboard functional requirements.

**Architecture:** Multi-tenant SaaS with organization-based data isolation. React SPA frontend with react-i18next for Thai/English. Hono/tRPC backend with tenant middleware. Drizzle ORM with PostgreSQL (Neon). All business tables include `organization_id` foreign key for tenant isolation.

**Tech Stack:** React 19, TanStack Router, react-i18next, Jotai, shadcn/ui, Tailwind CSS v4, Hono, tRPC, Drizzle ORM, Better Auth, Cloudflare Workers.

---

## Phase 1: SRS Compliance Fixes

### Task 1: Install i18n Dependencies

**Files:**

- Modify: `package.json` (root)
- Modify: `apps/app/package.json`

**Step 1: Install react-i18next and dependencies**

Run:

```bash
cd /Users/waiphyoaung/Desktop/kwg-starter-template
bun add -D i18next react-i18next i18next-browser-languagedetector --filter @repo/app
```

Expected: Dependencies added to apps/app/package.json

**Step 2: Verify installation**

Run:

```bash
grep -E "i18next|react-i18next" apps/app/package.json
```

Expected: Shows i18next, react-i18next, i18next-browser-languagedetector

**Step 3: Commit**

```bash
git add apps/app/package.json bun.lock
git commit -m "chore: add i18n dependencies (react-i18next)"
```

---

### Task 2: Create i18n Configuration

**Files:**

- Create: `apps/app/lib/i18n/index.ts`
- Create: `apps/app/lib/i18n/locales/en.json`
- Create: `apps/app/lib/i18n/locales/th.json`

**Step 1: Create i18n configuration file**

Create `apps/app/lib/i18n/index.ts`:

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import th from "./locales/th.json";

export const defaultNS = "common";
export const resources = {
  en: { common: en },
  th: { common: th },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: "en",
    supportedLngs: ["en", "th"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
```

**Step 2: Create English locale file**

Create `apps/app/lib/i18n/locales/en.json`:

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "liveOrders": "Live Orders",
    "menuMapping": "Menu & Mapping",
    "inventory": "Inventory",
    "reports": "Reports",
    "settings": "Settings",
    "users": "Users",
    "integrations": "Integrations",
    "syncLogs": "Sync Logs"
  },
  "header": {
    "selectBranch": "Select a branch",
    "syncStatus": "Sync Status"
  },
  "dashboard": {
    "title": "Dashboard",
    "totalOrders": "Total Orders",
    "revenue": "Revenue",
    "activeItems": "Active Items",
    "syncStatus": "Sync Status"
  },
  "liveOrders": {
    "title": "Live Orders",
    "pending": "Pending",
    "accepted": "Accepted",
    "completed": "Completed",
    "newOrder": "New Order"
  },
  "menuMapping": {
    "title": "Menu & Mapping",
    "wongnaiItems": "Wongnai POS Items",
    "grabItems": "Grab Merchant Items",
    "mappings": "Mappings",
    "dragToLink": "Select an item from Wongnai, then click a Grab item to link"
  },
  "inventory": {
    "title": "Inventory",
    "addItem": "Add Item",
    "itemName": "Item Name",
    "stock": "Stock",
    "unit": "Unit",
    "actions": "Actions",
    "stopSell": "Stop Sell",
    "available": "Available"
  },
  "settings": {
    "title": "Settings",
    "subtitle": "Manage your account settings and preferences.",
    "profile": "Profile",
    "profileDesc": "Update your personal information and profile settings.",
    "name": "Name",
    "email": "Email",
    "saveChanges": "Save Changes",
    "notifications": "Notifications",
    "notificationsDesc": "Configure how you receive notifications.",
    "emailNotifications": "Email Notifications",
    "pushNotifications": "Push Notifications",
    "security": "Security",
    "securityDesc": "Manage your security preferences and authentication.",
    "changePassword": "Change Password",
    "enable2FA": "Enable Two-Factor Authentication",
    "appearance": "Appearance",
    "appearanceDesc": "Customize the look and feel of the application.",
    "darkMode": "Dark Mode",
    "language": "Language",
    "languageDesc": "Choose your preferred language",
    "payment": "Payment Configuration",
    "paymentDesc": "Configure PromptPay and receipt settings.",
    "promptPayId": "PromptPay ID",
    "promptPayIdPlaceholder": "Enter your PromptPay ID (phone or national ID)",
    "shopLogo": "Shop Logo",
    "uploadLogo": "Upload Logo"
  },
  "users": {
    "title": "Users",
    "subtitle": "Manage user accounts and permissions.",
    "addUser": "Add User",
    "totalUsers": "Total Users",
    "activeUsers": "Active Users",
    "newThisMonth": "New This Month",
    "userManagement": "User Management",
    "userManagementDesc": "View and manage all user accounts",
    "searchUsers": "Search users...",
    "filter": "Filter",
    "user": "User",
    "role": "Role",
    "status": "Status",
    "lastActive": "Last Active",
    "actions": "Actions"
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "filter": "Filter",
    "active": "Active",
    "inactive": "Inactive",
    "synced": "Synced",
    "syncing": "Syncing...",
    "syncError": "Sync Error"
  },
  "roles": {
    "owner": "Owner",
    "admin": "Admin",
    "member": "Member",
    "cashier": "Cashier",
    "kitchen": "Kitchen Staff"
  },
  "platforms": {
    "wongnai": "Wongnai",
    "grab": "Grab",
    "lineman": "LINE MAN"
  }
}
```

**Step 3: Create Thai locale file**

Create `apps/app/lib/i18n/locales/th.json`:

```json
{
  "nav": {
    "dashboard": "แดชบอร์ด",
    "liveOrders": "ออเดอร์สด",
    "menuMapping": "จับคู่เมนู",
    "inventory": "คลังสินค้า",
    "reports": "รายงาน",
    "settings": "ตั้งค่า",
    "users": "ผู้ใช้งาน",
    "integrations": "การเชื่อมต่อ",
    "syncLogs": "บันทึกการซิงค์"
  },
  "header": {
    "selectBranch": "เลือกสาขา",
    "syncStatus": "สถานะการซิงค์"
  },
  "dashboard": {
    "title": "แดชบอร์ด",
    "totalOrders": "ออเดอร์ทั้งหมด",
    "revenue": "รายได้",
    "activeItems": "รายการที่ใช้งาน",
    "syncStatus": "สถานะการซิงค์"
  },
  "liveOrders": {
    "title": "ออเดอร์สด",
    "pending": "รอดำเนินการ",
    "accepted": "รับแล้ว",
    "completed": "เสร็จสิ้น",
    "newOrder": "ออเดอร์ใหม่"
  },
  "menuMapping": {
    "title": "จับคู่เมนู",
    "wongnaiItems": "รายการ Wongnai POS",
    "grabItems": "รายการ Grab Merchant",
    "mappings": "การจับคู่",
    "dragToLink": "เลือกรายการจาก Wongnai แล้วคลิกรายการ Grab เพื่อเชื่อมโยง"
  },
  "inventory": {
    "title": "คลังสินค้า",
    "addItem": "เพิ่มรายการ",
    "itemName": "ชื่อรายการ",
    "stock": "จำนวนคงเหลือ",
    "unit": "หน่วย",
    "actions": "การดำเนินการ",
    "stopSell": "หยุดขาย",
    "available": "พร้อมขาย"
  },
  "settings": {
    "title": "ตั้งค่า",
    "subtitle": "จัดการการตั้งค่าบัญชีและการกำหนดค่าของคุณ",
    "profile": "โปรไฟล์",
    "profileDesc": "อัปเดตข้อมูลส่วนตัวและการตั้งค่าโปรไฟล์",
    "name": "ชื่อ",
    "email": "อีเมล",
    "saveChanges": "บันทึกการเปลี่ยนแปลง",
    "notifications": "การแจ้งเตือน",
    "notificationsDesc": "กำหนดค่าวิธีรับการแจ้งเตือน",
    "emailNotifications": "การแจ้งเตือนทางอีเมล",
    "pushNotifications": "การแจ้งเตือนแบบพุช",
    "security": "ความปลอดภัย",
    "securityDesc": "จัดการการตั้งค่าความปลอดภัยและการยืนยันตัวตน",
    "changePassword": "เปลี่ยนรหัสผ่าน",
    "enable2FA": "เปิดใช้งานการยืนยันตัวตนสองขั้นตอน",
    "appearance": "รูปลักษณ์",
    "appearanceDesc": "ปรับแต่งรูปลักษณ์ของแอปพลิเคชัน",
    "darkMode": "โหมดมืด",
    "language": "ภาษา",
    "languageDesc": "เลือกภาษาที่ต้องการ",
    "payment": "การตั้งค่าการชำระเงิน",
    "paymentDesc": "กำหนดค่า PromptPay และการตั้งค่าใบเสร็จ",
    "promptPayId": "รหัส PromptPay",
    "promptPayIdPlaceholder": "ใส่รหัส PromptPay (เบอร์โทรหรือเลขบัตรประชาชน)",
    "shopLogo": "โลโก้ร้าน",
    "uploadLogo": "อัปโหลดโลโก้"
  },
  "users": {
    "title": "ผู้ใช้งาน",
    "subtitle": "จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง",
    "addUser": "เพิ่มผู้ใช้",
    "totalUsers": "ผู้ใช้ทั้งหมด",
    "activeUsers": "ผู้ใช้ที่ใช้งาน",
    "newThisMonth": "ใหม่เดือนนี้",
    "userManagement": "จัดการผู้ใช้",
    "userManagementDesc": "ดูและจัดการบัญชีผู้ใช้ทั้งหมด",
    "searchUsers": "ค้นหาผู้ใช้...",
    "filter": "กรอง",
    "user": "ผู้ใช้",
    "role": "บทบาท",
    "status": "สถานะ",
    "lastActive": "ใช้งานล่าสุด",
    "actions": "การดำเนินการ"
  },
  "common": {
    "loading": "กำลังโหลด...",
    "error": "ข้อผิดพลาด",
    "save": "บันทึก",
    "cancel": "ยกเลิก",
    "delete": "ลบ",
    "edit": "แก้ไข",
    "add": "เพิ่ม",
    "search": "ค้นหา",
    "filter": "กรอง",
    "active": "ใช้งาน",
    "inactive": "ไม่ใช้งาน",
    "synced": "ซิงค์แล้ว",
    "syncing": "กำลังซิงค์...",
    "syncError": "ซิงค์ผิดพลาด"
  },
  "roles": {
    "owner": "เจ้าของ",
    "admin": "ผู้ดูแล",
    "member": "สมาชิก",
    "cashier": "แคชเชียร์",
    "kitchen": "พนักงานครัว"
  },
  "platforms": {
    "wongnai": "Wongnai",
    "grab": "Grab",
    "lineman": "LINE MAN"
  }
}
```

**Step 4: Verify files created**

Run:

```bash
ls -la apps/app/lib/i18n/
ls -la apps/app/lib/i18n/locales/
```

Expected: Shows index.ts, en.json, th.json

**Step 5: Commit**

```bash
git add apps/app/lib/i18n/
git commit -m "feat: add i18n configuration with Thai and English locales"
```

---

### Task 3: Initialize i18n in App Entry Point

**Files:**

- Modify: `apps/app/index.tsx`

**Step 1: Read current index.tsx**

Run:

```bash
cat apps/app/index.tsx
```

**Step 2: Add i18n import to index.tsx**

Add at the top of `apps/app/index.tsx` (after existing imports):

```typescript
import "./lib/i18n";
```

**Step 3: Verify the import was added**

Run:

```bash
head -20 apps/app/index.tsx
```

Expected: Shows `import "./lib/i18n";` near the top

**Step 4: Commit**

```bash
git add apps/app/index.tsx
git commit -m "feat: initialize i18n in app entry point"
```

---

### Task 4: Create Language Switcher Component

**Files:**

- Create: `apps/app/components/language-switcher.tsx`

**Step 1: Create the language switcher component**

Create `apps/app/components/language-switcher.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const currentLanguage = languages.find((l) => l.code === i18n.language) ?? languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[120px]">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue>
          {currentLanguage.flag} {currentLanguage.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 2: Verify file created**

Run:

```bash
cat apps/app/components/language-switcher.tsx
```

Expected: Shows the LanguageSwitcher component

**Step 3: Commit**

```bash
git add apps/app/components/language-switcher.tsx
git commit -m "feat: add language switcher component for Thai/English toggle"
```

---

### Task 5: Add Language Switcher to Header

**Files:**

- Modify: `apps/app/components/layout/header.tsx`

**Step 1: Read current header.tsx**

Run:

```bash
cat apps/app/components/layout/header.tsx
```

**Step 2: Update header.tsx with language switcher**

Replace `apps/app/components/layout/header.tsx` with:

```typescript
import { useTranslation } from "react-i18next";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { Menu, Settings, X, CheckCircle, XCircle } from "lucide-react";
import { TabBarItem } from "../tab-bar-item";
import { LanguageSwitcher } from "../language-switcher";

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ isSidebarOpen, onMenuToggle }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="shrink-0"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <Select>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder={t("header.selectBranch")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="siam">Siam Paragon Branch</SelectItem>
            <SelectItem value="thonglo">Thong Lo Branch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">{t("platforms.wongnai")}</span>
        </div>
        <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium">{t("platforms.grab")}</span>
        </div>
        <TabBarItem />
        <LanguageSwitcher />
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
```

**Step 3: Verify the update**

Run:

```bash
grep -E "LanguageSwitcher|useTranslation" apps/app/components/layout/header.tsx
```

Expected: Shows both imports

**Step 4: Commit**

```bash
git add apps/app/components/layout/header.tsx
git commit -m "feat: add language switcher to header with i18n translations"
```

---

### Task 6: Create Business Domain Database Tables

**Files:**

- Create: `db/schema/branch.ts`
- Create: `db/schema/menu-item.ts`
- Create: `db/schema/menu-mapping.ts`
- Create: `db/schema/order.ts`
- Create: `db/schema/inventory.ts`
- Create: `db/schema/payment-config.ts`
- Modify: `db/schema/index.ts`

**Step 1: Create branch table schema**

Create `db/schema/branch.ts`:

```typescript
import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { organization } from "./organization";

/**
 * Branches table for multi-branch support (FR-WEB-01).
 * Each branch belongs to an organization (tenant).
 */
export const branch = pgTable(
  "branch",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text().notNull(),
    address: text(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("branch_organization_id_idx").on(table.organizationId)],
);

export type Branch = typeof branch.$inferSelect;
export type NewBranch = typeof branch.$inferInsert;

export const branchRelations = relations(branch, ({ one }) => ({
  organization: one(organization, {
    fields: [branch.organizationId],
    references: [organization.id],
  }),
}));
```

**Step 2: Create menu-item table schema**

Create `db/schema/menu-item.ts`:

```typescript
import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { branch } from "./branch";

/**
 * Menu items table for internal POS items (FR-BR-01).
 * Contains the master menu with tenant isolation.
 */
export const menuItem = pgTable(
  "menu_item",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text().references(() => branch.id, { onDelete: "set null" }),
    sku: text().notNull(),
    name: text().notNull(),
    nameTh: text(),
    description: text(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    category: text(),
    isAvailable: boolean().default(true).notNull(),
    sortOrder: integer().default(0).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("menu_item_organization_id_idx").on(table.organizationId),
    index("menu_item_branch_id_idx").on(table.branchId),
    index("menu_item_sku_idx").on(table.sku),
    index("menu_item_category_idx").on(table.category),
  ],
);

export type MenuItem = typeof menuItem.$inferSelect;
export type NewMenuItem = typeof menuItem.$inferInsert;

export const menuItemRelations = relations(menuItem, ({ one }) => ({
  organization: one(organization, {
    fields: [menuItem.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [menuItem.branchId],
    references: [branch.id],
  }),
}));
```

**Step 3: Create menu-mapping table schema**

Create `db/schema/menu-mapping.ts`:

```typescript
import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { menuItem } from "./menu-item";

/**
 * External platform enum for menu mappings.
 */
export const platformEnum = pgEnum("platform", ["grab", "wongnai", "lineman"]);

/**
 * Menu mappings table linking internal SKUs to external platform IDs (FR-BR-01).
 * Maps Internal_SKU_ID to Grab_Item_ID and Wongnai_Item_ID.
 */
export const menuMapping = pgTable(
  "menu_mapping",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    menuItemId: text()
      .notNull()
      .references(() => menuItem.id, { onDelete: "cascade" }),
    platform: platformEnum().notNull(),
    externalId: text().notNull(),
    externalName: text(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("menu_mapping_organization_id_idx").on(table.organizationId),
    index("menu_mapping_menu_item_id_idx").on(table.menuItemId),
    index("menu_mapping_platform_idx").on(table.platform),
    unique("menu_mapping_item_platform_unique").on(
      table.menuItemId,
      table.platform,
    ),
  ],
);

export type MenuMapping = typeof menuMapping.$inferSelect;
export type NewMenuMapping = typeof menuMapping.$inferInsert;

export const menuMappingRelations = relations(menuMapping, ({ one }) => ({
  organization: one(organization, {
    fields: [menuMapping.organizationId],
    references: [organization.id],
  }),
  menuItem: one(menuItem, {
    fields: [menuMapping.menuItemId],
    references: [menuItem.id],
  }),
}));
```

**Step 4: Create order table schema**

Create `db/schema/order.ts`:

```typescript
import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  pgEnum,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { branch } from "./branch";

/**
 * Order source enum.
 */
export const orderSourceEnum = pgEnum("order_source", [
  "pos",
  "grab",
  "wongnai",
  "lineman",
]);

/**
 * Order status enum.
 */
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

/**
 * Orders table for unified order storage (FR-BR-02).
 * Stores orders from all channels with tenant isolation.
 */
export const order = pgTable(
  "order",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text().references(() => branch.id, { onDelete: "set null" }),
    externalOrderId: text(),
    source: orderSourceEnum().notNull(),
    status: orderStatusEnum().default("pending").notNull(),
    customerName: text(),
    customerPhone: text(),
    items: jsonb().$type<OrderItem[]>().notNull(),
    subtotal: numeric({ precision: 10, scale: 2 }).notNull(),
    discount: numeric({ precision: 10, scale: 2 }).default("0"),
    total: numeric({ precision: 10, scale: 2 }).notNull(),
    notes: text(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    acceptedAt: timestamp({ withTimezone: true, mode: "date" }),
    completedAt: timestamp({ withTimezone: true, mode: "date" }),
  },
  (table) => [
    index("order_organization_id_idx").on(table.organizationId),
    index("order_branch_id_idx").on(table.branchId),
    index("order_source_idx").on(table.source),
    index("order_status_idx").on(table.status),
    index("order_external_id_idx").on(table.externalOrderId),
    index("order_created_at_idx").on(table.createdAt),
  ],
);

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: string;
  notes?: string;
}

export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;

export const orderRelations = relations(order, ({ one }) => ({
  organization: one(organization, {
    fields: [order.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [order.branchId],
    references: [branch.id],
  }),
}));
```

**Step 5: Create inventory table schema**

Create `db/schema/inventory.ts`:

```typescript
import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { branch } from "./branch";

/**
 * Inventory table for stock tracking (FR-BR-03).
 * Tracks ingredient/item quantities with tenant isolation.
 */
export const inventory = pgTable(
  "inventory",
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    branchId: text().references(() => branch.id, { onDelete: "set null" }),
    name: text().notNull(),
    nameTh: text(),
    sku: text(),
    quantity: numeric({ precision: 10, scale: 2 }).default("0").notNull(),
    unit: text().notNull(),
    lowStockThreshold: numeric({ precision: 10, scale: 2 }).default("10"),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("inventory_organization_id_idx").on(table.organizationId),
    index("inventory_branch_id_idx").on(table.branchId),
    index("inventory_sku_idx").on(table.sku),
  ],
);

export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;

export const inventoryRelations = relations(inventory, ({ one }) => ({
  organization: one(organization, {
    fields: [inventory.organizationId],
    references: [organization.id],
  }),
  branch: one(branch, {
    fields: [inventory.branchId],
    references: [branch.id],
  }),
}));
```

**Step 6: Create payment-config table schema**

Create `db/schema/payment-config.ts`:

```typescript
import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { branch } from "./branch";

/**
 * Payment configuration table for PromptPay and receipt settings (FR-WEB-03).
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
```

**Step 7: Update schema index to export new tables**

Replace `db/schema/index.ts` with:

```typescript
export * from "./invitation";
export * from "./organization";
export * from "./passkey";
export * from "./team";
export * from "./user";

// Business domain tables (SRS compliance)
export * from "./branch";
export * from "./menu-item";
export * from "./menu-mapping";
export * from "./order";
export * from "./inventory";
export * from "./payment-config";
```

**Step 8: Verify all schema files created**

Run:

```bash
ls -la db/schema/
```

Expected: Shows all new schema files

**Step 9: Commit**

```bash
git add db/schema/
git commit -m "feat: add business domain database tables for SRS compliance

- branch: multi-branch support (FR-WEB-01)
- menu_item: internal POS items (FR-BR-01)
- menu_mapping: external platform links (FR-BR-01)
- order: unified order storage (FR-BR-02)
- inventory: stock tracking (FR-BR-03)
- payment_config: PromptPay settings (FR-WEB-03)

All tables include organization_id for multi-tenant isolation (NFR-01)"
```

---

### Task 7: Generate and Apply Database Migration

**Files:**

- Generate: `db/migrations/XXXX_business_tables.sql`

**Step 1: Generate migration**

Run:

```bash
cd /Users/waiphyoaung/Desktop/kwg-starter-template
bun --filter @repo/db generate
```

Expected: Migration file generated in db/migrations/

**Step 2: Review generated migration**

Run:

```bash
ls -la db/migrations/
cat db/migrations/*.sql | tail -100
```

Expected: Shows SQL with CREATE TABLE statements for new tables

**Step 3: Apply migration to database**

Run:

```bash
bun --filter @repo/db push
```

Expected: Migration applied successfully

**Step 4: Commit migration**

```bash
git add db/migrations/
git commit -m "chore: add migration for business domain tables"
```

---

## Phase 2: Feature Completion

### Task 8: Create Branch Context Store

**Files:**

- Modify: `apps/app/lib/store.ts`

**Step 1: Read current store.ts**

Run:

```bash
cat apps/app/lib/store.ts
```

**Step 2: Add branch context to store**

Replace `apps/app/lib/store.ts` with:

```typescript
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Sync status types
export type SyncStatus = "synced" | "syncing" | "error";

// Sync status atoms
export const syncStatusAtom = atom<SyncStatus>("synced");
export const syncStatusPopoverOpenAtom = atom(false);

// Branch context atoms (FR-WEB-01)
export interface BranchContext {
  id: string;
  name: string;
  organizationId: string;
}

export const currentBranchAtom = atomWithStorage<BranchContext | null>(
  "currentBranch",
  null,
);

export const branchListAtom = atom<BranchContext[]>([]);

// Language preference (persisted)
export const languageAtom = atomWithStorage<"en" | "th">("language", "en");
```

**Step 3: Verify the update**

Run:

```bash
cat apps/app/lib/store.ts
```

Expected: Shows branch context atoms

**Step 4: Commit**

```bash
git add apps/app/lib/store.ts
git commit -m "feat: add branch context atoms for multi-branch support (FR-WEB-01)"
```

---

### Task 9: Create Branch API Router

**Files:**

- Create: `apps/api/routers/branch.ts`
- Modify: `apps/api/lib/app.ts`

**Step 1: Create branch router**

Create `apps/api/routers/branch.ts`:

```typescript
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { branch } from "@repo/db";
import { router, protectedProcedure } from "../lib/trpc.js";

export const branchRouter = router({
  // List branches for the current organization
  list: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.session?.activeOrganizationId;
    if (!orgId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization selected",
      });
    }

    return ctx.db
      .select()
      .from(branch)
      .where(and(eq(branch.organizationId, orgId), eq(branch.isActive, true)));
  }),

  // Get a single branch by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.session?.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      const result = await ctx.db
        .select()
        .from(branch)
        .where(and(eq(branch.id, input.id), eq(branch.organizationId, orgId)))
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Branch not found",
        });
      }

      return result[0];
    }),

  // Create a new branch
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session?.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      const [newBranch] = await ctx.db
        .insert(branch)
        .values({
          organizationId: orgId,
          name: input.name,
          address: input.address,
        })
        .returning();

      return newBranch;
    }),

  // Update a branch
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session?.activeOrganizationId;
      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No organization selected",
        });
      }

      const [updated] = await ctx.db
        .update(branch)
        .set({
          name: input.name,
          address: input.address,
          isActive: input.isActive,
        })
        .where(and(eq(branch.id, input.id), eq(branch.organizationId, orgId)))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Branch not found",
        });
      }

      return updated;
    }),
});
```

**Step 2: Add branch router to app.ts**

Update `apps/api/lib/app.ts` to include the branch router in the appRouter:

Add import at top:

```typescript
import { branchRouter } from "../routers/branch.js";
```

Update appRouter:

```typescript
const appRouter = router({
  user: userRouter,
  organization: organizationRouter,
  branch: branchRouter,
});
```

**Step 3: Verify the update**

Run:

```bash
grep -E "branchRouter" apps/api/lib/app.ts
```

Expected: Shows branchRouter import and usage

**Step 4: Commit**

```bash
git add apps/api/routers/branch.ts apps/api/lib/app.ts
git commit -m "feat: add branch API router with CRUD operations (FR-WEB-01)"
```

---

### Task 10: Wire Up Branch Switcher in Header

**Files:**

- Modify: `apps/app/components/layout/header.tsx`

**Step 1: Update header with real branch data**

Replace `apps/app/components/layout/header.tsx` with:

```typescript
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { Menu, Settings, X, CheckCircle, XCircle } from "lucide-react";
import { TabBarItem } from "../tab-bar-item";
import { LanguageSwitcher } from "../language-switcher";
import { currentBranchAtom, type BranchContext } from "@/lib/store";
import { trpc } from "@/lib/trpc";

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ isSidebarOpen, onMenuToggle }: HeaderProps) {
  const { t } = useTranslation();
  const [currentBranch, setCurrentBranch] = useAtom(currentBranchAtom);

  // Fetch branches from API
  const { data: branches, isLoading } = trpc.branch.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleBranchChange = (branchId: string) => {
    const selected = branches?.find((b) => b.id === branchId);
    if (selected) {
      setCurrentBranch({
        id: selected.id,
        name: selected.name,
        organizationId: selected.organizationId,
      });
    }
  };

  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="shrink-0"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <Select
          value={currentBranch?.id ?? ""}
          onValueChange={handleBranchChange}
          disabled={isLoading || !branches?.length}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder={t("header.selectBranch")} />
          </SelectTrigger>
          <SelectContent>
            {branches?.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">{t("platforms.wongnai")}</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium">{t("platforms.grab")}</span>
        </div>
        <TabBarItem />
        <LanguageSwitcher />
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
```

**Step 2: Verify the update**

Run:

```bash
grep -E "trpc.branch|currentBranchAtom" apps/app/components/layout/header.tsx
```

Expected: Shows trpc and branch atom usage

**Step 3: Commit**

```bash
git add apps/app/components/layout/header.tsx
git commit -m "feat: wire up branch switcher with real API data (FR-WEB-01)"
```

---

### Task 11: Update Sidebar Navigation with i18n

**Files:**

- Modify: `apps/app/components/layout/constants.ts`
- Modify: `apps/app/components/layout/sidebar-nav.tsx`

**Step 1: Update navigation constants with translation keys**

Replace `apps/app/components/layout/constants.ts` with:

```typescript
import {
  LayoutDashboard,
  ShoppingCart,
  Link2,
  Package,
  FileText,
  Settings,
  Users,
  Plug,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  titleKey: string; // i18n key instead of hardcoded string
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    titleKey: "nav.bridgeIntegration",
    items: [
      { titleKey: "nav.dashboard", href: "/", icon: LayoutDashboard },
      { titleKey: "nav.liveOrders", href: "/live-orders", icon: ShoppingCart },
      { titleKey: "nav.menuMapping", href: "/menu-mapping", icon: Link2 },
      { titleKey: "nav.syncLogs", href: "/sync-logs", icon: RefreshCw },
    ],
  },
  {
    titleKey: "nav.management",
    items: [
      { titleKey: "nav.inventory", href: "/inventory", icon: Package },
      { titleKey: "nav.reports", href: "/reports", icon: FileText },
      { titleKey: "nav.users", href: "/users", icon: Users },
      { titleKey: "nav.integrations", href: "/integrations", icon: Plug },
      { titleKey: "nav.settings", href: "/settings", icon: Settings },
    ],
  },
];
```

**Step 2: Update sidebar-nav.tsx to use translations**

Replace `apps/app/components/layout/sidebar-nav.tsx` with:

```typescript
import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@repo/ui";
import { navSections } from "./constants";

export function SidebarNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="flex-1 space-y-6 p-4">
      {navSections.map((section) => (
        <div key={section.titleKey}>
          <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t(section.titleKey)}
          </h3>
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.titleKey)}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
```

**Step 3: Update locale files with new navigation keys**

Add to both `apps/app/lib/i18n/locales/en.json` and `apps/app/lib/i18n/locales/th.json`:

For en.json, add inside "nav":

```json
"bridgeIntegration": "Bridge & Integration",
"management": "Management"
```

For th.json, add inside "nav":

```json
"bridgeIntegration": "เชื่อมต่อและบริดจ์",
"management": "การจัดการ"
```

**Step 4: Verify the updates**

Run:

```bash
grep -E "titleKey|useTranslation" apps/app/components/layout/sidebar-nav.tsx
```

Expected: Shows titleKey and useTranslation usage

**Step 5: Commit**

```bash
git add apps/app/components/layout/constants.ts apps/app/components/layout/sidebar-nav.tsx apps/app/lib/i18n/locales/
git commit -m "feat: add i18n support to sidebar navigation"
```

---

### Task 12: Add Payment Configuration to Settings (FR-WEB-03)

**Files:**

- Modify: `apps/app/routes/(app)/settings.tsx`

**Step 1: Update settings page with payment config section**

This task adds the PromptPay configuration and logo upload UI to the settings page.

Replace `apps/app/routes/(app)/settings.tsx` with:

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Switch,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, CreditCard, Palette, Shield, User, Upload } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Route = createFileRoute("/(app)/settings")({
  component: Settings,
});

function Settings() {
  const { t } = useTranslation();
  const [promptPayId, setPromptPayId] = useState("");
  const [shopLogo, setShopLogo] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("settings.title")}</h2>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>{t("settings.profile")}</CardTitle>
            </div>
            <CardDescription>{t("settings.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("settings.name")}</Label>
              <Input id="name" placeholder={t("settings.name")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t("settings.email")}</Label>
              <Input id="email" type="email" placeholder={t("settings.email")} />
            </div>
            <Button>{t("settings.saveChanges")}</Button>
          </CardContent>
        </Card>

        {/* Payment Configuration (FR-WEB-03) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>{t("settings.payment")}</CardTitle>
            </div>
            <CardDescription>{t("settings.paymentDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="promptpay">{t("settings.promptPayId")}</Label>
              <Input
                id="promptpay"
                placeholder={t("settings.promptPayIdPlaceholder")}
                value={promptPayId}
                onChange={(e) => setPromptPayId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.promptPayIdPlaceholder")}
              </p>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>{t("settings.shopLogo")}</Label>
              <div className="flex items-center gap-4">
                {shopLogo ? (
                  <img
                    src={shopLogo}
                    alt="Shop Logo"
                    className="h-16 w-16 object-contain rounded border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded border border-dashed flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("logo")?.click()}
                  >
                    {t("settings.uploadLogo")}
                  </Button>
                </div>
              </div>
            </div>
            <Button>{t("settings.saveChanges")}</Button>
          </CardContent>
        </Card>

        {/* Language Settings (5.1) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>{t("settings.language")}</CardTitle>
            </div>
            <CardDescription>{t("settings.languageDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>{t("settings.notifications")}</CardTitle>
            </div>
            <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">
                  {t("settings.emailNotifications")}
                </Label>
              </div>
              <Switch id="email-notifications" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">
                  {t("settings.pushNotifications")}
                </Label>
              </div>
              <Switch id="push-notifications" />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>{t("settings.security")}</CardTitle>
            </div>
            <CardDescription>{t("settings.securityDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">{t("settings.changePassword")}</Button>
            <Button variant="outline">{t("settings.enable2FA")}</Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>{t("settings.appearance")}</CardTitle>
            </div>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">{t("settings.darkMode")}</Label>
              </div>
              <Switch id="dark-mode" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: Verify the update**

Run:

```bash
grep -E "promptPayId|shopLogo|CreditCard" apps/app/routes/\(app\)/settings.tsx
```

Expected: Shows PromptPay and logo upload related code

**Step 3: Commit**

```bash
git add apps/app/routes/\(app\)/settings.tsx
git commit -m "feat: add payment configuration section to settings (FR-WEB-03)

- PromptPay ID input field
- Shop logo upload functionality
- Language switcher integration"
```

---

## Phase 3: Backend Integration (Remaining Tasks)

The following tasks outline the remaining Phase 3 work. Each should follow the same step-by-step structure:

### Task 13: Create Menu Mapping API Router (FR-BR-01)

**Files:**

- Create: `apps/api/routers/menu-mapping.ts`
- Modify: `apps/api/lib/app.ts`

Create CRUD endpoints for menu mappings with tenant isolation.

### Task 14: Create Order API Router (FR-BR-02)

**Files:**

- Create: `apps/api/routers/order.ts`
- Modify: `apps/api/lib/app.ts`

Create order management endpoints including webhook handler stub.

### Task 15: Create Inventory API Router (FR-BR-03)

**Files:**

- Create: `apps/api/routers/inventory.ts`
- Modify: `apps/api/lib/app.ts`

Create inventory CRUD with stop-sell trigger logic.

### Task 16: Create Payment Config API Router (FR-WEB-03)

**Files:**

- Create: `apps/api/routers/payment-config.ts`
- Modify: `apps/api/lib/app.ts`

Create payment configuration endpoints with file upload support.

### Task 17: Implement Drag-and-Drop Menu Mapping (FR-WEB-02)

**Files:**

- Modify: `apps/app/routes/(app)/menu-mapping.tsx`

Install @dnd-kit/core and implement drag-and-drop UI.

### Task 18: Create Role Management UI (FR-WEB-04)

**Files:**

- Modify: `apps/app/routes/(app)/users.tsx`
- Create: `apps/app/components/user-create-dialog.tsx`

Add user creation form with role selection.

### Task 19: Add i18n to Remaining Pages

**Files:**

- Modify: All route files under `apps/app/routes/(app)/`

Replace all hardcoded strings with translation keys.

### Task 20: Create Webhook Endpoint for Grab/Wongnai (FR-BR-02)

**Files:**

- Create: `apps/api/webhooks/grab.ts`
- Create: `apps/api/webhooks/wongnai.ts`
- Modify: `apps/api/lib/app.ts`

Create webhook handlers for external order injection.

---

## Verification Checklist

After completing all tasks, verify SRS compliance:

- [ ] **NFR-01 Multi-Tenancy**: All business queries include `organization_id` filter
- [ ] **5.1 Bilingual**: Language switcher works, all UI strings translated
- [ ] **FR-WEB-01**: Branch switcher functional with real data
- [ ] **FR-WEB-02**: Drag-and-drop menu mapping works
- [ ] **FR-WEB-03**: PromptPay configuration saves correctly
- [ ] **FR-WEB-04**: Can create users with different roles
- [ ] **FR-BR-01**: Menu mapping table populated and queryable
- [ ] **FR-BR-02**: Orders display from all sources
- [ ] **FR-BR-03**: Stop-sell triggers sync to external platforms

---

## Notes for Executor

1. **Test each task** before committing
2. **Run `bun typecheck`** after TypeScript changes
3. **Run migrations** after schema changes
4. **Verify i18n** by switching languages in UI
5. **Check tenant isolation** by testing with multiple organizations

---

_Plan created: 2026-02-04_
_SRS Version: 1.1_
_Estimated tasks: 20_
