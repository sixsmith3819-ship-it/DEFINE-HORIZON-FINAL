-- ============================================================================
-- COMPLETE FIX FOR WHITE SCREEN ISSUE
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Add full_name column if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- STEP 2: Check all users and their roles
SELECT 
  id,
  email,
  role,
  full_name,
  CASE 
    WHEN role IS NULL THEN 'MISSING ROLE - CAUSES WHITE SCREEN'
    WHEN role NOT IN ('admin', 'manager', 'employee') THEN 'INVALID ROLE'
    ELSE 'Valid'
  END as status
FROM public.profiles
ORDER BY created_at;

-- STEP 3: Assign admin role to first user (UNCOMMENT TO RUN)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);

-- STEP 4: OR assign by email (UNCOMMENT AND MODIFY)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- STEP 5: Verify fix
SELECT 
  email,
  role,
  'Role assigned successfully' as status
FROM public.profiles
WHERE role IS NOT NULL
ORDER BY created_at;
