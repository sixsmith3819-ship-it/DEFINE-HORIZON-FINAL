# Profiles Table Creation Script

This script creates the profiles table that stores user profile information and role assignments.

## Prerequisites
- Supabase project set up
- auth.users table exists (created by Supabase Auth)

## Instructions
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the script below
4. Click Run to execute

---

## Script: Create Profiles Table

```sql
-- ============================================================================
-- Table: profiles
-- Description: User profiles with role-based access control
-- Dependencies: auth.users (Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add documentation
COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control';
COMMENT ON COLUMN public.profiles.id IS 'Primary key - references auth.users(id)';
COMMENT ON COLUMN public.profiles.email IS 'User email address (synced from auth.users)';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name (optional)';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, manager, or employee (default: employee)';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when profile was last updated';

-- Create index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Trigger: Auto-create profile on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update all profiles (including roles)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT DELETE ON public.profiles TO authenticated;

-- ============================================================================
-- Migration: Sync existing users from user_roles (if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    INSERT INTO public.profiles (id, email, full_name, role, created_at)
    SELECT 
      ur.user_id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', au.email),
      ur.role,
      ur.created_at
    FROM public.user_roles ur
    JOIN auth.users au ON ur.user_id = au.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = ur.user_id
    );
    
    RAISE NOTICE 'Migrated existing user_roles to profiles table';
  ELSE
    RAISE NOTICE 'No user_roles table found - skipping migration';
  END IF;
END $$;
```

---

## Post-Installation

After running the script:

1. Verify table creation:
   SELECT * FROM public.profiles;

2. Check RLS policies:
   SELECT * FROM pg_policies WHERE tablename = 'profiles';

3. Test with existing users - migration happens automatically

## Notes

- Default role: New users get employee role by default
- Auto-sync: Profiles are automatically created when users sign up
- Migration: Existing users from user_roles table are automatically migrated
- RLS: Row-level security ensures users can only see/edit their own profile (except admins)