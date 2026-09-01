-- ============================================================================
-- FIX USER CREATION - Check and Fix Database Triggers
-- This resolves "database error" when creating users in Supabase Auth
-- ============================================================================

-- STEP 1: Check if the handle_new_user trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'profiles'
ORDER BY trigger_name;

-- STEP 2: Check if the profiles table has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- STEP 3: Ensure full_name column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- STEP 4: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- STEP 5: Drop the function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- STEP 6: Create a NEW function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_active, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'employee', -- Default role
    true,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 8: Verify the trigger was created
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  'Trigger created successfully!' as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- STEP 9: Test by checking existing profiles
SELECT 
  id,
  email,
  role,
  full_name,
  is_active,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Try creating a new user in Authentication > Users again
-- 3. The user should be created successfully with a profile
-- ============================================================================
