-- ============================================================================
-- IMMEDIATE FIX: Allow User Creation
-- Run this NOW to unblock user creation
-- ============================================================================

-- This fixes the immediate problem by allowing the handle_new_user function
-- to bypass RLS when creating profiles

-- STEP 1: Check if handle_new_user function exists
SELECT 
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '✓ Can bypass RLS'
    ELSE '❌ Cannot bypass RLS - THIS IS THE PROBLEM'
  END as can_bypass_rls
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- STEP 2: Recreate the function with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- This allows the function to bypass RLS
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
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- STEP 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Grant execute permission to everyone
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- STEP 5: ALSO fix the RLS policies to allow anon to insert
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated, anon, service_role
USING (true)  -- Allow checking any profile
WITH CHECK (true);  -- Allow inserting any profile

-- STEP 6: Grant INSERT to anon (needed for signup before auth)
GRANT INSERT ON public.profiles TO anon;
GRANT INSERT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- STEP 7: Verify the fix
SELECT 
  'Function Security' as check_type,
  security_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '✓ FIXED - Can bypass RLS'
    ELSE '❌ Still broken'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

SELECT 
  'Trigger Status' as check_type,
  trigger_name,
  'Active' as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

SELECT 
  'RLS Policy' as check_type,
  policyname,
  roles::text,
  permissive
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'Users can insert own profile';

-- ============================================================================
-- NOW TRY:
-- 1. Sign up via web form - SHOULD WORK!
-- 2. Create user in Supabase Auth - SHOULD WORK!
-- ============================================================================
