-- ============================================================================
-- FIX USER CREATION - RLS Policy Issue
-- The "Users can insert own profile" policy is blocking user creation
-- ============================================================================

-- STEP 1: Drop the broken INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- STEP 2: Create a proper INSERT policy with WITH CHECK clause
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- STEP 3: Verify the policy was fixed
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'Users can insert own profile';

-- STEP 4: Test that it works now
-- Try creating a user in Supabase Authentication > Users
-- It should work without "database error"

-- ============================================================================
-- If you still get errors, run this to allow service role to bypass RLS:
-- ============================================================================

-- This ensures the trigger (which runs as service role) can insert profiles
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT INSERT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO service_role;

-- Verify permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'profiles'
  AND privilege_type = 'INSERT';

-- ============================================================================
-- SUCCESS! Now try creating a user again
-- ============================================================================
