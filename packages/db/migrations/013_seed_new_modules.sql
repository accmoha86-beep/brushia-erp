-- Migration 013: Seed data for new modules
DO $$ 
DECLARE 
  t_id UUID; 
  u_id UUID; 
BEGIN
  SELECT id INTO t_id FROM iam.tenants WHERE slug = 'brushia' LIMIT 1;
  SELECT id INTO u_id FROM iam.users WHERE tenant_id = t_id LIMIT 1;
  
  IF t_id IS NOT NULL THEN
    -- Seed salespersons
    INSERT INTO hr.salespersons (tenant_id, user_id, employee_code, first_name, last_name, phone, email, default_commission_rate, total_sales, total_commission) VALUES
    (t_id, u_id, 'SP-001', 'Nadia', 'Hassan', '+201012345678', 'nadia@brushia.net', 5.00, 4520000, 226000),
    (t_id, NULL, 'SP-002', 'Amira', 'Salem', '+201098765432', 'amira@brushia.net', 7.00, 3280000, 229600),
    (t_id, NULL, 'SP-003', 'Rana', 'Mahmoud', '+201155667788', 'rana@brushia.net', 5.00, 2150000, 107500),
    (t_id, NULL, 'SP-004', 'Dalia', 'Kamal', '+201233445566', 'dalia@brushia.net', 6.00, 1890000, 113400)
    ON CONFLICT DO NOTHING;

    -- Seed commission rules
    INSERT INTO hr.commission_rules (tenant_id, name, rule_type, rate, is_active) VALUES
    (t_id, 'Standard Rate', 'flat', 5.00, true),
    (t_id, 'Senior Rate', 'flat', 7.00, true),
    (t_id, 'Tiered Performance', 'tiered', NULL, true)
    ON CONFLICT DO NOTHING;

    -- Seed loyalty tiers
    INSERT INTO crm.loyalty_tiers (tenant_id, name, min_points, multiplier, benefits, color) VALUES
    (t_id, 'Bronze', 0, 1.00, 'Basic rewards, birthday discount', '#CD7F32'),
    (t_id, 'Silver', 500, 1.25, 'All Bronze + free shipping, 5% extra discount', '#C0C0C0'),
    (t_id, 'Gold', 1500, 1.50, 'All Silver + early access, 10% extra discount', '#FFD700'),
    (t_id, 'Platinum', 3000, 2.00, 'All Gold + VIP events, 15% extra discount, personal stylist', '#E5E4E2')
    ON CONFLICT DO NOTHING;

    -- Seed exhibition events
    INSERT INTO exhibitions.events (tenant_id, event_code, name, venue, city, governorate, start_date, end_date, budget_amount, status, total_sales, total_orders, total_visitors, created_by) VALUES
    (t_id, 'EXB-001', 'Cairo Beauty Expo 2026', 'Cairo International Convention Center', 'Cairo', 'Cairo', '2026-06-15', '2026-06-18', 5000000, 'planning', 0, 0, 0, u_id),
    (t_id, 'EXB-002', 'Alexandria Summer Market', 'Bibliotheca Alexandrina', 'Alexandria', 'Alexandria', '2026-07-01', '2026-07-03', 2000000, 'planning', 0, 0, 0, u_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
