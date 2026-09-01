-- ============================================================================
-- WHITE SCREEN DIAGNOSTIC
-- Run this to diagnose why dashboard shows white screen after login
-- ============================================================================

-- 1. CHECK IF YOU HAVE A PROFILE WITH A ROLE
SELECT 
  'YOUR PROFILE' as check_type,
  id,
  email,
  full_name,
  role,
  is_active,
  CASE 
    WHEN role IS NULL THEN '❌ NO ROLE - This causes white screen!'
    WHEN role NOT IN ('admin', 'manager', 'employee') THEN '❌ INVALID ROLE - This causes white screen!'
    WHEN role = 'admin' THEN '✓ Valid admin role'
    WHEN role = 'employee' THEN '✓ Valid employee role'
    WHEN role = 'manager' THEN '✓ Valid manager role'
  END as diagnosis
FROM public.profiles
ORDER BY created_at;

-- 2. FIX: ASSIGN ADMIN ROLE TO FIRST USER (Uncomment to fix)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);

-- 3. FIX: ASSIGN ADMIN ROLE BY EMAIL (Uncomment and replace email)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- After running the fix, refresh your browser and try logging in again
