-- Migration 037: Import 21 new orders (96-116) from June 2026 Excel v2
-- Generated from orders_v3_07_06_2026 (1) (1).xlsx

-- ============================================
-- 1. NEW CUSTOMERS
-- ============================================
SET search_path = sales, public;

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '99179313-ec9f-55cc-ac82-87c764685202', 'a0000000-0000-0000-0000-000000000001', 'CUST-00102', 'رحمه حسن محمد', 'رحمه حسن محمد', '', '01030581694', 'القليوبية', 'العبور', 'مدينه العبور الحي التاسع شارع امين الهنيدي بلوك 52 عماره 8 الدور الثاني شقه 24'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رحمه حسن محمد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '8b0e63b5-5bc9-53c8-825f-c0c975f25505', 'a0000000-0000-0000-0000-000000000001', 'CUST-00103', 'جنا المصري', 'جنا المصري', '', '01011064889', 'الفيوم', 'الفيوم', 'الفيوم الصيفية بجوار بنزينة بهنساوى'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'جنا المصري' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT 'cdbc3b5a-c128-5efe-b4a8-5437a47a2b2d', 'a0000000-0000-0000-0000-000000000001', 'CUST-00104', 'نور عصام', 'نور عصام', '', '01158151949', 'الإسكندرية', 'العجمي', 'العجمي البيطاش آخر شارع الحي جوا شارع صيدليه النصر العماره القبل القهوه'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'نور عصام' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '7a11d127-e7f6-553c-951f-86c0c19216fa', 'a0000000-0000-0000-0000-000000000001', 'CUST-00105', 'رنين جميل', 'رنين جميل', '', '01099676830', 'دمياط', 'العنانية', 'دمياط العنانيه أمام المجلس المحلي'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رنين جميل' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT 'e4e85de2-5f0e-52d2-aea9-57f22b53c015', 'a0000000-0000-0000-0000-000000000001', 'CUST-00106', 'ولاء ضيف', 'ولاء ضيف', '', '01007727701', 'الجيزة', 'الحوامدية', 'الحوامديه طريق 11 شارع ابوجبر العماره امام حمام السباحة اكوا ستار الدور الاول'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'ولاء ضيف' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '569dd3f7-7f68-5ba5-a7c5-6afe4dadebbe', 'a0000000-0000-0000-0000-000000000001', 'CUST-00107', 'اسماء احمد زكريا', 'اسماء احمد زكريا', '', '01149107755', 'أسوان', 'أسوان', 'اسوان طريق السادات حي خالد بن الوليد'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'اسماء احمد زكريا' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT 'b5f1abfd-8622-5d6d-b4c0-c8bac1d3532c', 'a0000000-0000-0000-0000-000000000001', 'CUST-00108', 'مي السيد', 'مي السيد', '', '01228422628', 'بورسعيد', 'بورسعيد', 'بورسعيد حي الزهور منطقه ال500 عند مسجد البغدادي عماره 83 فوق صيدليه الصواف'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'مي السيد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT 'c91e02b4-32a9-5db8-87f6-feafef8226ed', 'a0000000-0000-0000-0000-000000000001', 'CUST-00109', 'فرح خالد', 'فرح خالد', '', '01012041655', 'الجيزة', 'أرض اللواء', '9 شارع فايز سليمان خلف التوحيد والنور ارض اللواء'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'فرح خالد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '69d0bc10-6345-526f-b63c-515ed9cd5016', 'a0000000-0000-0000-0000-000000000001', 'CUST-00110', 'ميار محمد ابراهيم', 'ميار محمد ابراهيم', '', '01144475858', 'الجيزة', 'حدائق الأهرام', '89ج بوابة أحمس حدائق الأهرام'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'ميار محمد ابراهيم' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '4bb55b1e-34d5-50fa-94fc-1a991512746c', 'a0000000-0000-0000-0000-000000000001', 'CUST-00111', 'علا سلامه محمد', 'علا سلامه محمد', '', '01224395220', 'القليوبية', 'كفر شكر', 'كفر شكر كفر تصفا موقف العمومي سنتر علا سلامه'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'علا سلامه محمد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '7848f427-5fec-5f8b-a38d-90076167c322', 'a0000000-0000-0000-0000-000000000001', 'CUST-00112', 'زينه طارق', 'زينه طارق', '', '01000494433', 'القاهرة', 'مدينة نصر', 'كمبوند جاردينيا سيتي زهراء مدينة نصر عمارة 62 شقة 53'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'زينه طارق' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT 'ee31187b-34cb-5a8f-95e4-408c69051bcf', 'a0000000-0000-0000-0000-000000000001', 'CUST-00113', 'Nour Hendawy', 'Nour Hendawy', '', '01147090402', 'القاهرة', 'مدينة نصر', '7 ابن الهيثم متفرع من عباس العقاد الدور الثالث'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Nour Hendawy' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '35cf2d6f-f7f9-5819-97bb-8b71366ca86f', 'a0000000-0000-0000-0000-000000000001', 'CUST-00114', 'امال منير', 'امال منير', '', '01012954929', 'الدقهلية', 'شربين', 'شربين شارع المركز أمام مدرسة الصنايع برج طيبة الدور التاني'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'امال منير' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT 'c74a9de2-f208-5e7d-8cb5-c41bfcf99d15', 'a0000000-0000-0000-0000-000000000001', 'CUST-00115', 'رنا', 'رنا', '', '01112334414', 'الجيزة', '6 أكتوبر', 'اكتوبر الحي الرابع مجاورة 6 عمارة 1131 شقة 6'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رنا' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '624317c3-13ce-5127-9501-0ed9dc1aea16', 'a0000000-0000-0000-0000-000000000001', 'CUST-00116', 'رنا سعيد', 'رنا سعيد', '', '01094664862', 'الغربية', 'طنطا', 'طنطا سبرباي شارع السندبات عمارة معرض المها الدور التالت'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رنا سعيد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '9b150f3e-9da5-5c99-849e-4b007d53bfff', 'a0000000-0000-0000-0000-000000000001', 'CUST-00117', 'رضوى شريف', 'رضوى شريف', '', '01202168710', 'بورسعيد', 'بورسعيد', 'أرض العزب ورا قهوة بصلة جمب محمصة الحطاب استوديو رضوى شريف'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رضوى شريف' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '7eb51930-fd86-56e4-afb2-28bd45a2e677', 'a0000000-0000-0000-0000-000000000001', 'CUST-00118', 'ايه العبسي', 'ايه العبسي', '', '01012828587', 'كفر الشيخ', 'دسوق', 'دسوق شارع المركز قدام المغربي'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'ايه العبسي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '5b26dab5-3f19-53d8-b19b-72a0a8fdf140', 'a0000000-0000-0000-0000-000000000001', 'CUST-00119', 'منة خلاف', 'منة خلاف', '', '01026623278', 'الغربية', 'كفر الزيات', 'كفر الزيات شارع عرابي عند الوكايل العمارة اللي جمب قهوة الفحات'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'منة خلاف' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, customer_number, name, first_name, last_name, phone, governorate, city, address)
SELECT '3b0e0b4b-766d-5478-9ac5-86dde423d21b', 'a0000000-0000-0000-0000-000000000001', 'CUST-00120', 'زينب غريب', 'زينب غريب', '', '01092740724', 'السويس', 'السويس', 'الألبان شارع الورش عند سوبر ماركت الأمراء'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'زينب غريب' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- ============================================
-- 2. ORDERS, ITEMS, PAYMENTS
-- ============================================

-- Order 96: رحمه حسن محمد
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT 'e5554d77-3f51-5bb9-a9c6-2211176c5269', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0096', '99179313-ec9f-55cc-ac82-87c764685202', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 35000, 8500, 0, 35000, 43500, 8500, 'partial', 'cod', 'whatsapp', '{"governorate": "القليوبية", "city": "العبور", "address": "مدينه العبور الحي التاسع شارع امين الهنيدي بلوك 52 عماره 8 الدور الثاني شقه 24", "phone": "+201030581694"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0096' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'd775c29e-2162-5dcd-8785-a1d363010003', 'e5554d77-3f51-5bb9-a9c6-2211176c5269', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'فرشة دابل ليكويد وباودر' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%فرشة%دابل%ليكويد%وباودر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'فرشة دابل ليكويد وباودر', 1, 35000, 35000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'd775c29e-2162-5dcd-8785-a1d363010003');

INSERT INTO payments (id, tenant_id, order_id, payment_number, method, amount, status, received_at, created_at)
SELECT '803ea6d4-46ef-5dd6-98da-debe6ec389cf', 'a0000000-0000-0000-0000-000000000001', 'e5554d77-3f51-5bb9-a9c6-2211176c5269', 'PAY-0096', 'cod', 8500, 'completed', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = '803ea6d4-46ef-5dd6-98da-debe6ec389cf');

-- Order 97: هاجر النجار
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '9c143933-3d71-5349-a3c6-74bb455ccda1', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0097', (SELECT id FROM customers WHERE name = 'هاجر النجار' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 199000, 10000, 0, 199000, 209000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "كفر الشيخ", "city": "الرياض", "address": "كفر الشيخ الرياض بجوار بنك مصر برج جنات", "phone": "+201020520370"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0097' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'e8800406-5050-5b44-9c43-debc988cbd64', '9c143933-3d71-5349-a3c6-74bb455ccda1', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'كومباكت باودر بينك' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%كومباكت%باودر%بينك%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'كومباكت باودر بينك', 1, 58000, 58000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'e8800406-5050-5b44-9c43-debc988cbd64');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'd1009456-a10c-54fd-806a-0a2db302aca0', '9c143933-3d71-5349-a3c6-74bb455ccda1', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بلاشر 014' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بلاشر%014%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بلاشر 014', 1, 47500, 47500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'd1009456-a10c-54fd-806a-0a2db302aca0');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'b2131fae-beec-58e7-8f2b-36ac99a52776', '9c143933-3d71-5349-a3c6-74bb455ccda1', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'فرشة فونديشن دابل جوت هير' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%فرشة%فونديشن%دابل%جوت%هير%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'فرشة فونديشن دابل جوت هير', 1, 65000, 65000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'b2131fae-beec-58e7-8f2b-36ac99a52776');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'cd7c8df8-92b3-532f-bbf9-97a1a26abb05', '9c143933-3d71-5349-a3c6-74bb455ccda1', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بيجمنت سينجل 4H' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بيجمنت%سينجل%4H%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بيجمنت سينجل 4H', 1, 28500, 28500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'cd7c8df8-92b3-532f-bbf9-97a1a26abb05');

-- Order 98: جنا المصري
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '7fb1f6d1-5ad7-5133-a06c-2f68e5239ca5', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0098', '8b0e63b5-5bc9-53c8-825f-c0c975f25505', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 65000, 12000, 0, 65000, 77000, 77000, 'paid', 'cod', 'whatsapp', '{"governorate": "الفيوم", "city": "الفيوم", "address": "الفيوم الصيفية بجوار بنزينة بهنساوى", "phone": "+201011064889"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0098' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '3ff88228-5f83-5ad4-9447-46d875f7ce0a', '7fb1f6d1-5ad7-5133-a06c-2f68e5239ca5', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'فرشة فونديشن دابل جوت هير' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%فرشة%فونديشن%دابل%جوت%هير%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'فرشة فونديشن دابل جوت هير', 1, 65000, 65000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '3ff88228-5f83-5ad4-9447-46d875f7ce0a');

INSERT INTO payments (id, tenant_id, order_id, payment_number, method, amount, status, received_at, created_at)
SELECT '87ca8488-526a-5aa4-810e-7f732cc78440', 'a0000000-0000-0000-0000-000000000001', '7fb1f6d1-5ad7-5133-a06c-2f68e5239ca5', 'PAY-0098', 'cod', 77000, 'completed', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = '87ca8488-526a-5aa4-810e-7f732cc78440');

-- Order 99: نور عصام
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '9f1933e7-e185-5489-80a8-a42d3793148b', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0099', 'cdbc3b5a-c128-5efe-b4a8-5437a47a2b2d', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 27500, 8000, 0, 27500, 35500, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "الإسكندرية", "city": "العجمي", "address": "العجمي البيطاش آخر شارع الحي جوا شارع صيدليه النصر العماره القبل القهوه", "phone": "+201158151949"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0099' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '3622c4f6-6e6b-52bf-947b-bcf8af785d0e', '9f1933e7-e185-5489-80a8-a42d3793148b', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'باكت SRF12' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%باكت%SRF12%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'باكت SRF12', 1, 27500, 27500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '3622c4f6-6e6b-52bf-947b-bcf8af785d0e');

-- Order 100: رنين جميل
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT 'df832262-b9c7-5162-b23c-c42d6f8604e1', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0100', '7a11d127-e7f6-553c-951f-86c0c19216fa', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 75000, 10000, 0, 75000, 85000, 10000, 'partial', 'cod', 'whatsapp', '{"governorate": "دمياط", "city": "العنانية", "address": "دمياط العنانيه أمام المجلس المحلي", "phone": "+201099676830"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0100' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '9b14d853-9f21-5f57-9062-1de13d912f0d', 'df832262-b9c7-5162-b23c-c42d6f8604e1', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'فاونديشن HD001' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%فاونديشن%HD001%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'فاونديشن HD001', 1, 75000, 75000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '9b14d853-9f21-5f57-9062-1de13d912f0d');

INSERT INTO payments (id, tenant_id, order_id, payment_number, method, amount, status, received_at, created_at)
SELECT '8dc461c9-56d2-5cc8-9b98-b96b26d6418a', 'a0000000-0000-0000-0000-000000000001', 'df832262-b9c7-5162-b23c-c42d6f8604e1', 'PAY-0100', 'cod', 10000, 'completed', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = '8dc461c9-56d2-5cc8-9b98-b96b26d6418a');

-- Order 101: ولاء ضيف
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '8dc7d995-4194-5a39-aa28-02692a234048', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0101', 'e4e85de2-5f0e-52d2-aea9-57f22b53c015', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 272500, 8500, 0, 272500, 281000, 58500, 'partial', 'cod', 'whatsapp', '{"governorate": "الجيزة", "city": "الحوامدية", "address": "الحوامديه طريق 11 شارع ابوجبر العماره امام حمام السباحة اكوا ستار الدور الاول", "phone": "+201007727701"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0101' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'bd378a54-d97b-5fbe-aacb-14b10dd250fb', '8dc7d995-4194-5a39-aa28-02692a234048', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'باكت SRF02' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%باكت%SRF02%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'باكت SRF02', 3, 27500, 82500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'bd378a54-d97b-5fbe-aacb-14b10dd250fb');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'd00ac194-9fbb-5f55-9e69-62e32d5113bf', '8dc7d995-4194-5a39-aa28-02692a234048', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'باكت SRF08' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%باكت%SRF08%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'باكت SRF08', 3, 27500, 82500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'd00ac194-9fbb-5f55-9e69-62e32d5113bf');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '02ff36fa-1c5d-5e86-836e-0c03a94a4823', '8dc7d995-4194-5a39-aa28-02692a234048', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'باكت SRF10' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%باكت%SRF10%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'باكت SRF10', 3, 27500, 82500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '02ff36fa-1c5d-5e86-836e-0c03a94a4823');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '3f1a0f76-1974-5d9e-872f-21024363d2ec', '8dc7d995-4194-5a39-aa28-02692a234048', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'فرشة تنظيف حواجب جولد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%فرشة%تنظيف%حواجب%جولد%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'فرشة تنظيف حواجب جولد', 1, 25000, 25000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '3f1a0f76-1974-5d9e-872f-21024363d2ec');

INSERT INTO payments (id, tenant_id, order_id, payment_number, method, amount, status, received_at, created_at)
SELECT '99a9e974-b5dd-5669-82aa-cb4df8fbe3a9', 'a0000000-0000-0000-0000-000000000001', '8dc7d995-4194-5a39-aa28-02692a234048', 'PAY-0101', 'cod', 58500, 'completed', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = '99a9e974-b5dd-5669-82aa-cb4df8fbe3a9');

-- Order 102: اسماء احمد زكريا
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT 'b73c0170-d619-5acd-a6c3-925332aaf10d', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0102', '569dd3f7-7f68-5ba5-a7c5-6afe4dadebbe', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 27500, 0, 0, 27500, 27500, 27500, 'paid', 'cod', 'whatsapp', '{"governorate": "أسوان", "city": "أسوان", "address": "اسوان طريق السادات حي خالد بن الوليد", "phone": "+201149107755"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0102' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'ead9f6e5-099d-5bcb-9e8e-799bf7646a3f', 'b73c0170-d619-5acd-a6c3-925332aaf10d', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'جلو سوبر استرونج 5 مللي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%جلو%سوبر%استرونج%5%مللي%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'جلو سوبر استرونج 5 مللي', 1, 12500, 12500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'ead9f6e5-099d-5bcb-9e8e-799bf7646a3f');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '00e3a6c6-198a-5c41-bdc5-0a5c8ed3ce1b', 'b73c0170-d619-5acd-a6c3-925332aaf10d', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'قلم حواجب جيكوب JL1' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%قلم%حواجب%جيكوب%JL1%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'قلم حواجب جيكوب JL1', 1, 15000, 15000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '00e3a6c6-198a-5c41-bdc5-0a5c8ed3ce1b');

INSERT INTO payments (id, tenant_id, order_id, payment_number, method, amount, status, received_at, created_at)
SELECT '094a6691-f88e-542d-b4c9-4f0b2c0ad36a', 'a0000000-0000-0000-0000-000000000001', 'b73c0170-d619-5acd-a6c3-925332aaf10d', 'PAY-0102', 'cod', 27500, 'completed', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = '094a6691-f88e-542d-b4c9-4f0b2c0ad36a');

-- Order 103: مي السيد
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '97906d48-8349-585c-a9e8-5c1c66498989', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0103', 'b5f1abfd-8622-5d6d-b4c0-c8bac1d3532c', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 55000, 10000, 0, 55000, 65000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "بورسعيد", "city": "بورسعيد", "address": "بورسعيد حي الزهور منطقه ال500 عند مسجد البغدادي عماره 83 فوق صيدليه الصواف", "phone": "+201228422628"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0103' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'bb34a2b2-8916-5279-8c42-53a65b854c3f', '97906d48-8349-585c-a9e8-5c1c66498989', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'كومباكت باودر درجة 3' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%كومباكت%باودر%درجة%3%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'كومباكت باودر درجة 3', 1, 55000, 55000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'bb34a2b2-8916-5279-8c42-53a65b854c3f');

-- Order 104: فرح خالد
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '92e82d4a-e3c3-5d78-8732-7aed300ae8f2', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0104', 'c91e02b4-32a9-5db8-87f6-feafef8226ed', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 39000, 0, 0, 39000, 39000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "الجيزة", "city": "أرض اللواء", "address": "9 شارع فايز سليمان خلف التوحيد والنور ارض اللواء", "phone": "+201012041655"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0104' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '65717556-15ad-576f-8acf-11df858e4502', '92e82d4a-e3c3-5d78-8732-7aed300ae8f2', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'جلو سوبر استرونج 10 مللي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%جلو%سوبر%استرونج%10%مللي%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'جلو سوبر استرونج 10 مللي', 1, 25000, 25000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '65717556-15ad-576f-8acf-11df858e4502');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '7d5f964b-c0dd-5468-b6a4-70b712c90afc', '92e82d4a-e3c3-5d78-8732-7aed300ae8f2', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بيوتي بلندر داليا' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بيوتي%بلندر%داليا%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بيوتي بلندر داليا', 1, 14000, 14000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '7d5f964b-c0dd-5468-b6a4-70b712c90afc');

-- Order 105: ميار محمد ابراهيم
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '9e63f6ae-ae86-5eed-900c-8d23cec7d6f1', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0105', '69d0bc10-6345-526f-b63c-515ed9cd5016', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 85500, 8500, 0, 85500, 94000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "الجيزة", "city": "حدائق الأهرام", "address": "89ج بوابة أحمس حدائق الأهرام", "phone": "+201144475858"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0105' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'ed6bd56a-f406-5c29-a16c-b0690a4b02f9', '9e63f6ae-ae86-5eed-900c-8d23cec7d6f1', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بيجمنت سينجل 1H' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بيجمنت%سينجل%1H%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بيجمنت سينجل 1H', 1, 28500, 28500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'ed6bd56a-f406-5c29-a16c-b0690a4b02f9');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'a63232f7-6c24-54eb-adaa-470b2845c727', '9e63f6ae-ae86-5eed-900c-8d23cec7d6f1', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بيجمنت سينجل 4H' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بيجمنت%سينجل%4H%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بيجمنت سينجل 4H', 1, 28500, 28500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'a63232f7-6c24-54eb-adaa-470b2845c727');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '2b95b5a4-5f8c-538a-929f-5a3b87176f1a', '9e63f6ae-ae86-5eed-900c-8d23cec7d6f1', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بيجمنت سينجل 45H' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بيجمنت%سينجل%45H%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بيجمنت سينجل 45H', 1, 28500, 28500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '2b95b5a4-5f8c-538a-929f-5a3b87176f1a');

-- Order 106: علا سلامه محمد
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '4513269d-80fe-5857-85c3-000fd22e6398', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0106', '4bb55b1e-34d5-50fa-94fc-1a991512746c', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 90000, 10000, 0, 90000, 100000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "القليوبية", "city": "كفر شكر", "address": "كفر شكر كفر تصفا موقف العمومي سنتر علا سلامه", "phone": "+201224395220"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0106' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'f130e853-d264-545a-a999-bac79b39c66c', '4513269d-80fe-5857-85c3-000fd22e6398', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'جلو سوبر استرونج 10 مللي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%جلو%سوبر%استرونج%10%مللي%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'جلو سوبر استرونج 10 مللي', 2, 45000, 90000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'f130e853-d264-545a-a999-bac79b39c66c');

-- Order 107: زينه طارق
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '720b6de2-b8e6-5b06-8af2-fde6f159338e', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0107', '7848f427-5fec-5f8b-a38d-90076167c322', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 600000, 8500, 0, 600000, 608500, 100000, 'partial', 'cod', 'whatsapp', '{"governorate": "القاهرة", "city": "مدينة نصر", "address": "كمبوند جاردينيا سيتي زهراء مدينة نصر عمارة 62 شقة 53", "phone": "+201000494433"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0107' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '0df91b4e-18ee-5fe4-93c8-fa1513c5da8a', '720b6de2-b8e6-5b06-8af2-fde6f159338e', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'طقم جيكوب الأخضر' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%طقم%جيكوب%الأخضر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'طقم جيكوب الأخضر', 1, 600000, 600000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '0df91b4e-18ee-5fe4-93c8-fa1513c5da8a');

INSERT INTO payments (id, tenant_id, order_id, payment_number, method, amount, status, received_at, created_at)
SELECT '3e70c84e-9ee4-50b8-a250-f90fcf620564', 'a0000000-0000-0000-0000-000000000001', '720b6de2-b8e6-5b06-8af2-fde6f159338e', 'PAY-0107', 'cod', 100000, 'completed', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = '3e70c84e-9ee4-50b8-a250-f90fcf620564');

-- Order 108: Nour Hendawy
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT 'c1ee1da3-2549-5b77-9ba0-5aefb539b511', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0108', 'ee31187b-34cb-5a8f-95e4-408c69051bcf', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 205000, 8500, 0, 205000, 213500, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "القاهرة", "city": "مدينة نصر", "address": "7 ابن الهيثم متفرع من عباس العقاد الدور الثالث", "phone": "+201147090402"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0108' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '543e73bd-ded3-5a5f-9cf3-7ad2032ad8de', 'c1ee1da3-2549-5b77-9ba0-5aefb539b511', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'جلو سوبر استرونج 5 مللي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%جلو%سوبر%استرونج%5%مللي%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'جلو سوبر استرونج 5 مللي', 2, 12500, 25000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '543e73bd-ded3-5a5f-9cf3-7ad2032ad8de');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '4812d98f-b869-527c-b8da-d34468dfc967', 'c1ee1da3-2549-5b77-9ba0-5aefb539b511', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'جلو سوبر استرونج 10 مللي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%جلو%سوبر%استرونج%10%مللي%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'جلو سوبر استرونج 10 مللي', 4, 45000, 180000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '4812d98f-b869-527c-b8da-d34468dfc967');

-- Order 109: امال منير
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '5234b6e5-aa82-55ca-8cf4-dd569be34081', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0109', '35cf2d6f-f7f9-5819-97bb-8b71366ca86f', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 286000, 10000, 0, 286000, 296000, 10000, 'partial', 'cod', 'whatsapp', '{"governorate": "الدقهلية", "city": "شربين", "address": "شربين شارع المركز أمام مدرسة الصنايع برج طيبة الدور التاني", "phone": "+201012954929"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0109' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '3012ee07-c6c7-550f-8252-3f3264b5169b', '5234b6e5-aa82-55ca-8cf4-dd569be34081', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'جلو سوبر استرونج 5 مللي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%جلو%سوبر%استرونج%5%مللي%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'جلو سوبر استرونج 5 مللي', 2, 12500, 25000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '3012ee07-c6c7-550f-8252-3f3264b5169b');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '1d58ac24-472f-54b0-91db-2e09fc12a0c2', '5234b6e5-aa82-55ca-8cf4-dd569be34081', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'باكت SF10' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%باكت%SF10%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'باكت SF10', 1, 27500, 27500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '1d58ac24-472f-54b0-91db-2e09fc12a0c2');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '2e4c3c19-5793-5bb2-920c-33bc9dfd80bc', '5234b6e5-aa82-55ca-8cf4-dd569be34081', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'باكت 138' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%باكت%138%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'باكت 138', 1, 27500, 27500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '2e4c3c19-5793-5bb2-920c-33bc9dfd80bc');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '7af26eee-cd76-5c24-9c71-0e4f1c0c4375', '5234b6e5-aa82-55ca-8cf4-dd569be34081', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'باليت بينك' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%باليت%بينك%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'باليت بينك', 1, 180000, 180000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '7af26eee-cd76-5c24-9c71-0e4f1c0c4375');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'e366ad2b-8aec-5e64-a046-e6df175e8994', '5234b6e5-aa82-55ca-8cf4-dd569be34081', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بيوتي بلندر داليا' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بيوتي%بلندر%داليا%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بيوتي بلندر داليا', 1, 26000, 26000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'e366ad2b-8aec-5e64-a046-e6df175e8994');

INSERT INTO payments (id, tenant_id, order_id, payment_number, method, amount, status, received_at, created_at)
SELECT 'b7073bed-550c-54a2-9322-cc6a9e0e12f6', 'a0000000-0000-0000-0000-000000000001', '5234b6e5-aa82-55ca-8cf4-dd569be34081', 'PAY-0109', 'cod', 10000, 'completed', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = 'b7073bed-550c-54a2-9322-cc6a9e0e12f6');

-- Order 110: رنا
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '5bbc9161-cc3c-558b-8c72-34b8674b2f99', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0110', 'c74a9de2-f208-5e7d-8cb5-c41bfcf99d15', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 82500, 8500, 0, 82500, 91000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "الجيزة", "city": "6 أكتوبر", "address": "اكتوبر الحي الرابع مجاورة 6 عمارة 1131 شقة 6", "phone": "+201112334414"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0110' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '6bcafdfc-89bd-5c00-bc92-d7990a8bba8c', '5bbc9161-cc3c-558b-8c72-34b8674b2f99', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'فرشة طقم جيكوب — مقايضة' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%فرشة%طقم%جيكوب%—%مقايضة%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'فرشة طقم جيكوب — مقايضة', 16, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '6bcafdfc-89bd-5c00-bc92-d7990a8bba8c');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '960021a6-e56e-5748-ad83-6b4e35189867', '5bbc9161-cc3c-558b-8c72-34b8674b2f99', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'فرشة أمل وجيه — مقايضة' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%فرشة%أمل%وجيه%—%مقايضة%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'فرشة أمل وجيه — مقايضة', 1, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '960021a6-e56e-5748-ad83-6b4e35189867');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '7d35b5c9-6250-5f2a-b064-f5a39431bfd0', '5bbc9161-cc3c-558b-8c72-34b8674b2f99', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'فرشة بلاشر دابل بني' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%فرشة%بلاشر%دابل%بني%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'فرشة بلاشر دابل بني', 1, 35000, 35000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '7d35b5c9-6250-5f2a-b064-f5a39431bfd0');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'ee183934-bac0-5aa6-a4f2-d75b7aa951af', '5bbc9161-cc3c-558b-8c72-34b8674b2f99', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بلاشر باودر 014' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بلاشر%باودر%014%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بلاشر باودر 014', 1, 47500, 47500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'ee183934-bac0-5aa6-a4f2-d75b7aa951af');

-- Order 111: رنا سعيد
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT 'd83a3828-6e61-5335-8fca-af3c40710215', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0111', '624317c3-13ce-5127-9501-0ed9dc1aea16', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 27500, 10000, 0, 27500, 37500, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "الغربية", "city": "طنطا", "address": "طنطا سبرباي شارع السندبات عمارة معرض المها الدور التالت", "phone": "+201094664862"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0111' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '5ffa789c-b974-5527-99bc-9aa75e0ad67e', 'd83a3828-6e61-5335-8fca-af3c40710215', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'باكت SRF02' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%باكت%SRF02%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'باكت SRF02', 1, 27500, 27500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '5ffa789c-b974-5527-99bc-9aa75e0ad67e');

-- Order 112: رضوى شريف
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT 'e21a7621-74fc-513f-917a-5e7be237dc9c', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0112', '9b150f3e-9da5-5c99-849e-4b007d53bfff', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 52000, 10000, 0, 52000, 62000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "بورسعيد", "city": "بورسعيد", "address": "أرض العزب ورا قهوة بصلة جمب محمصة الحطاب استوديو رضوى شريف", "phone": "+201202168710"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0112' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'b4a152c0-7be4-5752-b079-496ce6c815ef', 'e21a7621-74fc-513f-917a-5e7be237dc9c', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بيوتي بلندر ليموني' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بيوتي%بلندر%ليموني%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بيوتي بلندر ليموني', 2, 26000, 52000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'b4a152c0-7be4-5752-b079-496ce6c815ef');

-- Order 113: ايه العبسي
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '5a5fbecf-8a27-5f7c-8ca9-58878d7812bb', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0113', '7eb51930-fd86-56e4-afb2-28bd45a2e677', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 165000, 10000, 0, 165000, 175000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "كفر الشيخ", "city": "دسوق", "address": "دسوق شارع المركز قدام المغربي", "phone": "+201012828587"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0113' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'c14891c8-630c-5d8d-aa02-9f62197dcfa6', '5a5fbecf-8a27-5f7c-8ca9-58878d7812bb', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'كحل أخضر' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%كحل%أخضر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'كحل أخضر', 1, 45000, 45000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'c14891c8-630c-5d8d-aa02-9f62197dcfa6');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '0565ace6-d54f-5ce6-b7ec-eacbc3c32422', '5a5fbecf-8a27-5f7c-8ca9-58878d7812bb', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'كحل أسود' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%كحل%أسود%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'كحل أسود', 1, 45000, 45000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '0565ace6-d54f-5ce6-b7ec-eacbc3c32422');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '159ca1a6-7977-5137-ad34-b85007e55960', '5a5fbecf-8a27-5f7c-8ca9-58878d7812bb', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'كحل لايت براون' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%كحل%لايت%براون%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'كحل لايت براون', 1, 45000, 45000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '159ca1a6-7977-5137-ad34-b85007e55960');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '4b1fdb06-5c2c-5640-b8bf-d39e048e9f1f', '5a5fbecf-8a27-5f7c-8ca9-58878d7812bb', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'قلم حواجب جيكوب JL3' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%قلم%حواجب%جيكوب%JL3%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'قلم حواجب جيكوب JL3', 1, 30000, 30000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '4b1fdb06-5c2c-5640-b8bf-d39e048e9f1f');

-- Order 114: منة خلاف
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '86ae1f08-4751-57c6-aa50-321c4c8d45cd', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0114', '5b26dab5-3f19-53d8-b19b-72a0a8fdf140', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 90000, 10000, 0, 90000, 100000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "الغربية", "city": "كفر الزيات", "address": "كفر الزيات شارع عرابي عند الوكايل العمارة اللي جمب قهوة الفحات", "phone": "+201026623278"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0114' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'e824f4e4-c294-5945-b94f-f428906ca170', '86ae1f08-4751-57c6-aa50-321c4c8d45cd', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'جلو سوبر استرونج 10 مللي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%جلو%سوبر%استرونج%10%مللي%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'جلو سوبر استرونج 10 مللي', 2, 45000, 90000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'e824f4e4-c294-5945-b94f-f428906ca170');

-- Order 115: زينب غريب
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT '91ed658c-1917-58a8-b074-0481b7d055eb', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0115', '3b0e0b4b-766d-5478-9ac5-86dde423d21b', 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 45000, 10000, 0, 45000, 55000, 10000, 'partial', 'cod', 'whatsapp', '{"governorate": "السويس", "city": "السويس", "address": "الألبان شارع الورش عند سوبر ماركت الأمراء", "phone": "+201092740724"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0115' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '6aa83233-b209-5305-aaa7-dd7e7cad2d54', '91ed658c-1917-58a8-b074-0481b7d055eb', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'فرشة أمل وجيه' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%فرشة%أمل%وجيه%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'فرشة أمل وجيه', 1, 45000, 45000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '6aa83233-b209-5305-aaa7-dd7e7cad2d54');

INSERT INTO payments (id, tenant_id, order_id, payment_number, method, amount, status, received_at, created_at)
SELECT 'b7476753-faa9-5479-a106-49c9298a7c2b', 'a0000000-0000-0000-0000-000000000001', '91ed658c-1917-58a8-b074-0481b7d055eb', 'PAY-0115', 'cod', 10000, 'completed', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = 'b7476753-faa9-5479-a106-49c9298a7c2b');

-- Order 116: سندس عباس
INSERT INTO sales_orders (id, tenant_id, order_number, customer_id, status, order_type, channel, warehouse_id, subtotal, shipping_amount, tax_amount, total, grand_total, paid_amount, payment_status, payment_method, source, shipping_address, notes, ordered_at, created_at)
SELECT 'c67b5a89-3bd8-5c43-b2ad-d52980c60558', 'a0000000-0000-0000-0000-000000000001', 'ORD-20260611-0116', (SELECT id FROM customers WHERE name = 'سندس عباس' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), 'confirmed', 'retail', 'whatsapp', '20000000-0000-0000-0000-000000000001', 204500, 8500, 0, 204500, 213000, 0, 'unpaid', 'cod', 'whatsapp', '{"governorate": "القاهرة", "city": "التجمع الأول", "address": "التجمع الأول شارع أبو موسى الأشعري أمام سنترال التجمع الأول فيلا 11 الدور 3", "phone": "+201119433463"}', 'Imported from Excel v2', '2026-06-11', '2026-06-11'
WHERE NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'ORD-20260611-0116' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'a4fcdb17-00c6-5ef8-9bd9-0352d2b14bda', 'c67b5a89-3bd8-5c43-b2ad-d52980c60558', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بيجمنت سينجل 4H' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بيجمنت%سينجل%4H%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بيجمنت سينجل 4H', 1, 35000, 35000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'a4fcdb17-00c6-5ef8-9bd9-0352d2b14bda');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '25c7df28-e867-5469-a08c-61cd6bd6dc06', 'c67b5a89-3bd8-5c43-b2ad-d52980c60558', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'بيوتي بلندر جيكوب مثلثة' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%بيوتي%بلندر%جيكوب%مثلثة%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'بيوتي بلندر جيكوب مثلثة', 2, 26000, 52000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '25c7df28-e867-5469-a08c-61cd6bd6dc06');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '2ac8f55a-0ab2-5f6e-975e-e47e3b25e5d3', 'c67b5a89-3bd8-5c43-b2ad-d52980c60558', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'كحل دارك براون' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%كحل%دارك%براون%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'كحل دارك براون', 1, 45000, 45000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '2ac8f55a-0ab2-5f6e-975e-e47e3b25e5d3');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT '741a8391-df2e-5193-a4c7-16733139b229', 'c67b5a89-3bd8-5c43-b2ad-d52980c60558', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'سيت باف جيكوب' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%سيت%باف%جيكوب%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'سيت باف جيكوب', 1, 45000, 45000, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = '741a8391-df2e-5193-a4c7-16733139b229');

INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, total, cost_price)
SELECT 'ed0a655a-0f47-5829-a67e-eb4ac5e74c7a', 'c67b5a89-3bd8-5c43-b2ad-d52980c60558', COALESCE((SELECT id FROM catalog.products WHERE name_ar = 'باكت SRF05' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE name ILIKE '%باكت%SRF05%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1), (SELECT id FROM catalog.products WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1)), 'IMPORT', 'باكت SRF05', 1, 27500, 27500, 0
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'ed0a655a-0f47-5829-a67e-eb4ac5e74c7a');

-- ============================================
-- 3. UPDATE CUSTOMER STATS
-- ============================================

UPDATE customers c SET
  total_orders = sub.cnt,
  total_spent = sub.spent
FROM (
  SELECT customer_id, COUNT(*) as cnt, SUM(grand_total) as spent
  FROM sales_orders WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'
  GROUP BY customer_id
) sub
WHERE c.id = sub.customer_id AND c.tenant_id = 'a0000000-0000-0000-0000-000000000001';
