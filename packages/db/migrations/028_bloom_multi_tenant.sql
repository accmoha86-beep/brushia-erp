-- Migration 028: Bloom Multi-Tenant Branding
-- Adds branding columns to tenants for white-label support
-- Platform name: Bloom | Each tenant gets custom branding

-- Add branding columns to tenants
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#E11D48';
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#7C3AED';
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS social_instagram VARCHAR(255);
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(255);
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS social_tiktok VARCHAR(255);
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS invoice_header TEXT;
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS invoice_footer TEXT;
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS receipt_header TEXT;
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS receipt_footer TEXT;
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Update Brushia tenant with branding
UPDATE iam.tenants SET
  tagline = 'Beauty & Cosmetics',
  website = 'www.brushia.net',
  social_instagram = '@brushia',
  invoice_header = '✨ Brushia — Beauty & Cosmetics',
  invoice_footer = 'Thank you for shopping with Brushia! ✨',
  receipt_header = '✨ BRUSHIA ✨',
  receipt_footer = 'Thank you for shopping! ✨',
  primary_color = '#E11D48',
  secondary_color = '#7C3AED'
WHERE slug = 'brushia';

-- Track migration
INSERT INTO public.migrations (name, applied_at)
VALUES ('028_bloom_multi_tenant', NOW())
ON CONFLICT DO NOTHING;
