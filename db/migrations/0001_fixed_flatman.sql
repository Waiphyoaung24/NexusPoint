CREATE TYPE "public"."staff_role" AS ENUM('owner', 'manager', 'cashier', 'waiter', 'kitchen');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'seated', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."table_shape" AS ENUM('round', 'rectangle', 'bar_stool');--> statement-breakpoint
CREATE TYPE "public"."table_status" AS ENUM('available', 'occupied', 'reserved', 'cleaning');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."void_type" AS ENUM('item', 'order');--> statement-breakpoint
CREATE TYPE "public"."order_source" AS ENUM('pos', 'grab', 'wongnai', 'lineman');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('dine_in', 'takeaway', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('grab', 'wongnai', 'lineman');--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"name" text NOT NULL,
	"name_th" text,
	"sku" text,
	"quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit" text NOT NULL,
	"low_stock_threshold" numeric(10, 2) DEFAULT '10',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"menu_item_id" text,
	"name" text NOT NULL,
	"name_th" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"notes" text,
	"is_voided" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item_modifier" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" text NOT NULL,
	"modifier_option_id" text,
	"name" text NOT NULL,
	"price_adjustment" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_config" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"prompt_pay_id" text,
	"prompt_pay_name" text,
	"shop_logo_url" text,
	"receipt_header" text,
	"receipt_footer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_config_org_branch_unique" UNIQUE("organization_id","branch_id")
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"table_id" text,
	"guest_name" text NOT NULL,
	"guest_phone" text,
	"party_size" integer NOT NULL,
	"reserved_at" timestamp with time zone NOT NULL,
	"notes" text,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"auto_clear_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "table" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"number" integer NOT NULL,
	"label" text,
	"seats" integer DEFAULT 4 NOT NULL,
	"shape" "table_shape" DEFAULT 'rectangle' NOT NULL,
	"position_x" numeric(8, 2) DEFAULT '0' NOT NULL,
	"position_y" numeric(8, 2) DEFAULT '0' NOT NULL,
	"status" "table_status" DEFAULT 'available' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "table_branch_number_unique" UNIQUE("branch_id","number")
);
--> statement-breakpoint
CREATE TABLE "menu_item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"name_th" text,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"category" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_item_modifier_group" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" text NOT NULL,
	"modifier_group_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_item_mod_group_unique" UNIQUE("menu_item_id","modifier_group_id")
);
--> statement-breakpoint
CREATE TABLE "modifier_group" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"name" text NOT NULL,
	"name_th" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modifier_option" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"modifier_group_id" text NOT NULL,
	"name" text NOT NULL,
	"name_th" text,
	"price_adjustment" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"order_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"approver_id" text,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "void_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"order_id" text NOT NULL,
	"order_item_id" text,
	"requester_id" text NOT NULL,
	"approver_id" text,
	"void_type" "void_type" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "z_report" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"generated_by" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"gross_sales" numeric(12, 2) NOT NULL,
	"net_sales" numeric(12, 2) NOT NULL,
	"vat_amount" numeric(12, 2) NOT NULL,
	"discount_total" numeric(12, 2) NOT NULL,
	"void_total" numeric(12, 2) NOT NULL,
	"tip_total" numeric(12, 2) NOT NULL,
	"cash_total" numeric(12, 2) NOT NULL,
	"promptpay_total" numeric(12, 2) NOT NULL,
	"card_total" numeric(12, 2) NOT NULL,
	"other_total" numeric(12, 2) NOT NULL,
	"order_count" integer NOT NULL,
	"dine_in_count" integer NOT NULL,
	"takeaway_count" integer NOT NULL,
	"delivery_count" integer NOT NULL,
	"top_items" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"external_order_id" text,
	"source" "order_source" NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"customer_name" text,
	"customer_phone" text,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"table_id" text,
	"order_type" "order_type",
	"created_by" text,
	"processed_by" text,
	"discount_amount" numeric(10, 2),
	"vat_amount" numeric(10, 2),
	"vat_rate" numeric(5, 2) DEFAULT '7.00',
	"tip_amount" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "combo_item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"combo_meal_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_substitutable" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combo_meal" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"name" text NOT NULL,
	"name_th" text,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_mapping" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	"platform" "platform" NOT NULL,
	"external_id" text NOT NULL,
	"external_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_mapping_item_platform_unique" UNIQUE("menu_item_id","platform")
);
--> statement-breakpoint
CREATE TABLE "pricing_schedule" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"days_of_week" integer[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_schedule_item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pricing_schedule_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	"override_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_schedule_item_unique" UNIQUE("pricing_schedule_id","menu_item_id")
);
--> statement-breakpoint
CREATE TABLE "recipe" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	"inventory_id" text NOT NULL,
	"quantity_per_serving" numeric(10, 4) NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_menu_item_inventory_unique" UNIQUE("menu_item_id","inventory_id")
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_modifier" ADD CONSTRAINT "order_item_modifier_order_item_id_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_config" ADD CONSTRAINT "payment_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_config" ADD CONSTRAINT "payment_config_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_table_id_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table" ADD CONSTRAINT "table_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table" ADD CONSTRAINT "table_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch" ADD CONSTRAINT "branch_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" ADD CONSTRAINT "menu_item_modifier_group_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_modifier_group" ADD CONSTRAINT "menu_item_modifier_group_modifier_group_id_modifier_group_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_group" ADD CONSTRAINT "modifier_group_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_group" ADD CONSTRAINT "modifier_group_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_option" ADD CONSTRAINT "modifier_option_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifier_option" ADD CONSTRAINT "modifier_option_modifier_group_id_modifier_group_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "public"."modifier_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_log" ADD CONSTRAINT "discount_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_log" ADD CONSTRAINT "discount_log_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_log" ADD CONSTRAINT "discount_log_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_log" ADD CONSTRAINT "discount_log_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_log" ADD CONSTRAINT "discount_log_approver_id_user_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "void_log" ADD CONSTRAINT "void_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "void_log" ADD CONSTRAINT "void_log_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "void_log" ADD CONSTRAINT "void_log_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "void_log" ADD CONSTRAINT "void_log_order_item_id_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "void_log" ADD CONSTRAINT "void_log_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "void_log" ADD CONSTRAINT "void_log_approver_id_user_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "z_report" ADD CONSTRAINT "z_report_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "z_report" ADD CONSTRAINT "z_report_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "z_report" ADD CONSTRAINT "z_report_generated_by_user_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_table_id_table_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_item" ADD CONSTRAINT "combo_item_combo_meal_id_combo_meal_id_fk" FOREIGN KEY ("combo_meal_id") REFERENCES "public"."combo_meal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_item" ADD CONSTRAINT "combo_item_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_meal" ADD CONSTRAINT "combo_meal_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_meal" ADD CONSTRAINT "combo_meal_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_mapping" ADD CONSTRAINT "menu_mapping_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_mapping" ADD CONSTRAINT "menu_mapping_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_schedule" ADD CONSTRAINT "pricing_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_schedule" ADD CONSTRAINT "pricing_schedule_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_schedule_item" ADD CONSTRAINT "pricing_schedule_item_pricing_schedule_id_pricing_schedule_id_fk" FOREIGN KEY ("pricing_schedule_id") REFERENCES "public"."pricing_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_schedule_item" ADD CONSTRAINT "pricing_schedule_item_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_organization_id_idx" ON "inventory" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "inventory_branch_id_idx" ON "inventory" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "inventory_sku_idx" ON "inventory" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "order_item_order_id_idx" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_item_org_id_idx" ON "order_item" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "order_item_menu_item_id_idx" ON "order_item" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "order_item_is_voided_idx" ON "order_item" USING btree ("is_voided");--> statement-breakpoint
CREATE INDEX "order_item_modifier_item_id_idx" ON "order_item_modifier" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "payment_config_organization_id_idx" ON "payment_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_config_branch_id_idx" ON "payment_config" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "reservation_org_id_idx" ON "reservation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "reservation_branch_id_idx" ON "reservation" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "reservation_table_id_idx" ON "reservation" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "reservation_reserved_at_idx" ON "reservation" USING btree ("reserved_at");--> statement-breakpoint
CREATE INDEX "reservation_status_idx" ON "reservation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "table_org_id_idx" ON "table" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "table_branch_id_idx" ON "table" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "table_status_idx" ON "table" USING btree ("status");--> statement-breakpoint
CREATE INDEX "menu_item_organization_id_idx" ON "menu_item" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "menu_item_branch_id_idx" ON "menu_item" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "menu_item_sku_idx" ON "menu_item" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "menu_item_category_idx" ON "menu_item" USING btree ("category");--> statement-breakpoint
CREATE INDEX "branch_organization_id_idx" ON "branch" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "menu_item_mod_group_item_idx" ON "menu_item_modifier_group" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "menu_item_mod_group_group_idx" ON "menu_item_modifier_group" USING btree ("modifier_group_id");--> statement-breakpoint
CREATE INDEX "modifier_group_org_id_idx" ON "modifier_group" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "modifier_group_branch_id_idx" ON "modifier_group" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "modifier_option_group_id_idx" ON "modifier_option" USING btree ("modifier_group_id");--> statement-breakpoint
CREATE INDEX "modifier_option_org_id_idx" ON "modifier_option" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "discount_log_org_id_idx" ON "discount_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "discount_log_order_id_idx" ON "discount_log" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "discount_log_requester_id_idx" ON "discount_log" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "discount_log_created_at_idx" ON "discount_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "void_log_org_id_idx" ON "void_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "void_log_order_id_idx" ON "void_log" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "void_log_requester_id_idx" ON "void_log" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "void_log_created_at_idx" ON "void_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "z_report_org_id_idx" ON "z_report" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "z_report_branch_id_idx" ON "z_report" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "z_report_period_start_idx" ON "z_report" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "z_report_generated_by_idx" ON "z_report" USING btree ("generated_by");--> statement-breakpoint
CREATE INDEX "order_organization_id_idx" ON "order" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "order_branch_id_idx" ON "order" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "order_source_idx" ON "order" USING btree ("source");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_external_id_idx" ON "order" USING btree ("external_order_id");--> statement-breakpoint
CREATE INDEX "order_created_at_idx" ON "order" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_table_id_idx" ON "order" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "order_order_type_idx" ON "order" USING btree ("order_type");--> statement-breakpoint
CREATE INDEX "order_created_by_idx" ON "order" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "combo_item_combo_meal_id_idx" ON "combo_item" USING btree ("combo_meal_id");--> statement-breakpoint
CREATE INDEX "combo_item_menu_item_id_idx" ON "combo_item" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "combo_meal_org_id_idx" ON "combo_meal" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "combo_meal_branch_id_idx" ON "combo_meal" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "combo_meal_is_available_idx" ON "combo_meal" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "menu_mapping_organization_id_idx" ON "menu_mapping" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "menu_mapping_menu_item_id_idx" ON "menu_mapping" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "menu_mapping_platform_idx" ON "menu_mapping" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "pricing_schedule_org_id_idx" ON "pricing_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "pricing_schedule_branch_id_idx" ON "pricing_schedule" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "pricing_schedule_is_active_idx" ON "pricing_schedule" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "pricing_schedule_item_schedule_id_idx" ON "pricing_schedule_item" USING btree ("pricing_schedule_id");--> statement-breakpoint
CREATE INDEX "pricing_schedule_item_menu_item_id_idx" ON "pricing_schedule_item" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "recipe_org_id_idx" ON "recipe" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "recipe_menu_item_id_idx" ON "recipe" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "recipe_inventory_id_idx" ON "recipe" USING btree ("inventory_id");