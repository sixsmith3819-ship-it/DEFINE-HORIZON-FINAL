-- ============================================================================
-- DIAGNOSE RLS BLOCKING ISSUES
-- Check if RLS policies are too restrictive and blocking legitimate operations
-- ============================================================================

-- CHECK 1: Which tables have RLS enabled?
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '⚠️ RLS IS ENABLED'
    ELSE 'No RLS'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'customers', 'transactions', 'products', 'announcements', 'system_settings')
ORDER BY tablename;

-- CHECK 2: What are ALL the RLS policies on profiles table?
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- CHECK 3: Can we bypass RLS for service_role?
-- ============================================================================
SELECT 
  tablename,
  policyname,
  roles,
  CASE 
    WHEN 'service_role' = ANY(roles) THEN '✓ Service role can bypass'
    WHEN 'authenticated' = ANY(roles) THEN '⚠️ Only authenticated'
    ELSE '❌ Restricted'
  END as access_level
FROM pg_policies
WHERE tablename = 'profiles';

-- CHECK 4: What permissions exist on profiles table?
-- ============================================================================
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY grantee, privilege_type;

-- CHECK 5: Is there a trigger that might be failing?
-- ============================================================================
SELECT 
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  OR (event_object_schema = 'public' AND event_object_table = 'profiles')
ORDER BY trigger_name;

-- CHECK 6: Try to insert a test profile as admin (will show exact error)
-- ============================================================================
DO $$
BEGIN
  -- This will show if RLS is blocking inserts
  INSERT INTO public.profiles (id, email, role, is_active, full_name)
  VALUES (
    gen_random_uuid(),
    'rls-test@example.com',
    'employee',
    true,
    'RLS Test User'
  );
  
  RAISE NOTICE '✓ TEST INSERT WORKED - RLS is not blocking';
  
  -- Clean up test
  DELETE FROM public.profiles WHERE email = 'rls-test@example.com';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ TEST INSERT FAILED: % (Code: %)', SQLERRM, SQLSTATE;
    RAISE NOTICE 'This means RLS policies are TOO RESTRICTIVE';
END $$;

-- CHECK 7: Disable RLS on profiles table (TEMPORARY TEST)
-- ============================================================================
-- Uncomment these lines to temporarily disable RLS and test if that fixes signup:

-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- 
-- -- Now try signing up or creating a user
-- -- If it works, the problem is RLS policies
-- 
-- -- Re-enable RLS after testing:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RESULTS INTERPRETATION:
-- ============================================================================
-- If CHECK 6 shows "TEST INSERT FAILED":
--   → RLS policies are blocking legitimate inserts
--   → Solution: Temporarily disable RLS or create permissive policies
--
-- If CHECK 6 shows "TEST INSERT WORKED":
--   → RLS is not the problem
--   → Problem might be trigger, permissions, or application code
-- ============================================================================
