-- ============================================================================
-- ADD MISSING FULL_NAME COLUMN TO PROFILES TABLE
-- This fixes the white screen issue caused by missing column
-- ============================================================================

-- Check current profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Add full_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN full_name TEXT;
    
    RAISE NOTICE 'Added full_name column to profiles table';
  ELSE
    RAISE NOTICE 'full_name column already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'full_name';

-- Check all profiles
SELECT 
  id,
  email,
  role,
  full_name,
  is_active,
  CASE 
    WHEN role IS NULL THEN '❌ NO ROLE'
    WHEN role NOT IN ('admin', 'manager', 'employee') THEN '❌ INVALID ROLE'
    ELSE '✅ Valid'
  END as status
FROM public.profiles
ORDER BY created_at;
