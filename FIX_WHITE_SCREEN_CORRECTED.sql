-- ============================================================================
-- FIX WHITE SCREEN - CORRECTED VERSION (No full_name column)
-- ============================================================================

-- Step 1: Check all users and their roles (without full_name)
SELECT 
  id,
  email,
  role,
  is_active,
  created_at,
  CASE 
    WHEN role IS NULL THEN '❌ NO ROLE - Causes white screen'
    WHEN role NOT IN ('admin', 'manager', 'employee') THEN '❌ INVALID ROLE'
    ELSE '✅ Has valid role'
  END as status
FROM public.profiles
ORDER BY created_at;

-- Step 2: Assign admin role to your user
-- Replace 'your-email@example.com' with your actual email
-- Example: UPDATE public.profiles SET role = 'admin' WHERE email = 'john@example.com';

-- Uncomment and modify this line:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- OR assign admin to the first registered user:
-- UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);

-- Step 3: Verify the update worked
SELECT 
  email,
  role,
  '✅ Role assigned! Close browser, login again' as next_step
FROM public.profiles
WHERE role = 'admin';
