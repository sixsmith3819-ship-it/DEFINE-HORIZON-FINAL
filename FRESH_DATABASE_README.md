# 🎉 FRESH DATABASE SETUP GUIDE
## Define Horizon Business Management System

This guide will help you set up a BRAND NEW database from scratch with ALL required tables, RLS policies, triggers, and sample data.

---

## 📋 Prerequisites

1. **Supabase Account** - Create at https://supabase.com
2. **New Supabase Project** - Create a fresh project (or use existing and we'll clean it)
3. **SQL Editor Access** - Available in Supabase Dashboard

---

## 🚀 Setup Steps (5 Minutes)

### Step 1: Create New Supabase Project (Optional)

If you want a completely fresh start:
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name it: define-horizon-bms
4. Choose a region (closest to Zimbabwe: South Africa)
5. Set a strong database password (save it!)
6. Wait 2 minutes for project to initialize

### Step 2: Get Your Supabase Credentials

1. Go to Project Settings → API
2. Copy these values to your .env.local file:

\\\env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
\\\

### Step 3: Run Database Setup Script

1. Open Supabase Dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Open FRESH_DATABASE_SETUP.sql file
5. Copy ENTIRE contents
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait ~10 seconds

**Expected Output:**
\\\
status: "Database setup complete!"
tables_created: 8
rls_policies_created: 35+
triggers_created: 4+
\\\

### Step 4: Create Your First Admin User

**Option A: Via Supabase Dashboard**
1. Go to Authentication → Users
2. Click "Add user"
3. Enter email: your-email@example.com
4. Click "Add user"
5. Run this SQL to make them admin:

\\\sql
UPDATE public.profiles 
SET role = 'admin', full_name = 'Your Name'
WHERE email = 'your-email@example.com';
\\\

**Option B: Via Web Signup**
1. Go to http://localhost:3000/login
2. Click "Create Account"
3. Fill in details and signup
4. Run SQL above to promote to admin

### Step 5: Insert Sample Data (Optional)

1. Open SQL Editor again
2. Open FRESH_SAMPLE_DATA.sql
3. Copy and paste entire contents
4. Click **Run**
5. Verify output shows:
   - 10 Customers
   - 11 Products
   - 4 Announcements
   - 7 System Settings

### Step 6: Test Your System

1. Go to http://localhost:3000
2. You'll be redirected to /login
3. Login with your admin credentials
4. You should see the full Admin Dashboard! ✅

---

## 📊 What Was Created

### Tables (8)
1. **profiles** - User profiles with roles
2. **customers** - Customer management
3. **products** - Product inventory
4. **transactions** - Financial transactions
5. **customer_interactions** - Customer notes/history
6. **announcements** - System announcements
7. **system_settings** - Configuration
8. **commission_rates** - Transaction commission rates

### RLS Policies (35+)
- **Profiles**: Service role bypass, user CRUD, admin management
- **Customers**: Role-based access, assigned employee access
- **Products**: Admin-only management, all can view
- **Transactions**: Creator can view, admins view all
- **Announcements**: Published visible to all, admin management
- **Settings**: Public settings visible, admin management
- **Interactions**: Based on customer access
- **Commission Rates**: All can view, admin manages

### Triggers (4+)
- **Auto-create profile** - When user signs up via auth
- **Auto-update timestamps** - On profiles, customers, products
- **Handle new user** - Creates profile automatically

### Functions (2)
- **handle_new_user()** - SECURITY DEFINER, bypasses RLS
- **handle_updated_at()** - Updates timestamp on record change

### Indexes (20+)
- Optimized queries on frequently accessed columns
- Email, role, status, timestamps, foreign keys

---

## 🔒 Security Features

### Row Level Security (RLS)
✅ **Enabled on ALL tables**
✅ **Service role** can bypass (for triggers and admin operations)
✅ **Admins** have full access to all tables
✅ **Employees** have limited access based on role
✅ **Anon users** can only signup (create profile)

### Role System
- **Admin**: Full system access, manage all data
- **Manager**: Same as employee (can be customized)
- **Employee**: Limited access, assigned customers only

### Secure Functions
- handle_new_user() uses SECURITY DEFINER to bypass RLS during signup
- Prevents infinite recursion in RLS policies
- Proper permission grants for authenticated and anon roles

---

## 🎯 Sample Data Included

### 10 Customers (Zimbabwean)
- 7 Individual customers
- 3 Business customers
- Realistic names, phone numbers (+263), addresses

### 11 Products
- **Electronics**: Samsung, HP, JBL
- **Appliances**: Defy, LG
- **Furniture**: Sofas, Beds
- **Clothing**: Suits, Dresses
- **Groceries**: Rice, Cooking Oil

### 4 Announcements
- Welcome message
- Training schedule
- Commission rates update
- Holiday schedule

### 7 System Settings
- Company info
- Currency (USD)
- Tax rate (15%)
- Contact details

---

## ✅ Verification Checklist

Run these queries to verify everything is set up correctly:

\\\sql
-- 1. Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Should show 8 tables

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- All should show rowsecurity = true

-- 3. Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';
-- Should show 4+ triggers

-- 4. Check your admin user
SELECT id, email, role, full_name 
FROM public.profiles 
WHERE role = 'admin';
-- Should show your user

-- 5. Check sample data (if inserted)
SELECT 
  (SELECT COUNT(*) FROM public.customers) as customers,
  (SELECT COUNT(*) FROM public.products) as products,
  (SELECT COUNT(*) FROM public.announcements) as announcements;
-- Should show 10, 11, 4
\\\

---

## 🛠️ Troubleshooting

### Problem: "No users found" error when inserting sample data
**Solution**: Create an admin user first (see Step 4)

### Problem: Still can't signup via web form
**Solution**: 
1. Check that FRESH_DATABASE_SETUP.sql ran successfully
2. Verify trigger exists:
\\\sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
\\\

### Problem: Users can't see any data after login
**Solution**: Check RLS policies exist:
\\\sql
SELECT tablename, COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename;
\\\

### Problem: "Database error" when creating transactions/customers
**Solution**: Verify user has active profile:
\\\sql
SELECT * FROM public.profiles WHERE id = auth.uid();
\\\

---

## 🔄 Starting Over

If something goes wrong and you want to start completely fresh:

### Option 1: Delete All Tables
\\\sql
DROP TABLE IF EXISTS public.customer_interactions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.commission_rates CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Then run FRESH_DATABASE_SETUP.sql again
\\\

### Option 2: Create New Supabase Project
1. Create new project in Supabase dashboard
2. Update .env.local with new credentials
3. Run FRESH_DATABASE_SETUP.sql
4. Run FRESH_SAMPLE_DATA.sql

---

## 📞 Support

If you encounter issues:
1. Check the verification queries above
2. Review Supabase logs: Dashboard → Logs → Postgres Logs
3. Check browser console (F12) for errors
4. Verify environment variables in .env.local

---

## 🎊 Success!

Your Define Horizon BMS database is now fully set up with:
✅ All tables created
✅ RLS policies configured
✅ Triggers working
✅ Sample data loaded
✅ Ready for production use!

Go to http://localhost:3000 and start managing your business! 🚀
