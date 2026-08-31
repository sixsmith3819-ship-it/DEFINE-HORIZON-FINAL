# Wave 2 Setup Guide: Supabase Configuration & Database Schema

This guide provides step-by-step instructions for completing Tasks 4-6 of the Horizon BMS project. These tasks establish the Supabase backend infrastructure required for authentication and data persistence.

---

## Task 4: Create Supabase Project and Configure Authentication

### Overview
You'll create a new Supabase project and configure email/password authentication without email verification.

### Prerequisites
- A Supabase account (free tier sufficient for development)
- The .env.local file from your project

### Step-by-Step Instructions

#### 4.1 Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a new account
3. Click **"New Project"** button (or **"Create a new project"**)
4. Fill in the project details:
   - **Name**: `horizon-bms` (or your preferred name)
   - **Database Password**: Create a strong password (you'll need this)
   - **Region**: Select closest to your location (e.g., US East 1 for USA)
   - **Pricing Plan**: Select "Free" for development
5. Click **"Create new project"**
6. Wait for the project to initialize (5-10 minutes). You'll see a loading indicator.

#### 4.2 Retrieve Your Credentials

Once the project is created, navigate to the project dashboard:

1. Click on **"Settings"** icon (gear icon) in the bottom left sidebar
2. Click **"API"** in the left menu
3. You'll see your API credentials. Copy the following values:

   **NEXT_PUBLIC_SUPABASE_URL**
   - Located under "API URL" section
   - Looks like: `https://[project-id].supabase.co`
   - Copy this value

   **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Located under "Project API keys" → "anon" (public)
   - This is the public key used by the browser client
   - Copy this value

   **SUPABASE_SERVICE_KEY**
   - Located under "Project API keys" → "service_role" (secret)
   - **IMPORTANT**: This is a secret key. Keep it secure, never commit it to version control.
   - Copy this value

#### 4.3 Configure Email/Password Authentication

1. In the Supabase dashboard, click **"Authentication"** in the left sidebar
2. Click **"Providers"** tab
3. Find **"Email"** provider and verify it's enabled (it should be by default)
4. Click on the **"Email"** provider to expand settings
5. Look for the option **"Confirm email"** or **"Email confirmations"**
   - **Disable this option** (toggle it OFF)
   - This ensures users don't need to verify their email before logging in
6. Leave "Double confirm changes" disabled
7. Click **"Save"** (or the option automatically saves)

#### 4.4 Configure Session TTL

Session TTL (Time-To-Live) determines how long a user stays logged in before needing to re-authenticate.

1. In Authentication, click **"Settings"** tab
2. Scroll down to **"JWT Settings"** or **"JWT expiration"**
3. Set the JWT expiration to a value between 7-30 days:
   - Find **"JWT Expiry Limit"** (usually in seconds)
   - For 7 days: `604,800` seconds
   - For 14 days: `1,209,600` seconds
   - For 30 days: `2,592,000` seconds
   - **Recommended**: Use 14 days (`1,209,600` seconds) as a balanced default
4. Click **"Save"**

> **Note**: Supabase also maintains a refresh token (longer-lived) that automatically extends sessions. With this setup, users will typically stay logged in indefinitely unless they explicitly logout or their refresh token expires.

#### 4.5 Store Credentials in .env.local

1. Open your project's `.env.local` file (in the root directory)
2. Fill in the three credentials you copied:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY_HERE
```

3. **Replace the placeholder values** with your actual credentials
4. **Save the file**
5. **Verify**: Your `.env.local` file is in `.gitignore` (it should be). Never commit this file.

#### 4.6 Verification

Test that your credentials are correct:

1. Stop any running dev server (`Ctrl+C`)
2. Start the Next.js dev server: `npm run dev`
3. Open `http://localhost:3000` in your browser
4. If you see the home page without errors in the browser console, credentials are likely correct
5. Check browser console (`F12` → Console tab) for any Supabase connection errors

**Success Indicators:**
- ✅ No "API key" errors in console
- ✅ No "Connection refused" errors
- ✅ Home page loads normally
- ✅ No authentication-related warnings

---

## Task 5: Create Profiles Table and Database Infrastructure

### Overview
You'll create the PostgreSQL `profiles` table that stores user profile information and role assignments.

### Prerequisites
- Completed Task 4 (Supabase project created and credentials stored)

### Schema Definition

The `profiles` table will store:

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, References auth.users(id) ON DELETE CASCADE | User ID from Supabase Auth |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User's email address |
| `username` | VARCHAR(255) | NOT NULL, UNIQUE | Unique username for the user |
| `first_name` | VARCHAR(100) | | User's first name |
| `last_name` | VARCHAR(100) | | User's last name |
| `role` | VARCHAR(50) | NOT NULL, CHECK (role IN ('admin', 'manager', 'employee')) | User's access level |
| `is_active` | BOOLEAN | DEFAULT true | Account status |
| `created_at` | TIMESTAMP | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now() | Last update timestamp |

### Step-by-Step Instructions

#### 5.1 Access the SQL Editor

1. In the Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button
3. A new SQL editor window will open

#### 5.2 Create the Profiles Table

Copy and paste the following SQL script into the SQL editor:

```sql
-- Create profiles table
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

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profile information and role assignments';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, manager, or employee';
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active';

-- Create indexes for query performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Success message (comment only)
-- Profiles table created successfully with indexes on role and is_active
```

#### 5.3 Execute the SQL

1. **Review the SQL** to ensure it looks correct
2. Click the **"Run"** button (play icon, usually in top right)
3. Wait for execution to complete
4. You should see a success message or no errors displayed

#### 5.4 Verify Table Creation

1. In the Supabase dashboard, click **"Table Editor"** in the left sidebar
2. In the left panel under "public", you should now see **"profiles"** table listed
3. Click on **"profiles"** to view the table structure
4. Verify all columns are present with correct types

**Table Structure Verification:**
- ✅ `id` (uuid)
- ✅ `email` (text)
- ✅ `username` (text)
- ✅ `first_name` (text)
- ✅ `last_name` (text)
- ✅ `role` (text)
- ✅ `is_active` (boolean)
- ✅ `created_at` (timestamp with timezone)
- ✅ `updated_at` (timestamp with timezone)

#### 5.5 Verify Indexes

To verify indexes were created:

1. Go back to **SQL Editor**
2. Run this query to check indexes:

```sql
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'profiles' AND indexname LIKE 'idx_profiles%';
```

3. You should see two indexes:
   - `idx_profiles_role`
   - `idx_profiles_is_active`

---

## Task 6: Configure Row-Level Security (RLS) Policies

### Overview
You'll enable Row-Level Security to ensure users can only access their own profile data.

### Prerequisites
- Completed Task 5 (profiles table created)

### RLS Policy Strategy

**RLS Policies enforce data access rules at the database level:**

1. **User Policy**: Users can read only their own profile
2. **Service Role Policy**: Server-side operations (via SUPABASE_SERVICE_KEY) can read/write all data
3. **Enable RLS**: Enforce these policies on all queries

### Step-by-Step Instructions

#### 6.1 Enable Row-Level Security

1. In the Supabase dashboard, go to **"Authentication"** → **"Policies"**
2. Or, navigate to **"SQL Editor"** and run this command:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

3. Verify RLS is enabled by checking the table editor

#### 6.2 Create User Read Policy

This policy allows users to read their own profile:

1. Go to **SQL Editor** → **New Query**
2. Paste this SQL:

```sql
-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
```

3. Click **Run**

#### 6.3 Create User Insert Policy

This policy allows users to create their profile during signup:

```sql
-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

3. Click **Run**

#### 6.4 Create User Update Policy

This policy allows users to update their own profile:

```sql
-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

3. Click **Run**

#### 6.5 Create Service Role Policy

This policy allows the service role (server-side) to perform all operations:

```sql
-- Policy: Service role can do all operations
CREATE POLICY "Service role can do all operations" ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

3. Click **Run**

#### 6.6 Verify RLS Policies

To verify all policies were created:

1. Go to **SQL Editor** → **New Query**
2. Run this verification query:

```sql
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

3. You should see 4 policies:
   - "Users can read own profile"
   - "Users can insert own profile"
   - "Users can update own profile"
   - "Service role can do all operations"

#### 6.7 View Policies in Dashboard

Alternative way to view policies:

1. Go to **Table Editor**
2. Click on **"profiles"** table
3. Click the **"RLS"** button (or expand RLS section)
4. You should see all 4 policies listed with their details

---

## Completion Checklist

After completing all three tasks, verify your setup:

### Task 4 Verification
- [ ] Supabase project created
- [ ] Email/password authentication enabled
- [ ] Email verification disabled
- [ ] Session TTL configured (7-30 days)
- [ ] Credentials retrieved and stored in `.env.local`
- [ ] Three environment variables filled: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
- [ ] Development server runs without authentication errors

### Task 5 Verification
- [ ] Profiles table created
- [ ] All 9 columns present with correct types
- [ ] Constraints applied (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, DEFAULT)
- [ ] Two indexes created (idx_profiles_role, idx_profiles_is_active)
- [ ] Table visible in Supabase Table Editor

### Task 6 Verification
- [ ] Row-Level Security enabled on profiles table
- [ ] 4 RLS policies created and active
- [ ] Policies verified in database
- [ ] Service role policy allows server-side operations

---

## Next Steps

After completing Tasks 4-6:

1. **Keep credentials secure**: Never commit `.env.local` to git
2. **Test database connection**: Phase 3 will create client utilities to test this
3. **Create test user**: Optional - you can create a test user in Supabase Auth → Users to test login later
4. **Proceed to Phase 3**: Implement Supabase client utilities and authentication flow

---

## Troubleshooting

### Issue: "Connection refused" or API key errors in console

**Solution:**
- Verify environment variables in `.env.local` are correct
- Ensure there are no extra spaces or quotes around values
- Restart the development server after updating `.env.local`

### Issue: Email verification still required

**Solution:**
- Double-check that "Confirm email" is disabled in Authentication → Providers → Email
- Clear browser cache and cookies
- Try signing up again

### Issue: Profiles table doesn't appear in Table Editor

**Solution:**
- Refresh the Supabase dashboard page
- Run the verification query in SQL Editor to confirm table exists
- Check for SQL errors in the SQL Editor output

### Issue: RLS policies not working

**Solution:**
- Verify RLS is enabled: Run `SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles';`
- Should return `true`
- Check policy list in Table Editor → profiles → RLS section
- Verify role field in JWT matches `'service_role'` for service role operations

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs: Dashboard → Logs
3. Check SQL Editor for error messages
4. Verify all SQL syntax is correct before running

Good luck with your setup!
