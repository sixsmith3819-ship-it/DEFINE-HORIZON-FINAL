-- ============================================================================
-- FIX INFINITE RECURSION IN PROFILES RLS POLICIES
-- The problem: RLS policies on profiles table query profiles table = infinite loop
-- The solution: Use auth.uid() directly without querying profiles
-- ============================================================================

-- STEP 1: Drop all existing profiles RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do all operations" ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- STEP 2: Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create SIMPLE policies that do NOT query profiles table

-- Allow users to read their own profile using auth.uid() directly
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- STEP 4: Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'profiles';

-- STEP 5: Test query (this should work now without recursion)
SELECT id, email, role FROM public.profiles WHERE id = auth.uid();
