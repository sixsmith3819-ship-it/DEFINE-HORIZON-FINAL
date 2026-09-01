-- ============================================================================
-- COMPLETE FIX: Infinite Recursion + Missing Column + Role Assignment
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- PART 1: Add missing full_name column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- PART 2: Drop ALL existing RLS policies on profiles (causes infinite recursion)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do all operations" ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- PART 3: Create SIMPLE policies (no recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- PART 4: Check users and assign admin role
SELECT 
  id,
  email,
  role,
  full_name,
  created_at,
  CASE 
    WHEN role IS NULL THEN 'NEEDS ROLE ASSIGNMENT'
    ELSE 'OK'
  END as status
FROM public.profiles 
ORDER BY created_at;

-- PART 5: Assign admin role to first user (UNCOMMENT TO RUN)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);

-- PART 6: Verify everything works
SELECT 
  'Profiles RLS Fixed' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role IS NULL THEN 1 END) as users_without_role
FROM public.profiles;
