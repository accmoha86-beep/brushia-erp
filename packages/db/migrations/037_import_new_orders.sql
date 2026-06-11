-- Migration 037: Import new orders (96-116) from June 2026 Excel

-- ============================================
-- 1. NEW CUSTOMERS
-- ============================================
SET search_path = sales, public;

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'رحمه حسن محمد', 'رحمه حسن محمد', '', '01030581694', 'القليوبية', 'العبور', 'مدينه العبور الحي التاسع شارع امين الهنيدي بلوك 52 عماره 8 الدور الثاني شقه 24'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رحمه حسن محمد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'هاجر النجار', 'هاجر النجار', '', '01020520370', 'كفر الشيخ', 'الرياض', 'كفر الشيخ الرياض بجوار بنك مصر برج جنات'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'هاجر النجار' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'جنا المصري', 'جنا المصري', '', '01011064889', 'الفيوم', 'الفيوم', 'الفيوم الصيفية بجوار بنزينة بهنساوى'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'جنا المصري' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'نور عصام', 'نور عصام', '', '01158151949', 'الإسكندرية', 'العجمي', 'العجمي البيطاش آخر شارع الحي جوا شارع صيدليه النصر العماره القبل القهوه'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'نور عصام' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'رنين جميل', 'رنين جميل', '', '01099676830', 'دمياط', 'العنانية', 'دمياط العنانيه أمام المجلس المحلي'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رنين جميل' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'ولاء ضيف', 'ولاء ضيف', '', '01007727701', 'الجيزة', 'الحوامدية', 'الحوامديه طريق 11 شارع ابوجبر العماره امام حمام السباحة اكوا ستار الدور الاول'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'ولاء ضيف' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'اسماء احمد زكريا', 'اسماء احمد زكريا', '', '01149107755', 'أسوان', 'أسوان', 'اسوان طريق السادات حي خالد بن الوليد'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'اسماء احمد زكريا' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'مي السيد', 'مي السيد', '', '01228422628', 'بورسعيد', 'بورسعيد', 'بورسعيد حي الزهور منطقه ال500 عند مسجد البغدادي عماره 83 فوق صيدليه الصواف'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'مي السيد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'فرح خالد', 'فرح خالد', '', '01012041655', 'الجيزة', 'أرض اللواء', '9 شارع فايز سليمان خلف التوحيد والنور ارض اللواء'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'فرح خالد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'ميار محمد ابراهيم', 'ميار محمد ابراهيم', '', '01144475858', 'الجيزة', 'حدائق الأهرام', '89ج بوابة أحمس حدائق الأهرام'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'ميار محمد ابراهيم' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'علا سلامه محمد', 'علا سلامه محمد', '', '01224395220', 'القليوبية', 'كفر شكر', 'كفر شكر كفر تصفا موقف العمومي سنتر علا سلامه'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'علا سلامه محمد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'زينه طارق', 'زينه طارق', '', '01000494433', 'القاهرة', 'مدينة نصر', 'كمبوند جاردينيا سيتي زهراء مدينة نصر عمارة 62 شقة 53'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'زينه طارق' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'Nour Hendawy', 'Nour Hendawy', '', '01147090402', 'القاهرة', 'مدينة نصر', '7 ابن الهيثم متفرع من عباس العقاد الدور الثالث'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Nour Hendawy' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'امال منير', 'امال منير', '', '01012954929', 'الدقهلية', 'شربين', 'شربين شارع المركز أمام مدرسة الصنايع برج طيبة الدور التاني'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'امال منير' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'رنا', 'رنا', '', '01112334414', 'الجيزة', '6 أكتوبر', 'اكتوبر الحي الرابع مجاورة 6 عمارة 1131 شقة 6'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رنا' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'رنا سعيد', 'رنا سعيد', '', '01094664862', 'الغربية', 'طنطا', 'طنطا سبرباي شارع السندبات عمارة معرض المها الدور التالت'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رنا سعيد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'رضوى شريف', 'رضوى شريف', '', '01202168710', 'بورسعيد', 'بورسعيد', 'أرض العزب ورا قهوة بصلة جمب محمصة الحطاب استوديو رضوى شريف'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'رضوى شريف' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'ايه العبسي', 'ايه العبسي', '', '01012828587', 'كفر الشيخ', 'دسوق', 'دسوق شارع المركز قدام المغربي'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'ايه العبسي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'منة خلاف', 'منة خلاف', '', '01026623278', 'الغربية', 'كفر الزيات', 'كفر الزيات شارع عرابي عند الوكايل العمارة اللي جمب قهوة الفحات'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'منة خلاف' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'زينب غريب', 'زينب غريب', '', '01092740724', 'السويس', 'السويس', 'الألبان شارع الورش عند سوبر ماركت الأمراء'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'زينب غريب' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO customers (id, tenant_id, name, first_name, last_name, phone, governorate, city, address)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'سندس عباس', 'سندس عباس', '', '01119433463', 'القاهرة', 'التجمع الأول', 'التجمع الأول شارع أبو موسى الأشعري أمام سنترال التجمع الأول فيلا 11 الدور 3'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'سندس عباس' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');


-- ============================================
-- 2. NEW ORDERS
-- ============================================

-- Order #96: رحمه حسن محمد
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'رحمه حسن محمد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00096' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00096', 
    'confirmed', 'partial',
    35000, 8500, 43500, 8500, 'cash',
    '{"street": "مدينه العبور الحي التاسع شارع امين الهنيدي بلوك 52 عماره 8 الدور الثاني شقه 24", "city": "العبور", "governorate": "القليوبية"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'فرشة دابل ليكويد وباودر'), COALESCE(p.name_ar, 'فرشة دابل ليكويد وباودر'), COALESCE(p.sku, 'MISC'), 
    1, 35000, 35000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'فرشة دابل ليكويد وباودر' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.payments (id, tenant_id, order_id, payment_number, amount, method, status, created_at)
  VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 'PAY-00096', 8500, 'cash', 'completed', '2026-06-11'::timestamp);

END $$;

-- Order #97: هاجر النجار
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'هاجر النجار' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00097' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00097', 
    'confirmed', 'unpaid',
    199000, 10000, 209000, 0, 'cash',
    '{"street": "كفر الشيخ الرياض بجوار بنك مصر برج جنات", "city": "الرياض", "governorate": "كفر الشيخ"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'كومباكت باودر بينك'), COALESCE(p.name_ar, 'كومباكت باودر بينك'), COALESCE(p.sku, 'MISC'), 
    1, 58000, 58000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'كومباكت باودر بينك' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'بلاشر 014'), COALESCE(p.name_ar, 'بلاشر 014'), COALESCE(p.sku, 'MISC'), 
    1, 47500, 47500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بلاشر 014' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 3, p.id, 
    COALESCE(p.name, 'فرشة فونديشن دابل جوت هير'), COALESCE(p.name_ar, 'فرشة فونديشن دابل جوت هير'), COALESCE(p.sku, 'MISC'), 
    1, 65000, 65000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'فرشة فونديشن دابل جوت هير' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 4, p.id, 
    COALESCE(p.name, 'بيجمنت سينجل 4H'), COALESCE(p.name_ar, 'بيجمنت سينجل 4H'), COALESCE(p.sku, 'MISC'), 
    1, 28500, 28500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بيجمنت سينجل 4H' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #98: جنا المصري
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'جنا المصري' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00098' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00098', 
    'confirmed', 'paid',
    65000, 12000, 77000, 77000, 'cash',
    '{"street": "الفيوم الصيفية بجوار بنزينة بهنساوى", "city": "الفيوم", "governorate": "الفيوم"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'فرشة فونديشن دابل جوت هير'), COALESCE(p.name_ar, 'فرشة فونديشن دابل جوت هير'), COALESCE(p.sku, 'MISC'), 
    1, 65000, 65000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'فرشة فونديشن دابل جوت هير' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.payments (id, tenant_id, order_id, payment_number, amount, method, status, created_at)
  VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 'PAY-00098', 77000, 'cash', 'completed', '2026-06-11'::timestamp);

END $$;

-- Order #99: نور عصام
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'نور عصام' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00099' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00099', 
    'confirmed', 'unpaid',
    27500, 8000, 35500, 0, 'cash',
    '{"street": "العجمي البيطاش آخر شارع الحي جوا شارع صيدليه النصر العماره القبل القهوه", "city": "العجمي", "governorate": "الإسكندرية"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'باكت SRF12'), COALESCE(p.name_ar, 'باكت SRF12'), COALESCE(p.sku, 'MISC'), 
    1, 27500, 27500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'باكت SRF12' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #100: رنين جميل
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'رنين جميل' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00100' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00100', 
    'confirmed', 'partial',
    75000, 10000, 85000, 10000, 'cash',
    '{"street": "دمياط العنانيه أمام المجلس المحلي", "city": "العنانية", "governorate": "دمياط"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'فاونديشن HD001'), COALESCE(p.name_ar, 'فاونديشن HD001'), COALESCE(p.sku, 'MISC'), 
    1, 75000, 75000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'فاونديشن HD001' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.payments (id, tenant_id, order_id, payment_number, amount, method, status, created_at)
  VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 'PAY-00100', 10000, 'cash', 'completed', '2026-06-11'::timestamp);

END $$;

-- Order #101: ولاء ضيف
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'ولاء ضيف' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00101' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00101', 
    'confirmed', 'partial',
    272500, 8500, 281000, 58500, 'cash',
    '{"street": "الحوامديه طريق 11 شارع ابوجبر العماره امام حمام السباحة اكوا ستار الدور الاول", "city": "الحوامدية", "governorate": "الجيزة"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'باكت SRF02'), COALESCE(p.name_ar, 'باكت SRF02'), COALESCE(p.sku, 'MISC'), 
    3, 27500, 82500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'باكت SRF02' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'باكت SRF08'), COALESCE(p.name_ar, 'باكت SRF08'), COALESCE(p.sku, 'MISC'), 
    3, 27500, 82500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'باكت SRF08' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 3, p.id, 
    COALESCE(p.name, 'باكت SRF10'), COALESCE(p.name_ar, 'باكت SRF10'), COALESCE(p.sku, 'MISC'), 
    3, 27500, 82500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'باكت SRF10' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 4, p.id, 
    COALESCE(p.name, 'فرشة تنظيف حواجب جولد'), COALESCE(p.name_ar, 'فرشة تنظيف حواجب جولد'), COALESCE(p.sku, 'MISC'), 
    1, 25000, 25000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'فرشة تنظيف حواجب جولد' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.payments (id, tenant_id, order_id, payment_number, amount, method, status, created_at)
  VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 'PAY-00101', 58500, 'cash', 'completed', '2026-06-11'::timestamp);

END $$;

-- Order #102: اسماء احمد زكريا
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'اسماء احمد زكريا' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00102' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00102', 
    'confirmed', 'paid',
    27500, 0, 27500, 27500, 'cash',
    '{"street": "اسوان طريق السادات حي خالد بن الوليد", "city": "أسوان", "governorate": "أسوان"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'جلو سوبر استرونج 5 مللي'), COALESCE(p.name_ar, 'جلو سوبر استرونج 5 مللي'), COALESCE(p.sku, 'MISC'), 
    1, 12500, 12500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'جلو سوبر استرونج 5 مللي' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'قلم حواجب جيكوب JL1'), COALESCE(p.name_ar, 'قلم حواجب جيكوب JL1'), COALESCE(p.sku, 'MISC'), 
    1, 15000, 15000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'قلم حواجب جيكوب JL1' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.payments (id, tenant_id, order_id, payment_number, amount, method, status, created_at)
  VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 'PAY-00102', 27500, 'cash', 'completed', '2026-06-11'::timestamp);

END $$;

-- Order #103: مي السيد
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'مي السيد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00103' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00103', 
    'confirmed', 'unpaid',
    55000, 10000, 65000, 0, 'cash',
    '{"street": "بورسعيد حي الزهور منطقه ال500 عند مسجد البغدادي عماره 83 فوق صيدليه الصواف", "city": "بورسعيد", "governorate": "بورسعيد"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'كومباكت باودر درجة 3'), COALESCE(p.name_ar, 'كومباكت باودر درجة 3'), COALESCE(p.sku, 'MISC'), 
    1, 55000, 55000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'كومباكت باودر درجة 3' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #104: فرح خالد
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'فرح خالد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00104' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00104', 
    'confirmed', 'unpaid',
    39000, 0, 39000, 0, 'cash',
    '{"street": "9 شارع فايز سليمان خلف التوحيد والنور ارض اللواء", "city": "أرض اللواء", "governorate": "الجيزة"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'جلو سوبر استرونج 10 مللي'), COALESCE(p.name_ar, 'جلو سوبر استرونج 10 مللي'), COALESCE(p.sku, 'MISC'), 
    1, 25000, 25000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'جلو سوبر استرونج 10 مللي' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'بيوتي بلندر داليا'), COALESCE(p.name_ar, 'بيوتي بلندر داليا'), COALESCE(p.sku, 'MISC'), 
    1, 14000, 14000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بيوتي بلندر داليا' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #105: ميار محمد ابراهيم
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'ميار محمد ابراهيم' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00105' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00105', 
    'confirmed', 'unpaid',
    85500, 8500, 94000, 0, 'cash',
    '{"street": "89ج بوابة أحمس حدائق الأهرام", "city": "حدائق الأهرام", "governorate": "الجيزة"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'بيجمنت سينجل 1H'), COALESCE(p.name_ar, 'بيجمنت سينجل 1H'), COALESCE(p.sku, 'MISC'), 
    1, 28500, 28500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بيجمنت سينجل 1H' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'بيجمنت سينجل 4H'), COALESCE(p.name_ar, 'بيجمنت سينجل 4H'), COALESCE(p.sku, 'MISC'), 
    1, 28500, 28500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بيجمنت سينجل 4H' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 3, p.id, 
    COALESCE(p.name, 'بيجمنت سينجل 45H'), COALESCE(p.name_ar, 'بيجمنت سينجل 45H'), COALESCE(p.sku, 'MISC'), 
    1, 28500, 28500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بيجمنت سينجل 45H' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #106: علا سلامه محمد
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'علا سلامه محمد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00106' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00106', 
    'confirmed', 'unpaid',
    90000, 10000, 100000, 0, 'cash',
    '{"street": "كفر شكر كفر تصفا موقف العمومي سنتر علا سلامه", "city": "كفر شكر", "governorate": "القليوبية"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'جلو سوبر استرونج 10 مللي'), COALESCE(p.name_ar, 'جلو سوبر استرونج 10 مللي'), COALESCE(p.sku, 'MISC'), 
    2, 45000, 90000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'جلو سوبر استرونج 10 مللي' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #107: زينه طارق
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'زينه طارق' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00107' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00107', 
    'confirmed', 'partial',
    600000, 8500, 608500, 100000, 'cash',
    '{"street": "كمبوند جاردينيا سيتي زهراء مدينة نصر عمارة 62 شقة 53", "city": "مدينة نصر", "governorate": "القاهرة"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'طقم جيكوب الأخضر'), COALESCE(p.name_ar, 'طقم جيكوب الأخضر'), COALESCE(p.sku, 'MISC'), 
    1, 600000, 600000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'طقم جيكوب الأخضر' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.payments (id, tenant_id, order_id, payment_number, amount, method, status, created_at)
  VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 'PAY-00107', 100000, 'cash', 'completed', '2026-06-11'::timestamp);

END $$;

-- Order #108: Nour Hendawy
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'Nour Hendawy' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00108' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00108', 
    'confirmed', 'unpaid',
    205000, 8500, 213500, 0, 'cash',
    '{"street": "7 ابن الهيثم متفرع من عباس العقاد الدور الثالث", "city": "مدينة نصر", "governorate": "القاهرة"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'جلو سوبر استرونج 5 مللي'), COALESCE(p.name_ar, 'جلو سوبر استرونج 5 مللي'), COALESCE(p.sku, 'MISC'), 
    2, 12500, 25000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'جلو سوبر استرونج 5 مللي' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'جلو سوبر استرونج 10 مللي'), COALESCE(p.name_ar, 'جلو سوبر استرونج 10 مللي'), COALESCE(p.sku, 'MISC'), 
    4, 45000, 180000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'جلو سوبر استرونج 10 مللي' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #109: امال منير
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'امال منير' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00109' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00109', 
    'confirmed', 'partial',
    286000, 10000, 296000, 10000, 'cash',
    '{"street": "شربين شارع المركز أمام مدرسة الصنايع برج طيبة الدور التاني", "city": "شربين", "governorate": "الدقهلية"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'جلو سوبر استرونج 5 مللي'), COALESCE(p.name_ar, 'جلو سوبر استرونج 5 مللي'), COALESCE(p.sku, 'MISC'), 
    2, 12500, 25000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'جلو سوبر استرونج 5 مللي' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'باكت SF10'), COALESCE(p.name_ar, 'باكت SF10'), COALESCE(p.sku, 'MISC'), 
    1, 27500, 27500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'باكت SF10' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 3, p.id, 
    COALESCE(p.name, 'باكت 138'), COALESCE(p.name_ar, 'باكت 138'), COALESCE(p.sku, 'MISC'), 
    1, 27500, 27500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'باكت 138' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 4, p.id, 
    COALESCE(p.name, 'باليت بينك'), COALESCE(p.name_ar, 'باليت بينك'), COALESCE(p.sku, 'MISC'), 
    1, 180000, 180000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'باليت بينك' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 5, p.id, 
    COALESCE(p.name, 'بيوتي بلندر داليا'), COALESCE(p.name_ar, 'بيوتي بلندر داليا'), COALESCE(p.sku, 'MISC'), 
    1, 26000, 26000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بيوتي بلندر داليا' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.payments (id, tenant_id, order_id, payment_number, amount, method, status, created_at)
  VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 'PAY-00109', 10000, 'cash', 'completed', '2026-06-11'::timestamp);

END $$;

-- Order #110: رنا
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'رنا' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00110' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00110', 
    'confirmed', 'unpaid',
    82500, 8500, 91000, 0, 'cash',
    '{"street": "اكتوبر الحي الرابع مجاورة 6 عمارة 1131 شقة 6", "city": "6 أكتوبر", "governorate": "الجيزة"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'فرشة طقم جيكوب — مقايضة'), COALESCE(p.name_ar, 'فرشة طقم جيكوب — مقايضة'), COALESCE(p.sku, 'MISC'), 
    16, 0, 0, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'فرشة طقم جيكوب — مقايضة' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'فرشة أمل وجيه — مقايضة'), COALESCE(p.name_ar, 'فرشة أمل وجيه — مقايضة'), COALESCE(p.sku, 'MISC'), 
    1, 0, 0, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'فرشة أمل وجيه — مقايضة' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 3, p.id, 
    COALESCE(p.name, 'فرشة بلاشر دابل بني'), COALESCE(p.name_ar, 'فرشة بلاشر دابل بني'), COALESCE(p.sku, 'MISC'), 
    1, 35000, 35000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'فرشة بلاشر دابل بني' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 4, p.id, 
    COALESCE(p.name, 'بلاشر باودر 014'), COALESCE(p.name_ar, 'بلاشر باودر 014'), COALESCE(p.sku, 'MISC'), 
    1, 47500, 47500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بلاشر باودر 014' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #111: رنا سعيد
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'رنا سعيد' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00111' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00111', 
    'confirmed', 'unpaid',
    27500, 10000, 37500, 0, 'cash',
    '{"street": "طنطا سبرباي شارع السندبات عمارة معرض المها الدور التالت", "city": "طنطا", "governorate": "الغربية"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'باكت SRF02'), COALESCE(p.name_ar, 'باكت SRF02'), COALESCE(p.sku, 'MISC'), 
    1, 27500, 27500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'باكت SRF02' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #112: رضوى شريف
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'رضوى شريف' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00112' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00112', 
    'confirmed', 'unpaid',
    52000, 10000, 62000, 0, 'cash',
    '{"street": "أرض العزب ورا قهوة بصلة جمب محمصة الحطاب استوديو رضوى شريف", "city": "بورسعيد", "governorate": "بورسعيد"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'بيوتي بلندر ليموني'), COALESCE(p.name_ar, 'بيوتي بلندر ليموني'), COALESCE(p.sku, 'MISC'), 
    2, 26000, 52000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بيوتي بلندر ليموني' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #113: ايه العبسي
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'ايه العبسي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00113' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00113', 
    'confirmed', 'unpaid',
    165000, 10000, 175000, 0, 'cash',
    '{"street": "دسوق شارع المركز قدام المغربي", "city": "دسوق", "governorate": "كفر الشيخ"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'كحل أخضر'), COALESCE(p.name_ar, 'كحل أخضر'), COALESCE(p.sku, 'MISC'), 
    1, 45000, 45000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'كحل أخضر' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'كحل أسود'), COALESCE(p.name_ar, 'كحل أسود'), COALESCE(p.sku, 'MISC'), 
    1, 45000, 45000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'كحل أسود' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 3, p.id, 
    COALESCE(p.name, 'كحل لايت براون'), COALESCE(p.name_ar, 'كحل لايت براون'), COALESCE(p.sku, 'MISC'), 
    1, 45000, 45000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'كحل لايت براون' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 4, p.id, 
    COALESCE(p.name, 'قلم حواجب جيكوب JL3'), COALESCE(p.name_ar, 'قلم حواجب جيكوب JL3'), COALESCE(p.sku, 'MISC'), 
    1, 30000, 30000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'قلم حواجب جيكوب JL3' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #114: منة خلاف
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'منة خلاف' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00114' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00114', 
    'confirmed', 'unpaid',
    90000, 10000, 100000, 0, 'cash',
    '{"street": "كفر الزيات شارع عرابي عند الوكايل العمارة اللي جمب قهوة الفحات", "city": "كفر الزيات", "governorate": "الغربية"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'جلو سوبر استرونج 10 مللي'), COALESCE(p.name_ar, 'جلو سوبر استرونج 10 مللي'), COALESCE(p.sku, 'MISC'), 
    2, 45000, 90000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'جلو سوبر استرونج 10 مللي' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;

-- Order #115: زينب غريب
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'زينب غريب' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00115' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00115', 
    'confirmed', 'partial',
    45000, 10000, 55000, 10000, 'cash',
    '{"street": "الألبان شارع الورش عند سوبر ماركت الأمراء", "city": "السويس", "governorate": "السويس"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'فرشة أمل وجيه'), COALESCE(p.name_ar, 'فرشة أمل وجيه'), COALESCE(p.sku, 'MISC'), 
    1, 45000, 45000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'فرشة أمل وجيه' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.payments (id, tenant_id, order_id, payment_number, amount, method, status, created_at)
  VALUES (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 'PAY-00115', 10000, 'cash', 'completed', '2026-06-11'::timestamp);

END $$;

-- Order #116: سندس عباس
DO $$ 
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM sales.customers 
  WHERE name = 'سندس عباس' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;
  
  -- Skip if order already exists
  IF EXISTS (SELECT 1 FROM sales.sales_orders WHERE order_number = 'ORD-00116' AND tenant_id = 'a0000000-0000-0000-0000-000000000001') THEN
    RETURN;
  END IF;
  
  v_order_id := gen_random_uuid();
  
  INSERT INTO sales.sales_orders (id, tenant_id, customer_id, order_number, status, payment_status, 
    total, shipping_fee, grand_total, paid_amount, payment_method,
    shipping_address, created_at)
  VALUES (v_order_id, 'a0000000-0000-0000-0000-000000000001', v_customer_id, 'ORD-00116', 
    'confirmed', 'unpaid',
    204500, 8500, 213000, 0, 'cash',
    '{"street": "التجمع الأول شارع أبو موسى الأشعري أمام سنترال التجمع الأول فيلا 11 الدور 3", "city": "التجمع الأول", "governorate": "القاهرة"}'::jsonb,
    '2026-06-11'::timestamp);

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 1, p.id, 
    COALESCE(p.name, 'بيجمنت سينجل 4H'), COALESCE(p.name_ar, 'بيجمنت سينجل 4H'), COALESCE(p.sku, 'MISC'), 
    1, 35000, 35000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بيجمنت سينجل 4H' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 2, p.id, 
    COALESCE(p.name, 'بيوتي بلندر جيكوب مثلثة'), COALESCE(p.name_ar, 'بيوتي بلندر جيكوب مثلثة'), COALESCE(p.sku, 'MISC'), 
    2, 26000, 52000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'بيوتي بلندر جيكوب مثلثة' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 3, p.id, 
    COALESCE(p.name, 'كحل دارك براون'), COALESCE(p.name_ar, 'كحل دارك براون'), COALESCE(p.sku, 'MISC'), 
    1, 45000, 45000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'كحل دارك براون' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 4, p.id, 
    COALESCE(p.name, 'سيت باف جيكوب'), COALESCE(p.name_ar, 'سيت باف جيكوب'), COALESCE(p.sku, 'MISC'), 
    1, 45000, 45000, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'سيت باف جيكوب' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

  INSERT INTO sales.order_items (id, tenant_id, order_id, line_number, product_id, name, name_ar, sku, qty, unit_price, total, cost_price)
  SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', v_order_id, 5, p.id, 
    COALESCE(p.name, 'باكت SRF05'), COALESCE(p.name_ar, 'باكت SRF05'), COALESCE(p.sku, 'MISC'), 
    1, 27500, 27500, COALESCE(p.cost_price, 0)
  FROM catalog.products p WHERE p.name_ar = 'باكت SRF05' AND p.tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;

END $$;
