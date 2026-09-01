-- ============================================================================
-- MASTER COMPATIBILITY SCRIPT (SAFE VERSION)
-- Run this ONE script to fix ALL schema mismatches
-- Uses IF EXISTS checks to avoid errors
-- ============================================================================

-- ============================================================================
-- PART 1: CUSTOMERS COMPATIBILITY
-- ============================================================================

-- Safely rename phone_number to phone (only if phone_number exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.customers RENAME COLUMN phone_number TO phone;
    RAISE NOTICE 'Renamed phone_number to phone';
  ELSE
    RAISE NOTICE 'phone_number does not exist, skipping rename';
  END IF;
END $$;

-- Add first_name (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.customers
    ADD COLUMN first_name TEXT 
    GENERATED ALWAYS AS (
      CASE WHEN customer_type = 'individual' THEN customer_name ELSE NULL END
    ) STORED;
    RAISE NOTICE 'Added first_name column';
  ELSE
    RAISE NOTICE 'first_name already exists';
  END IF;
END $$;

-- Add last_name (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.customers
    ADD COLUMN last_name TEXT 
    GENERATED ALWAYS AS ('') STORED;
    RAISE NOTICE 'Added last_name column';
  ELSE
    RAISE NOTICE 'last_name already exists';
  END IF;
END $$;

-- Add business_name (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE public.customers
    ADD COLUMN business_name TEXT
    GENERATED ALWAYS AS (
      CASE WHEN customer_type = 'business' THEN customer_name ELSE NULL END
    ) STORED;
    RAISE NOTICE 'Added business_name column';
  ELSE
    RAISE NOTICE 'business_name already exists';
  END IF;
END $$;

-- Create user_roles view (drop first if exists)
DROP VIEW IF EXISTS user_roles CASCADE;
CREATE OR REPLACE VIEW user_roles AS
SELECT id as user_id, role, is_active, created_at FROM public.profiles;
GRANT SELECT ON user_roles TO authenticated, service_role;

-- Add indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON public.customers(first_name);
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON public.customers(business_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- ============================================================================
-- PART 2: ANNOUNCEMENTS COMPATIBILITY
-- ============================================================================

-- Add updated_by column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.announcements
    ADD COLUMN updated_by UUID REFERENCES auth.users(id);
    
    -- Set default value for existing rows
    UPDATE public.announcements 
    SET updated_by = created_by 
    WHERE updated_by IS NULL;
    
    -- Make it NOT NULL after setting defaults
    ALTER TABLE public.announcements
    ALTER COLUMN updated_by SET NOT NULL;
    
    RAISE NOTICE 'Added updated_by column to announcements';
  ELSE
    RAISE NOTICE 'updated_by column already exists in announcements';
  END IF;
END $$;

-- Add message column (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'message'
  ) THEN
    ALTER TABLE public.announcements
    ADD COLUMN message TEXT 
    GENERATED ALWAYS AS (content) STORED;
    RAISE NOTICE 'Added message column to announcements';
  ELSE
    RAISE NOTICE 'message column already exists in announcements';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_announcements_message ON public.announcements(message);
CREATE INDEX IF NOT EXISTS idx_announcements_updated_by ON public.announcements(updated_by);

-- ============================================================================
-- PART 3: FIX FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- Recreate transactions foreign keys (always safe to drop and recreate)
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_created_by_fkey;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_customer_id_fkey;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION REPORT
-- ============================================================================

-- Check customers columns
SELECT 'CUSTOMERS TABLE' as section, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('customer_name', 'phone', 'phone_number', 'first_name', 'last_name', 'business_name')
ORDER BY column_name;

-- Check announcements columns
SELECT 'ANNOUNCEMENTS TABLE' as section, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'announcements'
  AND column_name IN ('content', 'message', 'title', 'updated_by', 'updated_at')
ORDER BY column_name;

-- Check views
SELECT 'VIEWS' as section, table_name as view_name, 'EXISTS' as status
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'user_roles';

-- Check foreign keys
SELECT 'FOREIGN KEYS' as section, constraint_name, 'EXISTS' as status
FROM information_schema.table_constraints
WHERE table_name = 'transactions' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%_fkey';

-- Final status
SELECT 'STATUS' as section, 'ALL COMPATIBILITY FIXES COMPLETED!' as message;
