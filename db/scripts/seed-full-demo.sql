-- Comprehensive demo data for burma-food-house org
-- Covers: menu, modifiers, inventory, tables, orders, reservations, mappings, reports

-- === Variables ===
-- org: a8443bf3-3b21-4bd4-835d-601861908282
-- branch: 247e7f11-b655-43cc-b963-98d1ef25936a
-- user: 872cdee7-dd6e-4c01-bdde-68057664ac51 (wai.1998@gmail.com)

BEGIN;

-- ============================================================================
-- 1. MENU ITEMS (12 items across 5 categories)
-- ============================================================================
INSERT INTO menu_item (id, organization_id, sku, name, name_th, description, price, category, is_available, sort_order) VALUES
  ('mi-001', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-001', 'Mohinga', 'မုန့်ဟင်းခါး', 'Traditional Burmese fish noodle soup', '120.00', 'Soup', true, 1),
  ('mi-002', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-002', 'Shan Noodles', 'ရှမ်းခေါက်ဆွဲ', 'Shan-style rice noodles with chicken', '100.00', 'Noodles', true, 2),
  ('mi-003', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-003', 'Tea Leaf Salad', 'လက်ဖက်သုပ်', 'Pickled tea leaf salad with nuts', '90.00', 'Salad', true, 3),
  ('mi-004', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-004', 'Burmese Curry (Chicken)', 'ကြက်သားဟင်း', 'Slow-cooked chicken curry', '160.00', 'Main Course', true, 4),
  ('mi-005', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-005', 'Burmese Curry (Pork)', 'ဝက်သားဟင်း', 'Slow-cooked pork curry', '170.00', 'Main Course', true, 5),
  ('mi-006', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-006', 'Samosa Soup', 'ဆမူဆာဟင်းခါး', 'Crispy samosas in lentil broth', '110.00', 'Soup', true, 6),
  ('mi-007', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-007', 'Coconut Rice', 'အုန်းနို့ထမင်း', 'Steamed rice with coconut milk', '50.00', 'Sides', true, 7),
  ('mi-008', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-008', 'Fried Spring Rolls', 'အသုပ်ကြော်', 'Crispy vegetable spring rolls (4 pcs)', '80.00', 'Appetizer', true, 8),
  ('mi-009', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-009', 'Myanmar Beer', 'မြန်မာဘီယာ', 'Local draft beer 330ml', '90.00', 'Drinks', true, 9),
  ('mi-010', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-010', 'Thai Iced Tea', 'ชาเย็น', 'Sweet Thai milk tea with ice', '60.00', 'Drinks', true, 10),
  ('mi-011', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-011', 'Falooda', 'ဖာလူးဒါ', 'Rose syrup dessert drink with basil seeds', '80.00', 'Dessert', true, 11),
  ('mi-012', 'a8443bf3-3b21-4bd4-835d-601861908282', 'BFH-012', 'Htamin Jin', 'ထမင်းချဉ်', 'Sour rice balls with fried fish', '95.00', 'Main Course', true, 12)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. MODIFIER GROUPS & OPTIONS
-- ============================================================================
INSERT INTO modifier_group (id, organization_id, name, name_th, is_required, min_selections, max_selections, sort_order) VALUES
  ('mg-001', 'a8443bf3-3b21-4bd4-835d-601861908282', 'Spice Level', 'ระดับความเผ็ด', true, 1, 1, 1),
  ('mg-002', 'a8443bf3-3b21-4bd4-835d-601861908282', 'Add-ons', 'เพิ่มเติม', false, 0, 3, 2),
  ('mg-003', 'a8443bf3-3b21-4bd4-835d-601861908282', 'Size', 'ขนาด', true, 1, 1, 3),
  ('mg-004', 'a8443bf3-3b21-4bd4-835d-601861908282', 'Protein Choice', 'เลือกโปรตีน', true, 1, 1, 4)
ON CONFLICT DO NOTHING;

INSERT INTO modifier_option (id, organization_id, modifier_group_id, name, name_th, price_adjustment, is_default, sort_order) VALUES
  -- Spice Level
  ('mo-001', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-001', 'Mild', 'ไม่เผ็ด', '0.00', true, 1),
  ('mo-002', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-001', 'Medium', 'เผ็ดกลาง', '0.00', false, 2),
  ('mo-003', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-001', 'Extra Spicy', 'เผ็ดมาก', '10.00', false, 3),
  -- Add-ons
  ('mo-004', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-002', 'Extra Egg', 'ไข่เพิ่ม', '15.00', false, 1),
  ('mo-005', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-002', 'Extra Noodles', 'เส้นเพิ่ม', '20.00', false, 2),
  ('mo-006', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-002', 'Crispy Onions', 'หัวหอมเจียว', '10.00', false, 3),
  -- Size
  ('mo-007', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-003', 'Regular', 'ปกติ', '0.00', true, 1),
  ('mo-008', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-003', 'Large', 'ใหญ่', '30.00', false, 2),
  -- Protein
  ('mo-009', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-004', 'Chicken', 'ไก่', '0.00', true, 1),
  ('mo-010', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-004', 'Pork', 'หมู', '0.00', false, 2),
  ('mo-011', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mg-004', 'Shrimp', 'กุ้ง', '30.00', false, 3)
ON CONFLICT DO NOTHING;

-- Link modifiers to menu items
INSERT INTO menu_item_modifier_group (id, menu_item_id, modifier_group_id, sort_order) VALUES
  ('mimg-001', 'mi-001', 'mg-001', 1), -- Mohinga + Spice Level
  ('mimg-002', 'mi-001', 'mg-002', 2), -- Mohinga + Add-ons
  ('mimg-003', 'mi-001', 'mg-003', 3), -- Mohinga + Size
  ('mimg-004', 'mi-002', 'mg-001', 1), -- Shan Noodles + Spice Level
  ('mimg-005', 'mi-002', 'mg-004', 2), -- Shan Noodles + Protein
  ('mimg-006', 'mi-003', 'mg-001', 1), -- Tea Leaf Salad + Spice Level
  ('mimg-007', 'mi-004', 'mg-001', 1), -- Chicken Curry + Spice Level
  ('mimg-008', 'mi-004', 'mg-003', 2), -- Chicken Curry + Size
  ('mimg-009', 'mi-005', 'mg-001', 1), -- Pork Curry + Spice Level
  ('mimg-010', 'mi-005', 'mg-003', 2), -- Pork Curry + Size
  ('mimg-011', 'mi-006', 'mg-003', 1)  -- Samosa Soup + Size
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. FLOOR PLAN TABLES (10 tables in various statuses & shapes)
-- ============================================================================
INSERT INTO "table" (id, organization_id, branch_id, number, label, seats, shape, position_x, position_y, status, is_active) VALUES
  ('tbl-001', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 1, NULL, 4, 'rectangle', 1, 1, 'available', true),
  ('tbl-002', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 2, NULL, 4, 'rectangle', 4, 1, 'occupied', true),
  ('tbl-003', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 3, NULL, 2, 'round', 7, 1, 'available', true),
  ('tbl-004', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 4, 'VIP', 6, 'rectangle', 1, 4, 'reserved', true),
  ('tbl-005', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 5, NULL, 4, 'rectangle', 4, 4, 'available', true),
  ('tbl-006', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 6, NULL, 2, 'round', 7, 4, 'cleaning', true),
  ('tbl-007', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 7, 'Patio', 8, 'rectangle', 1, 7, 'occupied', true),
  ('tbl-008', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 8, NULL, 4, 'rectangle', 4, 7, 'available', true),
  ('tbl-009', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 9, 'Bar', 2, 'bar_stool', 10, 1, 'available', true),
  ('tbl-010', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 10, 'Bar', 2, 'bar_stool', 10, 3, 'occupied', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. INVENTORY (15 ingredients)
-- ============================================================================
INSERT INTO inventory (id, organization_id, branch_id, name, name_th, sku, quantity, unit, low_stock_threshold, is_active) VALUES
  ('inv-001', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Rice Noodles', 'เส้นขนมจีน', 'INV-001', '50.00', 'kg', '10', true),
  ('inv-002', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Catfish', 'ปลาดุก', 'INV-002', '25.00', 'kg', '5', true),
  ('inv-003', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Chicken Thigh', 'สะโพกไก่', 'INV-003', '30.00', 'kg', '8', true),
  ('inv-004', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Pork Belly', 'หมูสามชั้น', 'INV-004', '20.00', 'kg', '5', true),
  ('inv-005', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Shrimp', 'กุ้ง', 'INV-005', '15.00', 'kg', '5', true),
  ('inv-006', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Tea Leaves (Pickled)', 'ใบชาดอง', 'INV-006', '8.00', 'kg', '3', true),
  ('inv-007', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Coconut Milk', 'กะทิ', 'INV-007', '40.00', 'litre', '10', true),
  ('inv-008', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Jasmine Rice', 'ข้าวหอมมะลิ', 'INV-008', '100.00', 'kg', '20', true),
  ('inv-009', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Cooking Oil', 'น้ำมันพืช', 'INV-009', '30.00', 'litre', '10', true),
  ('inv-010', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Eggs', 'ไข่ไก่', 'INV-010', '200.00', 'pcs', '50', true),
  ('inv-011', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Onions', 'หัวหอม', 'INV-011', '3.00', 'kg', '5', true),
  ('inv-012', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Garlic', 'กระเทียม', 'INV-012', '5.00', 'kg', '3', true),
  ('inv-013', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Myanmar Beer (cans)', 'เบียร์พม่า', 'INV-013', '120.00', 'pcs', '30', true),
  ('inv-014', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Thai Tea Mix', 'ชาไทย', 'INV-014', '10.00', 'kg', '3', true),
  ('inv-015', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'Spring Roll Wrappers', 'แผ่นปอเปี๊ยะ', 'INV-015', '15.00', 'pack', '5', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ORDERS (25 orders across statuses, sources, types, and dates)
-- ============================================================================

-- Today's pending/active orders (for Live Orders page)
INSERT INTO "order" (id, organization_id, branch_id, external_order_id, source, status, customer_name, customer_phone, items, subtotal, discount, total, notes, table_id, order_type, created_by, vat_rate, vat_amount, created_at) VALUES
  ('ord-001', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', NULL, 'pos', 'pending', 'Walk-in Guest', NULL,
   '[{"menuItemId":"mi-001","name":"Mohinga","quantity":2,"price":"120.00"},{"menuItemId":"mi-007","name":"Coconut Rice","quantity":2,"price":"50.00"}]',
   '340.00', '0', '363.80', NULL, 'tbl-002', 'dine_in', '872cdee7-dd6e-4c01-bdde-68057664ac51', '7.00', '23.80', NOW() - interval '10 minutes'),

  ('ord-002', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'GRB-20260311-001', 'grab', 'accepted', 'Somchai P.', '0891234567',
   '[{"menuItemId":"mi-004","name":"Burmese Curry (Chicken)","quantity":1,"price":"160.00"},{"menuItemId":"mi-010","name":"Thai Iced Tea","quantity":2,"price":"60.00"}]',
   '280.00', '0', '299.60', 'No cilantro please', NULL, 'delivery', NULL, '7.00', '19.60', NOW() - interval '25 minutes'),

  ('ord-003', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', NULL, 'pos', 'preparing', 'Table 7 Group', NULL,
   '[{"menuItemId":"mi-001","name":"Mohinga","quantity":3,"price":"120.00"},{"menuItemId":"mi-003","name":"Tea Leaf Salad","quantity":2,"price":"90.00"},{"menuItemId":"mi-008","name":"Fried Spring Rolls","quantity":2,"price":"80.00"},{"menuItemId":"mi-009","name":"Myanmar Beer","quantity":4,"price":"90.00"}]',
   '900.00', '0', '963.00', NULL, 'tbl-007', 'dine_in', '872cdee7-dd6e-4c01-bdde-68057664ac51', '7.00', '63.00', NOW() - interval '35 minutes'),

  ('ord-004', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'WNG-20260311-001', 'wongnai', 'pending', 'Napat K.', '0851112222',
   '[{"menuItemId":"mi-002","name":"Shan Noodles","quantity":1,"price":"100.00"},{"menuItemId":"mi-006","name":"Samosa Soup","quantity":1,"price":"110.00"}]',
   '210.00', '0', '224.70', NULL, NULL, 'delivery', NULL, '7.00', '14.70', NOW() - interval '5 minutes'),

  ('ord-005', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', NULL, 'pos', 'ready', NULL, NULL,
   '[{"menuItemId":"mi-005","name":"Burmese Curry (Pork)","quantity":1,"price":"170.00"},{"menuItemId":"mi-007","name":"Coconut Rice","quantity":1,"price":"50.00"}]',
   '220.00', '0', '235.40', 'Takeaway - extra rice', NULL, 'takeaway', '872cdee7-dd6e-4c01-bdde-68057664ac51', '7.00', '15.40', NOW() - interval '15 minutes'),

  ('ord-006', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', NULL, 'pos', 'accepted', 'Bar Customer', NULL,
   '[{"menuItemId":"mi-009","name":"Myanmar Beer","quantity":2,"price":"90.00"},{"menuItemId":"mi-008","name":"Fried Spring Rolls","quantity":1,"price":"80.00"}]',
   '260.00', '0', '278.20', NULL, 'tbl-010', 'dine_in', '872cdee7-dd6e-4c01-bdde-68057664ac51', '7.00', '18.20', NOW() - interval '20 minutes');

-- Completed orders from today & recent days (for Dashboard stats & Reports)
INSERT INTO "order" (id, organization_id, branch_id, source, status, customer_name, items, subtotal, discount, total, order_type, created_by, vat_rate, vat_amount, created_at, accepted_at, completed_at) VALUES
  ('ord-007', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'pos', 'completed', 'Lunch guest 1',
   '[{"menuItemId":"mi-001","name":"Mohinga","quantity":1,"price":"120.00"}]',
   '120.00', '0', '128.40', 'dine_in', '872cdee7-dd6e-4c01-bdde-68057664ac51', '7.00', '8.40',
   NOW() - interval '3 hours', NOW() - interval '2 hours 50 minutes', NOW() - interval '2 hours 30 minutes'),

  ('ord-008', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'grab', 'completed', 'Delivery Customer A',
   '[{"menuItemId":"mi-004","name":"Burmese Curry (Chicken)","quantity":2,"price":"160.00"},{"menuItemId":"mi-007","name":"Coconut Rice","quantity":2,"price":"50.00"}]',
   '420.00', '0', '449.40', 'delivery', NULL, '7.00', '29.40',
   NOW() - interval '4 hours', NOW() - interval '3 hours 55 minutes', NOW() - interval '3 hours 30 minutes'),

  ('ord-009', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'pos', 'completed', 'Regular Mr. Lin',
   '[{"menuItemId":"mi-002","name":"Shan Noodles","quantity":1,"price":"100.00"},{"menuItemId":"mi-010","name":"Thai Iced Tea","quantity":1,"price":"60.00"}]',
   '160.00', '10.00', '160.50', 'dine_in', '872cdee7-dd6e-4c01-bdde-68057664ac51', '7.00', '10.50',
   NOW() - interval '5 hours', NOW() - interval '4 hours 55 minutes', NOW() - interval '4 hours 30 minutes'),

  ('ord-010', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'wongnai', 'completed', 'Wongnai User',
   '[{"menuItemId":"mi-003","name":"Tea Leaf Salad","quantity":1,"price":"90.00"},{"menuItemId":"mi-001","name":"Mohinga","quantity":1,"price":"120.00"}]',
   '210.00', '0', '224.70', 'delivery', NULL, '7.00', '14.70',
   NOW() - interval '6 hours', NOW() - interval '5 hours 55 minutes', NOW() - interval '5 hours 30 minutes');

-- Yesterday's orders
INSERT INTO "order" (id, organization_id, branch_id, source, status, customer_name, items, subtotal, discount, total, order_type, vat_rate, vat_amount, created_at, completed_at) VALUES
  ('ord-011', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'pos', 'completed', 'Yesterday Guest 1',
   '[{"menuItemId":"mi-001","name":"Mohinga","quantity":2,"price":"120.00"},{"menuItemId":"mi-009","name":"Myanmar Beer","quantity":2,"price":"90.00"}]',
   '420.00', '0', '449.40', 'dine_in', '7.00', '29.40', NOW() - interval '1 day 2 hours', NOW() - interval '1 day 1 hour'),
  ('ord-012', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'grab', 'completed', 'Yesterday Delivery',
   '[{"menuItemId":"mi-004","name":"Burmese Curry (Chicken)","quantity":1,"price":"160.00"}]',
   '160.00', '0', '171.20', 'delivery', '7.00', '11.20', NOW() - interval '1 day 4 hours', NOW() - interval '1 day 3 hours'),
  ('ord-013', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'pos', 'completed', 'Yesterday Group',
   '[{"menuItemId":"mi-002","name":"Shan Noodles","quantity":3,"price":"100.00"},{"menuItemId":"mi-003","name":"Tea Leaf Salad","quantity":2,"price":"90.00"}]',
   '480.00', '20.00', '492.20', 'dine_in', '7.00', '32.20', NOW() - interval '1 day 6 hours', NOW() - interval '1 day 5 hours'),
  ('ord-014', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'pos', 'cancelled', 'Cancelled Order',
   '[{"menuItemId":"mi-005","name":"Burmese Curry (Pork)","quantity":1,"price":"170.00"}]',
   '170.00', '0', '181.90', 'dine_in', '7.00', '11.90', NOW() - interval '1 day 3 hours', NULL);

-- Orders from past week (for reports & analytics)
INSERT INTO "order" (id, organization_id, branch_id, source, status, customer_name, items, subtotal, discount, total, order_type, vat_rate, vat_amount, created_at, completed_at) VALUES
  ('ord-015', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'pos', 'completed', 'Guest',
   '[{"menuItemId":"mi-001","name":"Mohinga","quantity":4,"price":"120.00"}]',
   '480.00', '0', '513.60', 'dine_in', '7.00', '33.60', NOW() - interval '2 days', NOW() - interval '2 days' + interval '30 minutes'),
  ('ord-016', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'grab', 'completed', 'Delivery',
   '[{"menuItemId":"mi-004","name":"Burmese Curry (Chicken)","quantity":2,"price":"160.00"},{"menuItemId":"mi-010","name":"Thai Iced Tea","quantity":2,"price":"60.00"}]',
   '440.00', '0', '470.80', 'delivery', '7.00', '30.80', NOW() - interval '3 days', NOW() - interval '3 days' + interval '45 minutes'),
  ('ord-017', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'wongnai', 'completed', 'Wongnai',
   '[{"menuItemId":"mi-002","name":"Shan Noodles","quantity":2,"price":"100.00"}]',
   '200.00', '0', '214.00', 'delivery', '7.00', '14.00', NOW() - interval '4 days', NOW() - interval '4 days' + interval '40 minutes'),
  ('ord-018', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'pos', 'completed', 'Big Party',
   '[{"menuItemId":"mi-001","name":"Mohinga","quantity":6,"price":"120.00"},{"menuItemId":"mi-003","name":"Tea Leaf Salad","quantity":4,"price":"90.00"},{"menuItemId":"mi-009","name":"Myanmar Beer","quantity":10,"price":"90.00"}]',
   '1980.00', '100.00', '2011.60', 'dine_in', '7.00', '131.60', NOW() - interval '5 days', NOW() - interval '5 days' + interval '2 hours'),
  ('ord-019', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'pos', 'completed', 'Lunch Rush',
   '[{"menuItemId":"mi-006","name":"Samosa Soup","quantity":2,"price":"110.00"},{"menuItemId":"mi-012","name":"Htamin Jin","quantity":2,"price":"95.00"}]',
   '410.00', '0', '438.70', 'dine_in', '7.00', '28.70', NOW() - interval '6 days', NOW() - interval '6 days' + interval '1 hour'),
  ('ord-020', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'grab', 'completed', 'Weekend Delivery',
   '[{"menuItemId":"mi-005","name":"Burmese Curry (Pork)","quantity":3,"price":"170.00"},{"menuItemId":"mi-007","name":"Coconut Rice","quantity":3,"price":"50.00"}]',
   '660.00', '0', '706.20', 'delivery', '7.00', '46.20', NOW() - interval '7 days', NOW() - interval '7 days' + interval '50 minutes');

-- ============================================================================
-- 6. ORDER ITEMS (normalized line items for a few key orders)
-- ============================================================================
INSERT INTO order_item (id, order_id, organization_id, menu_item_id, name, name_th, quantity, unit_price, subtotal, is_voided) VALUES
  -- Order 001 items
  ('oi-001', 'ord-001', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-001', 'Mohinga', 'မုန့်ဟင်းခါး', 2, '120.00', '240.00', false),
  ('oi-002', 'ord-001', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-007', 'Coconut Rice', 'အုန်းနို့ထမင်း', 2, '50.00', '100.00', false),
  -- Order 003 items (big table)
  ('oi-003', 'ord-003', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-001', 'Mohinga', 'မုန့်ဟင်းခါး', 3, '120.00', '360.00', false),
  ('oi-004', 'ord-003', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-003', 'Tea Leaf Salad', 'လက်ဖက်သုပ်', 2, '90.00', '180.00', false),
  ('oi-005', 'ord-003', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-008', 'Fried Spring Rolls', 'အသုပ်ကြော်', 2, '80.00', '160.00', false),
  ('oi-006', 'ord-003', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-009', 'Myanmar Beer', 'မြန်မာဘီယာ', 4, '90.00', '360.00', false),
  -- Order 009 (with voided item)
  ('oi-007', 'ord-009', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-002', 'Shan Noodles', 'ရှမ်းခေါက်ဆွဲ', 1, '100.00', '100.00', false),
  ('oi-008', 'ord-009', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-010', 'Thai Iced Tea', 'ชาเย็น', 1, '60.00', '60.00', false),
  ('oi-009', 'ord-009', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-011', 'Falooda', 'ဖာလူးဒါ', 1, '80.00', '80.00', true)
ON CONFLICT DO NOTHING;

-- Order item modifiers
INSERT INTO order_item_modifier (id, order_item_id, modifier_option_id, name, price_adjustment) VALUES
  ('oim-001', 'oi-001', 'mo-002', 'Medium Spice', '0.00'),
  ('oim-002', 'oi-001', 'mo-004', 'Extra Egg', '15.00'),
  ('oim-003', 'oi-003', 'mo-003', 'Extra Spicy', '10.00'),
  ('oim-004', 'oi-007', 'mo-001', 'Mild', '0.00')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. RESERVATIONS
-- ============================================================================
INSERT INTO reservation (id, organization_id, branch_id, table_id, guest_name, guest_phone, party_size, reserved_at, notes, status) VALUES
  ('res-001', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'tbl-004', 'Khun Wichai', '0812345678', 5, NOW() + interval '2 hours', 'Birthday dinner, need cake', 'confirmed'),
  ('res-002', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'tbl-001', 'Aung Family', '0899876543', 4, NOW() + interval '4 hours', NULL, 'pending'),
  ('res-003', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'tbl-007', 'Corporate Event', '0876543210', 8, NOW() - interval '1 hour', 'Currently seated', 'seated'),
  ('res-004', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', NULL, 'No-show Guest', '0801234567', 2, NOW() - interval '3 hours', NULL, 'no_show')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. MENU MAPPINGS (external platform integration)
-- ============================================================================
INSERT INTO menu_mapping (id, organization_id, menu_item_id, platform, external_id, external_name) VALUES
  ('mm-001', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-001', 'grab', 'GRAB-MHG-001', 'Mohinga Fish Soup'),
  ('mm-002', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-001', 'wongnai', 'WNG-MHG-001', 'โมฮินก้า'),
  ('mm-003', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-002', 'grab', 'GRAB-SHN-001', 'Shan Noodle Bowl'),
  ('mm-004', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-004', 'grab', 'GRAB-CRY-001', 'Burmese Chicken Curry'),
  ('mm-005', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-004', 'wongnai', 'WNG-CRY-001', 'แกงพม่าไก่'),
  ('mm-006', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-005', 'grab', 'GRAB-CRY-002', 'Burmese Pork Curry'),
  ('mm-007', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-003', 'wongnai', 'WNG-TLS-001', 'สลัดใบชา'),
  ('mm-008', 'a8443bf3-3b21-4bd4-835d-601861908282', 'mi-010', 'grab', 'GRAB-TEA-001', 'Thai Iced Tea')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. PAYMENT CONFIG
-- ============================================================================
INSERT INTO payment_config (id, organization_id, branch_id, prompt_pay_id, prompt_pay_name, receipt_header, receipt_footer) VALUES
  ('pc-001', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a',
   '0891234567', 'Burma Food House Co., Ltd.',
   'Burma Food House - Main Branch\n123 Sukhumvit Rd, Bangkok',
   'Thank you for dining with us!\nFollow us @burmafoodhouse')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. Z-REPORTS (end-of-day reports for past 7 days)
-- ============================================================================
INSERT INTO z_report (id, organization_id, branch_id, generated_by, period_start, period_end, gross_sales, net_sales, vat_amount, discount_total, void_total, tip_total, cash_total, promptpay_total, card_total, other_total, order_count, dine_in_count, takeaway_count, delivery_count, top_items) VALUES
  ('zr-001', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', '872cdee7-dd6e-4c01-bdde-68057664ac51',
   (NOW() - interval '1 day')::date, (NOW() - interval '1 day')::date + interval '23 hours 59 minutes',
   '12500.00', '11625.00', '875.00', '120.00', '80.00', '350.00',
   '5200.00', '3800.00', '2625.00', '0.00', 28, 18, 4, 6,
   '[{"menuItemId":"mi-001","name":"Mohinga","count":35,"revenue":"4200.00"},{"menuItemId":"mi-004","name":"Burmese Curry (Chicken)","count":22,"revenue":"3520.00"},{"menuItemId":"mi-009","name":"Myanmar Beer","count":30,"revenue":"2700.00"}]'),
  ('zr-002', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', '872cdee7-dd6e-4c01-bdde-68057664ac51',
   (NOW() - interval '2 days')::date, (NOW() - interval '2 days')::date + interval '23 hours 59 minutes',
   '15200.00', '14100.00', '1064.00', '200.00', '0.00', '420.00',
   '6100.00', '4500.00', '3500.00', '0.00', 35, 22, 5, 8,
   '[{"menuItemId":"mi-001","name":"Mohinga","count":42,"revenue":"5040.00"},{"menuItemId":"mi-002","name":"Shan Noodles","count":28,"revenue":"2800.00"},{"menuItemId":"mi-004","name":"Burmese Curry (Chicken)","count":25,"revenue":"4000.00"}]'),
  ('zr-003', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', '872cdee7-dd6e-4c01-bdde-68057664ac51',
   (NOW() - interval '3 days')::date, (NOW() - interval '3 days')::date + interval '23 hours 59 minutes',
   '9800.00', '9100.00', '686.00', '80.00', '50.00', '280.00',
   '4200.00', '2900.00', '2000.00', '0.00', 22, 14, 3, 5,
   '[{"menuItemId":"mi-001","name":"Mohinga","count":25,"revenue":"3000.00"},{"menuItemId":"mi-003","name":"Tea Leaf Salad","count":18,"revenue":"1620.00"},{"menuItemId":"mi-009","name":"Myanmar Beer","count":20,"revenue":"1800.00"}]'),
  ('zr-004', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', '872cdee7-dd6e-4c01-bdde-68057664ac51',
   (NOW() - interval '4 days')::date, (NOW() - interval '4 days')::date + interval '23 hours 59 minutes',
   '11000.00', '10200.00', '770.00', '150.00', '0.00', '310.00',
   '4800.00', '3200.00', '2200.00', '0.00', 26, 16, 4, 6,
   '[{"menuItemId":"mi-001","name":"Mohinga","count":30,"revenue":"3600.00"},{"menuItemId":"mi-005","name":"Burmese Curry (Pork)","count":20,"revenue":"3400.00"},{"menuItemId":"mi-010","name":"Thai Iced Tea","count":25,"revenue":"1500.00"}]'),
  ('zr-005', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', '872cdee7-dd6e-4c01-bdde-68057664ac51',
   (NOW() - interval '5 days')::date, (NOW() - interval '5 days')::date + interval '23 hours 59 minutes',
   '18500.00', '17200.00', '1295.00', '300.00', '100.00', '550.00',
   '7500.00', '5800.00', '3900.00', '0.00', 42, 28, 6, 8,
   '[{"menuItemId":"mi-001","name":"Mohinga","count":50,"revenue":"6000.00"},{"menuItemId":"mi-004","name":"Burmese Curry (Chicken)","count":35,"revenue":"5600.00"},{"menuItemId":"mi-009","name":"Myanmar Beer","count":45,"revenue":"4050.00"}]'),
  ('zr-006', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', '872cdee7-dd6e-4c01-bdde-68057664ac51',
   (NOW() - interval '6 days')::date, (NOW() - interval '6 days')::date + interval '23 hours 59 minutes',
   '10500.00', '9800.00', '735.00', '100.00', '0.00', '300.00',
   '4500.00', '3100.00', '2200.00', '0.00', 24, 15, 3, 6,
   '[{"menuItemId":"mi-001","name":"Mohinga","count":28,"revenue":"3360.00"},{"menuItemId":"mi-002","name":"Shan Noodles","count":20,"revenue":"2000.00"},{"menuItemId":"mi-006","name":"Samosa Soup","count":15,"revenue":"1650.00"}]'),
  ('zr-007', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', '872cdee7-dd6e-4c01-bdde-68057664ac51',
   (NOW() - interval '7 days')::date, (NOW() - interval '7 days')::date + interval '23 hours 59 minutes',
   '16800.00', '15600.00', '1176.00', '250.00', '60.00', '480.00',
   '6800.00', '5200.00', '3600.00', '0.00', 38, 24, 5, 9,
   '[{"menuItemId":"mi-001","name":"Mohinga","count":45,"revenue":"5400.00"},{"menuItemId":"mi-004","name":"Burmese Curry (Chicken)","count":30,"revenue":"4800.00"},{"menuItemId":"mi-003","name":"Tea Leaf Salad","count":22,"revenue":"1980.00"}]');

-- ============================================================================
-- 11. AUDIT LOGS (discount & void examples)
-- ============================================================================
INSERT INTO discount_log (id, organization_id, branch_id, order_id, requester_id, approver_id, discount_type, discount_value, discount_amount, reason) VALUES
  ('dl-001', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'ord-009', '872cdee7-dd6e-4c01-bdde-68057664ac51', '872cdee7-dd6e-4c01-bdde-68057664ac51', 'fixed', '10.00', '10.00', 'Regular customer loyalty'),
  ('dl-002', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'ord-013', '872cdee7-dd6e-4c01-bdde-68057664ac51', '872cdee7-dd6e-4c01-bdde-68057664ac51', 'percentage', '5.00', '20.00', 'Large group discount'),
  ('dl-003', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'ord-018', '872cdee7-dd6e-4c01-bdde-68057664ac51', '872cdee7-dd6e-4c01-bdde-68057664ac51', 'fixed', '100.00', '100.00', 'Party package deal')
ON CONFLICT DO NOTHING;

INSERT INTO void_log (id, organization_id, branch_id, order_id, order_item_id, requester_id, approver_id, void_type, reason) VALUES
  ('vl-001', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'ord-009', 'oi-009', '872cdee7-dd6e-4c01-bdde-68057664ac51', '872cdee7-dd6e-4c01-bdde-68057664ac51', 'item', 'Customer changed mind'),
  ('vl-002', 'a8443bf3-3b21-4bd4-835d-601861908282', '247e7f11-b655-43cc-b963-98d1ef25936a', 'ord-014', NULL, '872cdee7-dd6e-4c01-bdde-68057664ac51', '872cdee7-dd6e-4c01-bdde-68057664ac51', 'order', 'Customer left without ordering')
ON CONFLICT DO NOTHING;

COMMIT;
