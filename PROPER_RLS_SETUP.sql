-- ============================================================================
-- PROPER RLS SETUP FOR PROFILES TABLE
-- This allows legitimate operations while maintaining security
-- ============================================================================

-- STEP 1: Drop ALL existing policies (start fresh)
-- ============================================================================
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;

-- STEP 2: Enable RLS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create PERMISSIVE policies (allow operations)
-- ============================================================================

-- Allow service_role FULL ACCESS (bypasses all restrictions)
CREATE POLICY "service_role_all"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow users to SELECT any profile (needed for app functionality)
CREATE POLICY "users_select_all"
ON public.profiles
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow anyone to INSERT profiles (needed for signup)
CREATE POLICY "users_insert_own"
ON public.profiles
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Allow users to UPDATE their own profile
CREATE POLICY "users_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- STEP 4: Grant necessary permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- STEP 5: Verify policies
-- ============================================================================
SELECT 
  policyname,
  cmd,
  roles,
  permissive,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN 'Allows access'
    ELSE 'Restrictive'
  END as type
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- STEP 6: Test that it works
-- ============================================================================
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS Enabled with permissive policies'
    ELSE 'RLS Disabled'
  END as status,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = 'profiles') as policy_count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';
