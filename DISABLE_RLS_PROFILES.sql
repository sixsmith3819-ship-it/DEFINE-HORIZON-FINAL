-- ============================================================================
-- NUCLEAR OPTION: Temporarily Disable RLS on Profiles
-- Use this to get unblocked immediately, then we'll fix policies properly
-- ============================================================================

-- ⚠️ WARNING: This temporarily removes RLS protection
-- Only use in development, not production!

-- STEP 1: Disable RLS on profiles table
-- ============================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Grant all permissions to authenticated users
-- ============================================================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- STEP 3: Verify RLS is disabled
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '❌ Still enabled'
    ELSE '✓ RLS DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- STEP 4: Show current profiles
-- ============================================================================
SELECT 
  id,
  email,
  role,
  full_name,
  is_active,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================================================
-- NOW TEST:
-- 1. Try signing up via web form - should work!
-- 2. Try creating user in Supabase Auth - should work!
-- ============================================================================

-- ============================================================================
-- TO RE-ENABLE RLS LATER (after we fix policies):
-- ============================================================================
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ============================================================================
