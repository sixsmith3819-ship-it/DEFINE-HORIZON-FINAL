-- ============================================================================
-- MASTER COMPATIBILITY SCRIPT
-- Run this ONE script to fix ALL schema mismatches
-- ============================================================================

-- This combines:
-- 1. Customers compatibility (phone, first_name, last_name, business_name, user_roles)
-- 2. Announcements compatibility (message column)
-- 3. Foreign key relationships (transactions)

-- ============================================================================
-- PART 1: CUSTOMERS COMPATIBILITY
-- ============================================================================

-- Rename phone_number to phone
ALTER TABLE public.customers 
RENAME COLUMN phone_number TO phone;

-- Add first_name
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS first_name TEXT 
GENERATED ALWAYS AS (
  CASE WHEN customer_type = 'individual' THEN customer_name ELSE NULL END
) STORED;

-- Add last_name
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS last_name TEXT 
GENERATED ALWAYS AS ('') STORED;

-- Add business_name
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS business_name TEXT
GENERATED ALWAYS AS (
  CASE WHEN customer_type = 'business' THEN customer_name ELSE NULL END
) STORED;

-- Create user_roles view
DROP VIEW IF EXISTS user_roles;
CREATE OR REPLACE VIEW user_roles AS
SELECT id as user_id, role, is_active, created_at FROM public.profiles;
GRANT SELECT ON user_roles TO authenticated, service_role;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON public.customers(first_name);
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON public.customers(business_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- ============================================================================
-- PART 2: ANNOUNCEMENTS COMPATIBILITY
-- ============================================================================

-- Add message column as alias to content
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS message TEXT 
GENERATED ALWAYS AS (content) STORED;

CREATE INDEX IF NOT EXISTS idx_announcements_message ON public.announcements(message);

-- ============================================================================
-- PART 3: FIX FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- Recreate transactions foreign keys
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
-- VERIFICATION
-- ============================================================================

SELECT 'CUSTOMERS COMPATIBILITY' as module, 'ADDED' as status
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='first_name')
UNION ALL
SELECT 'ANNOUNCEMENTS COMPATIBILITY', 'ADDED'
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='message')
UNION ALL
SELECT 'USER_ROLES VIEW', 'CREATED'
WHERE EXISTS (SELECT 1 FROM information_schema.views WHERE table_name='user_roles')
UNION ALL
SELECT 'FOREIGN KEYS', 'FIXED'
WHERE EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='transactions_created_by_fkey');

SELECT 'ALL COMPATIBILITY LAYERS ADDED!' as final_status;
