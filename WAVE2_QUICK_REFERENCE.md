# Wave 2 Quick Reference Card

One-page visual reference for Wave 2 Tasks 4-6. Print and keep by your desk!

---

## 🎯 Wave 2 at a Glance

| Task | Objective | Duration | Key Actions |
|------|-----------|----------|-------------|
| **4** | Create Supabase project & auth | 30 min | Create project → Disable email verification → Store credentials |
| **5** | Create profiles table & indexes | 15 min | Copy SQL → Execute → Verify schema |
| **6** | Configure RLS policies | 15 min | Enable RLS → Create 4 policies → Verify |

**Total Time**: ~60 minutes | **Difficulty**: Easy (mostly UI + copy-paste SQL)

---

## 📍 Navigation Map: Where to Find Everything in Supabase

```
Supabase Dashboard
├─ 🏠 Home
├─ 🔐 Authentication
│  ├─ Providers → Email [TASK 4: Disable confirmation]
│  └─ Settings → JWT Expiry Limit [TASK 4: Set 7-30 days]
├─ 🗄️ SQL Editor [TASK 5 & 6: Run SQL scripts]
├─ 📋 Table Editor
│  └─ profiles [TASK 5: Verify table]
│     └─ RLS [TASK 6: Verify policies]
└─ ⚙️ Settings
   └─ API [TASK 4: Get 3 credentials]
      ├─ API URL → NEXT_PUBLIC_SUPABASE_URL
      ├─ Project API keys
      │  ├─ anon → NEXT_PUBLIC_SUPABASE_ANON_KEY
      │  └─ service_role → SUPABASE_SERVICE_KEY
      └─ COPY ALL THREE TO .env.local
```

---

## 🔑 Credentials Quick Reference

```
.env.local (in .gitignore - NEVER commit to git)
│
├─ NEXT_PUBLIC_SUPABASE_URL
│  └─ Format: https://your-project-id.supabase.co
│  └─ Visibility: 🟢 PUBLIC (safe in browser)
│  └─ From: Settings → API → API URL
│
├─ NEXT_PUBLIC_SUPABASE_ANON_KEY  
│  └─ Format: eyJhbGc... (long JWT string)
│  └─ Visibility: 🟢 PUBLIC (limited by RLS)
│  └─ From: Settings → API → Project API keys → anon
│
└─ SUPABASE_SERVICE_KEY
   └─ Format: eyJhbGc... (long JWT string)
   └─ Visibility: 🔴 SECRET (server-side only!)
   └─ From: Settings → API → Project API keys → service_role
```

---

## 📊 Database Schema at a Glance

```
┌─────── profiles TABLE ───────┐
├──────────────────────────────┤
│ id (UUID)          [PK, FK]  │ ← Linked to auth.users
│ email (VARCHAR)    [UNIQUE]  │
│ username (VARCHAR) [UNIQUE]  │
│ first_name (VARCHAR)         │
│ last_name (VARCHAR)          │
│ role (VARCHAR)     [ENUM]    │ ← admin|manager|employee only
│ is_active (BOOL)   [DEFAULT] │ ← true by default
│ created_at (TS)    [DEFAULT] │ ← now() by default
│ updated_at (TS)    [DEFAULT] │ ← now() by default
├──────────────────────────────┤
│ INDEXES:                     │
│ • idx_profiles_role          │
│ • idx_profiles_is_active     │
├──────────────────────────────┤
│ RLS: ENABLED ✅              │
│ POLICIES: 4 policies active  │
└──────────────────────────────┘
```

---

## 🔐 RLS Policies Summary

```
┌─ RLS POLICIES ON profiles TABLE
│
├─ Policy 1: "Users can read own profile"
│  ├─ Type: SELECT
│  └─ Rule: Users see only their own profile
│
├─ Policy 2: "Users can insert own profile"
│  ├─ Type: INSERT
│  └─ Rule: Users create only their own profile
│
├─ Policy 3: "Users can update own profile"
│  ├─ Type: UPDATE
│  └─ Rule: Users modify only their own profile
│
└─ Policy 4: "Service role can do all operations"
   ├─ Type: ALL
   └─ Rule: Server-side code (with service key) can access all data
```

---

## ⚡ Task 4 Checklist (Create Supabase Project)

```
□ Go to supabase.com
□ Create new project (name: horizon-bms)
□ Wait for initialization (5-10 min)
□ Settings → API (to get credentials)
  □ Copy: NEXT_PUBLIC_SUPABASE_URL
  □ Copy: NEXT_PUBLIC_SUPABASE_ANON_KEY
  □ Copy: SUPABASE_SERVICE_KEY
□ Authentication → Providers → Email
  □ ✅ DISABLE "Confirm email" checkbox
□ Authentication → Settings
  □ Set JWT Expiry Limit: 1,209,600 (14 days recommended)
□ Fill .env.local with 3 credentials
□ npm run dev (verify no console errors)
✅ TASK 4 COMPLETE
```

---

## ⚡ Task 5 Checklist (Create Profiles Table)

```
□ SQL Editor → New Query
□ Copy complete script from SQL_SCRIPTS_WAVE2.md
□ Paste into SQL editor
□ Click Run
□ ✅ No errors
□ Table Editor → profiles
□ Verify 9 columns with correct types
□ SQL Editor → Run verification query for indexes
□ Verify 2 indexes: idx_profiles_role, idx_profiles_is_active
✅ TASK 5 COMPLETE
```

---

## ⚡ Task 6 Checklist (Configure RLS)

```
□ SQL Editor → New Query
□ ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
□ Click Run
□ Create Policy 1: "Users can read own profile"
  □ SQL Editor → Run
  □ ✅ Success
□ Create Policy 2: "Users can insert own profile"
  □ SQL Editor → Run
  □ ✅ Success
□ Create Policy 3: "Users can update own profile"
  □ SQL Editor → Run
  □ ✅ Success
□ Create Policy 4: "Service role can do all operations"
  □ SQL Editor → Run
  □ ✅ Success
□ Verify query shows 4 policies active
□ Table Editor → profiles → RLS section
□ Confirm all 4 policies visible
✅ TASK 6 COMPLETE
```

---

## 🚨 Critical Security Points

```
⚠️ MUST DO:
  ✅ Disable email verification (Task 4 step)
  ✅ Store credentials in .env.local ONLY
  ✅ Add .env.local to .gitignore
  ✅ Never log or expose SUPABASE_SERVICE_KEY
  ✅ Use service key only in server code

⛔ NEVER DO:
  ❌ Commit .env.local to git
  ❌ Expose service key in browser code
  ❌ Hardcode credentials in source files
  ❌ Skip RLS setup
  ❌ Use wrong key type (use anon in browser, service in server)
```

---

## 🧪 Verification Queries (Copy-Paste Ready)

### Verify Table Structure
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' ORDER BY ordinal_position;
```

### Verify Indexes
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'profiles' AND indexname LIKE 'idx_profiles%';
```

### Verify RLS Enabled
```sql
SELECT relname, relrowsecurity FROM pg_class 
WHERE relname = 'profiles';
```

### Verify RLS Policies
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'profiles' ORDER BY policyname;
```

---

## 📁 Document Quick Links

| Need... | Read... | Time |
|---------|---------|------|
| Full details | WAVE2_SETUP_GUIDE.md | 45 min |
| Quick setup | This file | 5 min |
| Copy-paste SQL | SQL_SCRIPTS_WAVE2.md | 5 min |
| Verify progress | WAVE2_CHECKLIST.md | 10 min |
| Credential help | CREDENTIALS_REFERENCE.md | 10 min |
| Understanding | WAVE2_SUMMARY.md | 5 min |
| Getting started | WAVE2_INDEX.md | 5 min |

---

## 🎬 30-Minute Express Setup

**For experienced developers who want to move fast:**

### Minute 0-5: Create Supabase Project
```
1. supabase.com → Create project (horizon-bms)
2. Wait for initialization
3. Note your project ID
```

### Minute 5-10: Get Credentials & Configure
```
1. Settings → API (copy 3 values)
2. Authentication → Providers → Email (disable confirmation)
3. Authentication → Settings (JWT = 1,209,600)
4. Paste credentials into .env.local
```

### Minute 10-20: Create Database
```
1. SQL Editor → New Query
2. Copy & run Task 5 SQL from SQL_SCRIPTS_WAVE2.md
3. Copy & run Task 6 SQL from SQL_SCRIPTS_WAVE2.md
4. Verify: Table Editor shows profiles table
5. Verify: RLS section shows 4 policies
```

### Minute 20-30: Verify
```
1. npm run dev
2. Check browser console (F12) for no errors
3. Run verification queries in SQL Editor
4. Cross off WAVE2_CHECKLIST.md
```

✅ **Wave 2 Complete in 30 minutes!**

---

## 🔧 Common Commands Reference

```bash
# Restart dev server (after .env.local changes)
npm run dev

# Check Node/npm versions
node --version
npm --version

# View .env.local (verify credentials)
cat .env.local

# Check .gitignore includes .env.local
grep ".env.local" .gitignore
```

---

## 📞 Troubleshooting 1-2-3

**Problem** → **Check** → **Fix**

```
API errors      → .env.local  → Verify credentials exact copy
Auth failed     → Email verify → Disable "Confirm email" in Auth
Table missing   → SQL executed → Refresh Supabase dashboard
RLS not working → RLS enabled → Verify 4 policies present
```

---

## 🎯 Success Indicators (All Should Be ✅)

```
✅ Supabase project created
✅ Email verification disabled
✅ Session TTL configured (7-30 days)
✅ 3 credentials in .env.local
✅ .env.local in .gitignore
✅ Dev server runs, no Supabase errors
✅ profiles table visible in Table Editor
✅ All 9 columns present with correct types
✅ 2 indexes created (role, is_active)
✅ RLS enabled on profiles table
✅ 4 RLS policies present and active
✅ Verification queries all pass
```

All checkmarks = **Wave 2 Complete!** 🎉

---

## 📋 After Wave 2: Checklist Before Phase 3

```
□ .env.local has 3 credentials (all filled)
□ npm run dev works without errors
□ profiles table visible in Supabase
□ 4 RLS policies active
□ All verification queries pass
□ You understand: credentials, RLS, database structure
□ Ready to build client utilities (Phase 3)
```

---

## 🚀 Next: Phase 3 Tasks

- **Task 7**: Create Supabase client utilities
- **Task 8**: Implement login form with validation
- **Task 9**: Implement logout functionality

**Wave 2 backend foundation = ready for Phase 3 frontend!**

---

*Print this page | Bookmark this file | Reference as needed*

**Total Setup Time**: 60 minutes | **Difficulty**: Easy | **Result**: Production-ready backend

