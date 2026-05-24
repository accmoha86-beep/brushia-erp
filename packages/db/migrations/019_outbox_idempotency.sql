-- Migration 019: Add idempotency_key to outbox_events + create idempotency_keys table

ALTER TABLE public.outbox_events ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_outbox_idempotency ON public.outbox_events(idempotency_key);

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  tenant_id UUID NOT NULL,
  operation VARCHAR(50) NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.migrations (name, applied_at) 
VALUES ('019_outbox_idempotency', NOW())
ON CONFLICT DO NOTHING;
