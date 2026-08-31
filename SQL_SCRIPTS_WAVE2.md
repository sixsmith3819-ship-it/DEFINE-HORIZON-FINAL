# SQL Scripts for Wave 2 Setup

Quick reference for all SQL commands needed for Tasks 5 and 6. Copy and paste these directly into Supabase SQL Editor.

---

## Complete Task 5 Script (Create Profiles Table)

Copy this entire script into SQL Editor and run it once:

```sql
-- ============================================================================
-- WAVE 2, TASK 5: Create profiles table and supporting infrastructure
-- ============================================================================

-- Create profiles table with proper schema
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Add documentation
COMMENT ON TABLE public.profiles IS 'User profile information and role assignments';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key reference to auth.users';
COMMENT ON COLUMN public.profiles.email IS 'User email address (unique)';
COMMENT ON COLUMN public.profiles.username IS 'Username (unique)';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, manager, or employee';
COMMENT ON COLUMN public.profiles.is_active IS 'Account status (true = active, false = deactivated)';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp of last profile update';

-- Create indexes for performance optimization
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- ============================================================================
-- Task 5 Complete - Profiles table and indexes created
-- ============================================================================
```

---

## Complete Task 6 Script (Configure RLS)

Run these commands one at a time in SQL Editor (or copy all and run together):

```sql
-- ============================================================================
-- WAVE 2, TASK 6: Configure Row-Level Security (RLS) policies
-- ============================================================================

-- Enable Row-Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Service role (server-side) can perform all operations
CREATE POLICY "Service role can do all operations" ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Task 6 Complete - RLS policies configured
-- ============================================================================
```

---

## Verification Scripts

Use these to verify your setup was successful.

### Verify Profiles Table Structure

```sql
-- Check profiles table exists with correct columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**Expected Result**: 9 rows with all columns listed

---

### Verify Indexes Created

```sql
-- Check indexes on profiles table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'profiles'
ORDER BY indexname;
```

**Expected Result**: 3 rows
- `idx_profiles_is_active`
- `idx_profiles_role`
- `profiles_pkey` (automatic primary key index)

---

### Verify RLS Enabled

```sql
-- Check if RLS is enabled on profiles table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';
```

**Expected Result**: 
- `schemaname`: public
- `tablename`: profiles
- `rowsecurity`: true

---

### Verify RLS Policies

```sql
-- Check all RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Expected Result**: 4 rows with these policies:
1. Service role can do all operations
2. Users can insert own profile
3. Users can read own profile
4. Users can update own profile

---

## Testing Scripts (Optional)

These scripts can be used to test RLS policies after profiles table is populated with data.

### Test: Create a test user with a profile

```sql
-- This requires creating an auth user first in Supabase UI
-- Then insert a profile for that user
-- Replace 'test-uuid-here' with actual user ID from auth.users table

INSERT INTO public.profiles (id, email, username, role, is_active)
VALUES (
  'test-uuid-here',
  'testuser@example.com',
  'testuser',
  'employee',
  true
);
```

### Simulate RLS: View profiles as authenticated user

```sql
-- This simulates what a user with a specific ID would see
-- Set local.user_id to the test user's ID first
-- Then query profiles as that user would

SET local.user_id = 'test-uuid-here';

-- This should only return the user's own profile due to RLS
SELECT * FROM public.profiles WHERE id = current_setting('local.user_id', true)::uuid;
```

---

## Quick Troubleshooting

### If table creation fails:

Check for these common issues:
1. **Table already exists**: Drop the table first
   ```sql
   DROP TABLE IF EXISTS public.profiles CASCADE;
   ```
   Then re-run the creation script.

2. **Invalid syntax**: Copy the script exactly as provided, no modifications

3. **Permission issues**: Ensure you're using a role with DDL permissions

---

## Notes

- **RLS Performance**: Indexes on `role` and `is_active` improve query performance with RLS policies
- **Service Role**: The `SUPABASE_SERVICE_KEY` bypasses RLS policies, allowing server-side operations
- **JWT Role**: The `'service_role'` value comes from the JWT generated by Supabase for service key operations
- **Automatic Timestamps**: `created_at` and `updated_at` are automatically set by PostgreSQL

---

## Script Execution Order

For a fresh setup, execute scripts in this order:

1. **Task 5 Complete Script** (creates table and indexes)
2. **Task 6 Complete Script** (enables RLS and creates policies)
3. **Verify scripts** (optional, to confirm success)

All scripts are idempotent or use IF NOT EXISTS clauses where appropriate, so re-running won't cause errors.

