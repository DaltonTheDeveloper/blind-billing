-- ═══════════════════════════════════════
-- BLIND BILLING — DATABASE SCHEMA v1
-- ═══════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MERCHANTS
CREATE TABLE IF NOT EXISTS merchants (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name         text NOT NULL,
  email                 text NOT NULL,
  plan                  text DEFAULT 'starter'
                        CHECK (plan IN ('starter', 'growth', 'scale')),
  branding_mode         text DEFAULT 'blind'
                        CHECK (branding_mode IN ('blind', 'merchant')),
  kurv_template_blind   integer DEFAULT 1,
  kurv_template_own     integer DEFAULT 2,
  api_key_hash          text NOT NULL,
  api_key_preview       text NOT NULL,
  webhook_url           text,
  active                boolean DEFAULT true,
  monthly_volume        numeric(12,2) DEFAULT 0,
  transaction_count     integer DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- TRANSACTIONS (zero cardholder PII stored)
CREATE TABLE IF NOT EXISTS transactions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id           uuid REFERENCES merchants(id) ON DELETE CASCADE,
  reference             text,
  payment_id            text UNIQUE NOT NULL,
  kurv_payment_id       text,
  amount                numeric(10,2) NOT NULL,
  currency              text DEFAULT 'USD',
  status                text DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','failed','refunded','cancelled')),
  payment_link          text,
  qr_code_url           text,
  idempotency_key       text UNIQUE,
  card_brand            text,
  card_last4            text,
  created_at            timestamptz DEFAULT now(),
  settled_at            timestamptz,
  metadata              jsonb DEFAULT '{}'
);

-- AUDIT LOG (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id           uuid,
  action                text NOT NULL,
  lambda_fn             text,
  status_code           integer,
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_merchants_api_key_hash ON merchants(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_created ON transactions(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_kurv_payment_id ON transactions(kurv_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(merchant_id, reference);

-- ROW LEVEL SECURITY
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchants_own_row" ON merchants
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "transactions_own_merchant" ON transactions
  FOR ALL USING (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid()
    )
  );

-- AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ENABLE REALTIME for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
