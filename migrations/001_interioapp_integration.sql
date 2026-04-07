-- InterioApp Integration: Add fields to merchants, fabrics, product_templates, and quotes
-- Run this in Supabase SQL Editor

-- Merchant: InterioApp connection credentials
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS interioapp_account_id TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS interioapp_api_key TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS interioapp_last_sync TIMESTAMPTZ;

-- Fabrics: Track InterioApp origin ID for sync deduplication
ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS interioapp_id TEXT;

-- Product Templates: Track InterioApp origin ID for sync deduplication
ALTER TABLE product_templates ADD COLUMN IF NOT EXISTS interioapp_id TEXT;

-- Quotes: Track InterioApp project reference after push
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS interioapp_project_id TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS interioapp_project_number TEXT;
