-- Migration 027: WhatsApp Full Enhancement
-- Adds bot flows, quick replies, notification templates, WA orders, daily stats

-- ═══ Add missing columns to conversations ═══
ALTER TABLE whatsapp.conversations ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'normal';
ALTER TABLE whatsapp.conversations ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ═══ Add missing columns to messages ═══
ALTER TABLE whatsapp.messages ADD COLUMN IF NOT EXISTS interactive_data JSONB;

-- ═══ Bot Flows ═══
CREATE TABLE IF NOT EXISTS whatsapp.bot_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  trigger_keywords TEXT[] NOT NULL DEFAULT '{}',
  response_type VARCHAR(20) NOT NULL DEFAULT 'text',
  response_content TEXT NOT NULL,
  buttons JSONB DEFAULT '[]',
  list_sections JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══ Quick Replies ═══
CREATE TABLE IF NOT EXISTS whatsapp.quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  shortcut VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(30) DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══ Notification Templates ═══
CREATE TABLE IF NOT EXISTS whatsapp.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  template_type VARCHAR(30) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  send_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══ WhatsApp Orders (bot-created, before sync to sales) ═══
CREATE TABLE IF NOT EXISTS whatsapp.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  conversation_id UUID REFERENCES whatsapp.conversations(id),
  order_number VARCHAR(30) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(200),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal BIGINT NOT NULL DEFAULT 0,
  tax_amount BIGINT NOT NULL DEFAULT 0,
  shipping_amount BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  shipping_address JSONB,
  sales_order_id UUID,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══ Daily Stats ═══
CREATE TABLE IF NOT EXISTS whatsapp.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  stat_date DATE NOT NULL,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_received INTEGER NOT NULL DEFAULT 0,
  conversations_opened INTEGER NOT NULL DEFAULT 0,
  conversations_resolved INTEGER NOT NULL DEFAULT 0,
  orders_created INTEGER NOT NULL DEFAULT 0,
  revenue BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, stat_date)
);

-- ═══ Seed: Bot Flows ═══
INSERT INTO whatsapp.bot_flows (tenant_id, name, trigger_keywords, response_type, response_content, is_active, sort_order) VALUES
('a0000000-0000-0000-0000-000000000001', 'Welcome Flow', '{hello,hi,مرحبا,السلام,start}', 'buttons', 'مرحباً بك في بروشيا! 💄✨ كيف يمكننا مساعدتك؟', true, 1),
('a0000000-0000-0000-0000-000000000001', 'Products Flow', '{products,منتجات,shop,تسوق,catalog}', 'list', 'تصفح مجموعتنا الرائعة من مستحضرات التجميل 🛍️', true, 2),
('a0000000-0000-0000-0000-000000000001', 'Order Flow', '{order,طلب,buy,شراء}', 'text', 'يسعدنا مساعدتك في إتمام طلبك! 🛒 يرجى إرسال اسم المنتج أو تصفح الكاتالوج.', true, 3),
('a0000000-0000-0000-0000-000000000001', 'Track Flow', '{track,تتبع,tracking,شحن,order status}', 'text', '📦 لتتبع طلبك، يرجى إرسال رقم الطلب (مثال: SO-000001)', true, 4),
('a0000000-0000-0000-0000-000000000001', 'Human Handoff', '{agent,help,مساعدة,human,بشري}', 'text', '👋 سيتم تحويلك لأحد أعضاء فريق بروشيا. سيرد عليك في أقرب وقت!', true, 5)
ON CONFLICT DO NOTHING;

-- ═══ Seed: Quick Replies ═══
INSERT INTO whatsapp.quick_replies (tenant_id, shortcut, title, content, category) VALUES
('a0000000-0000-0000-0000-000000000001', '/hours', 'Working Hours', 'مواعيد العمل: السبت - الخميس من 10 صباحاً حتى 10 مساءً 🕙', 'info'),
('a0000000-0000-0000-0000-000000000001', '/location', 'Store Location', '📍 موقعنا: القاهرة - مصر الجديدة. تقدر تزورنا في أي وقت!', 'info'),
('a0000000-0000-0000-0000-000000000001', '/return', 'Return Policy', '🔄 سياسة الإرجاع: يمكنك إرجاع المنتج خلال 14 يوم من تاريخ الاستلام بشرط عدم الفتح.', 'policy'),
('a0000000-0000-0000-0000-000000000001', '/payment', 'Payment Methods', '💳 طرق الدفع المتاحة: كاش عند الاستلام - فودافون كاش - إنستاباي - فيزا/ماستركارد', 'info'),
('a0000000-0000-0000-0000-000000000001', '/shipping', 'Shipping Info', '🚚 الشحن: التوصيل خلال 2-5 أيام عمل. القاهرة والجيزة: 50 جنيه. المحافظات: 70 جنيه.', 'info')
ON CONFLICT DO NOTHING;

-- ═══ Seed: Notification Templates ═══
INSERT INTO whatsapp.notification_templates (tenant_id, name, template_type, content, variables) VALUES
('a0000000-0000-0000-0000-000000000001', 'Order Confirmation', 'order_confirmation', '✅ تم تأكيد طلبك رقم {{order_number}} بقيمة {{total}} جنيه. سيتم التحضير والشحن في أقرب وقت! 💄', '{order_number,total,customer_name}'),
('a0000000-0000-0000-0000-000000000001', 'Shipping Update', 'shipping_update', '🚚 طلبك رقم {{order_number}} تم شحنه! رقم التتبع: {{tracking_number}}. التوصيل المتوقع: {{delivery_date}}', '{order_number,tracking_number,delivery_date}'),
('a0000000-0000-0000-0000-000000000001', 'Delivery Confirmation', 'delivery_confirmation', '✅ تم توصيل طلبك رقم {{order_number}} بنجاح! نتمنى أن تعجبك المنتجات 💄✨ شاركينا رأيك!', '{order_number,customer_name}'),
('a0000000-0000-0000-0000-000000000001', 'Promo Broadcast', 'promo_broadcast', '🎉 عرض خاص من بروشيا! {{promo_details}} استخدمي كود: {{promo_code}} للحصول على خصم {{discount}}% 💄', '{promo_details,promo_code,discount}'),
('a0000000-0000-0000-0000-000000000001', 'Re-engagement', 're_engagement', '👋 وحشتينا يا {{customer_name}}! عندنا منتجات جديدة هتعجبك. زوري متجرنا أو اكتبي "منتجات" لعرض الكاتالوج 💄', '{customer_name}')
ON CONFLICT DO NOTHING;

-- ═══ Track migration ═══
INSERT INTO public.migrations (name, applied_at)
SELECT '027_whatsapp_enhancements', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.migrations WHERE name = '027_whatsapp_enhancements');
