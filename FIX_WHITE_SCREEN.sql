-- ============================================================================
-- FIX WHITE SCREEN - ASSIGN ROLE TO YOUR USER
-- ============================================================================

-- Step 1: Check all users and their roles
SELECT 
  id,
  email,
  full_name,
  role,
  CASE 
    WHEN role IS NULL THEN '❌ NO ROLE - Causes white screen'
    WHEN role NOT IN ('admin', 'manager', 'employee') THEN '❌ INVALID ROLE'
    ELSE '✅ Has valid role'
  END as status
FROM public.profiles
ORDER BY created_at;

-- Step 2: Assign admin role to your user
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Step 3: Verify the update worked
SELECT 
  email,
  role,
  '✅ Role assigned! Refresh browser and login again' as next_step
FROM public.profiles
WHERE role = 'admin';
