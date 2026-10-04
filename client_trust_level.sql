-- ==============================================================================
-- Migration: Add Client Trust & Risk Indicator System (MVP)
-- Adds trust_level ('trusted', 'new', 'risky') and completed_rentals count
-- ==============================================================================

-- 1. Update public.clients table
ALTER TABLE IF EXISTS public.clients 
ADD COLUMN IF NOT EXISTS trust_level text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS completed_rentals integer DEFAULT 0;

-- Optional Check constraint on trust_level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_trust_level_check'
  ) THEN
    ALTER TABLE public.clients
    ADD CONSTRAINT clients_trust_level_check 
    CHECK (trust_level IN ('trusted', 'new', 'risky'));
  END IF;
END $$;

-- 2. Update public.profiles table (if used in parallel with auth)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS trust_level text DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS completed_rentals integer DEFAULT 0;
  END IF;
END $$;

-- 3. Set default values for existing rows
UPDATE public.clients
SET trust_level = COALESCE(trust_level, 'new'),
    completed_rentals = COALESCE(completed_rentals, 0)
WHERE trust_level IS NULL OR completed_rentals IS NULL;

-- 4. Enable indexes for performant querying
CREATE INDEX IF NOT EXISTS idx_clients_trust_level ON public.clients (trust_level);

COMMENT ON COLUMN public.clients.trust_level IS 'Client trust status: trusted (green), new (yellow), or risky (red)';
COMMENT ON COLUMN public.clients.completed_rentals IS 'Total verified completed rentals count';
