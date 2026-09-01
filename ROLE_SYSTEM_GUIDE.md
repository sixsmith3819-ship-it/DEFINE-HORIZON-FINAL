# User Roles System - Complete Guide

## ✅ YES! Role-Based Security is Fully Configured

Your Define Horizon system has a complete role-based security system with 3 levels:

---

## 🔴 ADMIN Role - Full System Access

**What Admins Can Do:**
- ✅ View **ALL customers** (not just assigned)
- ✅ Create, Edit, Delete customers
- ✅ View **ALL transactions** (from all employees)
- ✅ Create, Edit, Delete transactions
- ✅ Full **Product Management** (CRUD)
- ✅ **Manage Announcements** (Create, Edit, Delete, View all)
- ✅ **System Settings** access and configuration
- ✅ View all user profiles
- ✅ Access all reports and analytics

---

## 🟢 EMPLOYEE Role - Limited Access

**What Employees Can Do:**
- ✅ View **only assigned customers**
- ✅ Create and Edit assigned customers
- ✅ View **only their own transactions**
- ✅ Create new transactions
- ✅ View products (read-only, cannot edit)
- ✅ View **published announcements only** (not drafts)
- ✅ View their own analytics

**What Employees CANNOT Do:**
- ❌ View other employees' customers
- ❌ View other employees' transactions
- ❌ Manage products
- ❌ Create/edit announcements
- ❌ Access system settings
- ❌ Delete anything (except soft-delete their interactions)

---

## 🟡 MANAGER Role - Currently Same as Employee

**What Managers Can Do:**
- Currently same permissions as Employee
- Can be customized with additional policies if needed

---

## 📋 How Role Security Works

### 1. Profile Table
- Every user has a profile with a `role` column
- Role values: `admin`, `manager`, or `employee`
- Role is assigned when user signs up or by admin

### 2. RLS Policies
- **30+ Row Level Security policies** check the user's role
- Policies use: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`
- Automatically enforced at database level

### 3. Application Code
- Server actions check roles before operations
- UI conditionally shows/hides features based on role
- Dashboard routes filtered by role

---

## 🚀 Quick Actions

### Check Your Current Roles
Run `CHECK_USER_ROLES.sql` to see:
- All users and their roles
- Role breakdown statistics
- Users without roles (needs fixing)
- Role-based access summary

### Assign Your First Admin
```sql
-- Make yourself admin (replace with your email)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Assign Role to Any User
```sql
-- Make user an admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'user@example.com';

-- Make user an employee
UPDATE public.profiles 
SET role = 'employee' 
WHERE email = 'user@example.com';
```

---

## 🔍 Verify Roles are Working

### Test 1: Check All Users
```sql
SELECT email, role, is_active 
FROM public.profiles 
ORDER BY role;
```

### Test 2: See Role-Based Policies
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Test 3: Verify Admin Exists
```sql
SELECT COUNT(*) as admin_count 
FROM public.profiles 
WHERE role = 'admin';
```
**Expected**: At least 1 admin

---

## ⚠️ Important Notes

1. **New Users Default to Employee**
   - Self-registration creates employee accounts
   - Admins must manually promote users to admin

2. **No Admin = Locked Out**
   - If no admin exists, you can't manage settings
   - Always have at least one admin account

3. **RLS is Always Active**
   - Cannot be bypassed from application
   - Only service role can bypass (backend only)

4. **Testing Locally**
   - Sign in as different users to test
   - Each role sees different data

---

## 📊 Access Control Matrix

| Feature | Admin | Manager | Employee |
|---------|-------|---------|----------|
| View All Customers | ✅ | ❌ | ❌ |
| View Assigned Customers | ✅ | ✅ | ✅ |
| Create Customers | ✅ | ✅ | ✅ |
| Edit Any Customer | ✅ | ❌ | ❌ |
| View All Transactions | ✅ | ❌ | ❌ |
| View Own Transactions | ✅ | ✅ | ✅ |
| Create Transactions | ✅ | ✅ | ✅ |
| Edit Transactions | ✅ | ❌ | ❌ |
| Manage Products | ✅ | ❌ | ❌ |
| View Products | ✅ | ✅ | ✅ |
| Manage Announcements | ✅ | ❌ | ❌ |
| View Announcements | ✅ (all) | ✅ (published) | ✅ (published) |
| System Settings | ✅ | ❌ | ❌ |
| View All Analytics | ✅ | ❌ | ❌ |
| View Own Analytics | ✅ | ✅ | ✅ |

---

## ✅ Summary

**Yes, role-based security is fully solved!**

✓ 3 role levels defined  
✓ 30+ RLS policies active  
✓ Profile table tracks roles  
✓ Database-level enforcement  
✓ Self-registration supported  
✓ Role assignment commands provided  

**Run `CHECK_USER_ROLES.sql` to verify and manage roles!**

---

*Last Updated: Complete Database Setup*
