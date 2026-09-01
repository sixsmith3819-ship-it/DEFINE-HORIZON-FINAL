-- ============================================================================
-- FIX MISSING FOREIGN KEY RELATIONSHIP
-- Supabase can't find the relationship between transactions and profiles
-- ============================================================================

-- The issue: Foreign key exists but Supabase's schema cache doesn't see it
-- This happens when foreign keys are created after RLS policies

-- SOLUTION: Recreate the foreign key constraint with proper naming

-- Step 1: Check current foreign keys on transactions table
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'transactions';

-- Step 2: Drop and recreate the created_by foreign key
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_created_by_fkey;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Step 3: Also ensure customer_id foreign key exists
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_customer_id_fkey;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.customers(id)
ON DELETE CASCADE;

-- Step 4: Refresh Supabase schema cache
-- This forces Supabase to recognize the foreign keys
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify foreign keys are now visible
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'transactions'
ORDER BY tc.constraint_name;

-- Expected output:
-- transactions_created_by_fkey → profiles(id)
-- transactions_customer_id_fkey → customers(id)
