-- ============================================================
-- Survsta Platform: Provider & Equipment Control System (God Mode)
-- ============================================================

-- 1. Ensure suspension and admin note fields on providers
ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Ensure suspension fields on clients (in case unified profiles exist)
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Indexes for fast lookups in marketplace queries
CREATE INDEX IF NOT EXISTS idx_providers_suspension ON providers (is_suspended, suspended_until);
CREATE INDEX IF NOT EXISTS idx_clients_suspension ON clients (is_suspended, suspended_until);
