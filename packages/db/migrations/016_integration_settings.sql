-- Migration 016: Integration Settings for Admin Control
-- Stores API keys and config per tenant for external integrations

CREATE TABLE IF NOT EXISTS iam.integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    integration_key VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    last_tested_at TIMESTAMPTZ,
    test_result TEXT,
    configured_at TIMESTAMPTZ,
    configured_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, integration_key)
);

-- Also add register_id + branch_type for Exhibition=Branch feature
ALTER TABLE exhibitions.events ADD COLUMN IF NOT EXISTS register_id UUID;
ALTER TABLE inventory.warehouses ADD COLUMN IF NOT EXISTS branch_type VARCHAR(20) DEFAULT 'permanent';

-- Seed default integrations for Brushia tenant
INSERT INTO iam.integration_settings (tenant_id, integration_key, display_name, description, status)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'bosta_shipping', 'Bosta Shipping', 'Egyptian delivery service — create shipments, track packages, calculate rates', 'pending'),
  ('a0000000-0000-0000-0000-000000000001', 'whatsapp_business', 'WhatsApp Business', 'Order intake via WhatsApp — chatbot, catalog browsing, order creation', 'pending'),
  ('a0000000-0000-0000-0000-000000000001', 'vodafone_cash', 'Vodafone Cash', 'Mobile payment collection — accept payments via Vodafone Cash wallets', 'pending'),
  ('a0000000-0000-0000-0000-000000000001', 'instapay', 'InstaPay', 'Instant bank transfers — receive payments via Egypt InstaPay network', 'pending'),
  ('a0000000-0000-0000-0000-000000000001', 'meta_pixel', 'Meta Pixel', 'Facebook/Instagram ad tracking and conversion events', 'pending'),
  ('a0000000-0000-0000-0000-000000000001', 'google_analytics', 'Google Analytics', 'Website and e-commerce analytics tracking', 'pending')
ON CONFLICT (tenant_id, integration_key) DO NOTHING;

