-- Migration 014: WhatsApp Bot Engine columns
-- Adds bot state machine columns + meta message tracking

-- Add bot columns to conversations
ALTER TABLE whatsapp.conversations ADD COLUMN IF NOT EXISTS wa_chat_id VARCHAR(50);
ALTER TABLE whatsapp.conversations ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE whatsapp.conversations ADD COLUMN IF NOT EXISTS bot_state VARCHAR(30) NOT NULL DEFAULT 'start';
ALTER TABLE whatsapp.conversations ADD COLUMN IF NOT EXISTS bot_context JSONB NOT NULL DEFAULT '{}';
ALTER TABLE whatsapp.conversations ADD COLUMN IF NOT EXISTS cart JSONB NOT NULL DEFAULT '[]';
ALTER TABLE whatsapp.conversations ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE whatsapp.conversations ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'manual';

-- Add meta tracking to messages
ALTER TABLE whatsapp.messages ADD COLUMN IF NOT EXISTS wa_message_id VARCHAR(100);
ALTER TABLE whatsapp.messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'sent';
ALTER TABLE whatsapp.messages ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Track in migrations table
INSERT INTO public.migrations (name, applied_at)
SELECT '014_whatsapp_bot', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.migrations WHERE name = '014_whatsapp_bot');
