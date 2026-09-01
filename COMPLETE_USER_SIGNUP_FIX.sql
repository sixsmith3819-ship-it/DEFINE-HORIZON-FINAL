-- ============================================================================
-- COMPLETE FIX FOR USER SIGNUP - RLS + Trigger
-- Fixes both Supabase Auth user creation AND web-based signup
-- ============================================================================

-- PART 1: Fix RLS Policies on Profiles Table
-- ============================================================================

-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;

-- Create a proper INSERT policy that allows users to create their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled but not too strict
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- PART 2: Create or Update the Trigger Function
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to handle new user (runs with elevated privileges)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'employee',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PART 3: Verify Everything
-- ============================================================================

-- Check 1: Verify RLS policies
SELECT 
  'RLS Policies' as check_type,
  policyname,
  cmd,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check 2: Verify trigger exists
SELECT 
  'Trigger Status' as check_type,
  trigger_name,
  event_manipulation,
  'Active' as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check 3: Verify permissions
SELECT 
  'Permissions' as check_type,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'profiles'
  AND privilege_type IN ('INSERT', 'SELECT', 'UPDATE')
ORDER BY grantee, privilege_type;

-- PART 4: Test Profile Creation
-- ============================================================================

-- Show existing profiles
SELECT 
  'Existing Profiles' as check_type,
  id,
  email,
  role,
  full_name,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- SUCCESS! Now try:
-- 1. Sign up via the web form (should work)
-- 2. Create user in Supabase Auth (should work)
-- Both should automatically create a profile
-- ============================================================================
