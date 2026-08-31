# Wave 2 Tasks 4-6 Execution Checklist

Print this or reference it while completing the Supabase setup tasks.

---

## Task 4: Create Supabase Project and Configure Authentication

### Phase 1: Project Creation

- [ ] Created Supabase account at supabase.com
- [ ] Created new project named "horizon-bms"
- [ ] Selected appropriate region (closest to your location)
- [ ] Stored database password securely
- [ ] Waited for project initialization to complete
- [ ] Navigated to project dashboard

### Phase 2: Retrieve Credentials

- [ ] Clicked Settings → API
- [ ] Found and copied `NEXT_PUBLIC_SUPABASE_URL`
  - Value format: `https://[project-id].supabase.co`
- [ ] Found and copied `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Located under "Project API keys" → "anon"
- [ ] Found and copied `SUPABASE_SERVICE_KEY`
  - Located under "Project API keys" → "service_role"
  - ⚠️ IMPORTANT: Keep this secret, never commit to git

### Phase 3: Configure Authentication

- [ ] Navigated to Authentication → Providers → Email
- [ ] **Disabled** "Confirm email" or "Email confirmations"
  - ✅ Users will NOT receive verification emails
  - ✅ Users can login immediately after signup
- [ ] Clicked Save

### Phase 4: Configure Session TTL

- [ ] Navigated to Authentication → Settings
- [ ] Found JWT Settings / JWT Expiry Limit
- [ ] Set JWT expiration to:
  - [ ] 7 days (604,800 seconds) OR
  - [ ] 14 days (1,209,600 seconds) - **RECOMMENDED** OR
  - [ ] 30 days (2,592,000 seconds)
- [ ] Clicked Save

### Phase 5: Store Credentials

- [ ] Opened `.env.local` file in project root
- [ ] Filled in `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Filled in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Filled in `SUPABASE_SERVICE_KEY`
- [ ] Saved `.env.local`
- [ ] Verified `.env.local` is in `.gitignore`

### Phase 6: Verify Setup

- [ ] Stopped any running dev server
- [ ] Ran `npm run dev`
- [ ] Opened `http://localhost:3000` in browser
- [ ] ✅ Home page loaded without errors
- [ ] ✅ Opened browser console (F12) and verified no API errors
- [ ] ✅ No "Connection refused" errors
- [ ] ✅ No "API key" related warnings

**Task 4 Status**: 
- [ ] **COMPLETE** - All steps done and verified

---

## Task 5: Create Profiles Table and Supporting Database Infrastructure

### Phase 1: Access SQL Editor

- [ ] Opened Supabase dashboard
- [ ] Clicked SQL Editor in left sidebar
- [ ] Clicked "New Query" button
- [ ] SQL editor window opened and ready

### Phase 2: Create Profiles Table

- [ ] Copied complete Task 5 SQL script from SQL_SCRIPTS_WAVE2.md
- [ ] Pasted into SQL editor
- [ ] Reviewed SQL to ensure it looks correct
- [ ] Clicked "Run" button
- [ ] Waited for execution to complete
- [ ] ✅ No errors displayed (or only informational messages)

### Phase 3: Verify Table Creation

- [ ] Navigated to Table Editor in left sidebar
- [ ] Located "profiles" table under "public" section
- [ ] Clicked on profiles table
- [ ] Verified all 9 columns present:
  - [ ] `id` (uuid)
  - [ ] `email` (text)
  - [ ] `username` (text)
  - [ ] `first_name` (text)
  - [ ] `last_name` (text)
  - [ ] `role` (text)
  - [ ] `is_active` (boolean)
  - [ ] `created_at` (timestamp with timezone)
  - [ ] `updated_at` (timestamp with timezone)

### Phase 4: Verify Constraints

- [ ] Verified PRIMARY KEY on `id`
- [ ] Verified FOREIGN KEY from `id` to auth.users
- [ ] Verified UNIQUE constraints on `email` and `username`
- [ ] Verified CHECK constraint on `role` (only admin, manager, employee allowed)
- [ ] Verified DEFAULT values:
  - [ ] `is_active` defaults to true
  - [ ] `created_at` defaults to now()
  - [ ] `updated_at` defaults to now()

### Phase 5: Verify Indexes

- [ ] Opened SQL Editor
- [ ] Ran verification query for indexes (from SQL_SCRIPTS_WAVE2.md)
- [ ] Verified two indexes present:
  - [ ] `idx_profiles_is_active`
  - [ ] `idx_profiles_role`

**Task 5 Status**: 
- [ ] **COMPLETE** - Table created and verified

---

## Task 6: Configure Row-Level Security (RLS) Policies

### Phase 1: Enable RLS

- [ ] Opened SQL Editor
- [ ] Created new query
- [ ] Pasted: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
- [ ] Clicked Run
- [ ] ✅ Command executed successfully

### Phase 2: Create User Read Policy

- [ ] Opened SQL Editor → New Query
- [ ] Pasted complete RLS policy script from SQL_SCRIPTS_WAVE2.md
- [ ] **Or ran policies one at a time:**
  - [ ] Created "Users can read own profile" policy
  - [ ] Clicked Run
  - [ ] ✅ Successfully created

### Phase 3: Create User Insert Policy

- [ ] Created "Users can insert own profile" policy
- [ ] Clicked Run
- [ ] ✅ Successfully created

### Phase 4: Create User Update Policy

- [ ] Created "Users can update own profile" policy
- [ ] Clicked Run
- [ ] ✅ Successfully created

### Phase 5: Create Service Role Policy

- [ ] Created "Service role can do all operations" policy
- [ ] Clicked Run
- [ ] ✅ Successfully created

### Phase 6: Verify RLS Policies

- [ ] Opened SQL Editor
- [ ] Ran verification query for policies (from SQL_SCRIPTS_WAVE2.md)
- [ ] Verified 4 policies present:
  - [ ] "Service role can do all operations"
  - [ ] "Users can insert own profile"
  - [ ] "Users can read own profile"
  - [ ] "Users can update own profile"

### Phase 7: Verify in Dashboard

- [ ] Navigated to Table Editor
- [ ] Clicked on profiles table
- [ ] Clicked RLS section (or similar)
- [ ] ✅ All 4 policies visible in dashboard

**Task 6 Status**: 
- [ ] **COMPLETE** - RLS policies configured and verified

---

## Overall Wave 2 Completion Status

### Authentication Setup (Task 4)
- [ ] Supabase project created
- [ ] Email verification disabled
- [ ] Session TTL configured (7-30 days)
- [ ] Credentials stored in .env.local
- [ ] Dev server runs without errors

### Database Schema (Task 5)
- [ ] Profiles table created with correct schema
- [ ] All constraints applied properly
- [ ] Performance indexes created

### Security (Task 6)
- [ ] RLS enabled on profiles table
- [ ] 4 RLS policies created and active
- [ ] Server-side operations permitted via service role

---

## Critical Points to Remember

⚠️ **Security Considerations:**
- `SUPABASE_SERVICE_KEY` is a secret - never commit to git
- `.env.local` is in `.gitignore` - keep it safe
- RLS policies enforce data access at database level
- Service role key bypasses RLS (use only for trusted server operations)

⚠️ **Configuration Verification:**
- Email verification MUST be disabled (Task 4)
- Session TTL should be 7-30 days (recommended 14 days)
- All credentials MUST be in `.env.local` (not in code)

⚠️ **Database Integrity:**
- Foreign key ON DELETE CASCADE ensures clean user deletion
- Unique constraints prevent duplicate emails/usernames
- Check constraint on role prevents invalid role values

---

## Next Steps After Wave 2

Once all three tasks are complete:

1. **Wave 3 Task 7**: Create Supabase client utilities
2. **Wave 3 Task 8**: Implement login authentication flow
3. **Wave 3 Task 9**: Implement logout functionality

Your Supabase backend is now ready for authentication implementation!

---

## Help & Troubleshooting

See **WAVE2_SETUP_GUIDE.md** for:
- Detailed step-by-step instructions with screenshots guidance
- Troubleshooting section for common issues
- References to Supabase documentation

See **SQL_SCRIPTS_WAVE2.md** for:
- Copy-paste ready SQL scripts
- Verification queries
- Quick reference commands

---

## Completion Date

- **Started**: _____________
- **Task 4 Complete**: _____________
- **Task 5 Complete**: _____________
- **Task 6 Complete**: _____________
- **Wave 2 Complete**: _____________

