-- ============================================================================
-- USER ROLES VERIFICATION AND MANAGEMENT
-- Check roles, assign roles, and verify role-based access
-- ============================================================================

-- ============================================================================
-- 1. CHECK ALL USERS AND THEIR ROLES
-- ============================================================================
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_active,
  p.created_at,
  CASE 
    WHEN p.role = 'admin' THEN '🔴 ADMIN (Full Access)'
    WHEN p.role = 'manager' THEN '🟡 MANAGER'
    WHEN p.role = 'employee' THEN '🟢 EMPLOYEE (Limited Access)'
    ELSE '⚪ UNKNOWN'
  END as access_level
FROM public.profiles p
ORDER BY 
  CASE p.role 
    WHEN 'admin' THEN 1 
    WHEN 'manager' THEN 2 
    WHEN 'employee' THEN 3 
    ELSE 4 
  END,
  p.email;

-- Expected: List of all users with their roles

-- ============================================================================
-- 2. ROLE BREAKDOWN STATISTICS
-- ============================================================================
SELECT 
  role,
  COUNT(*) as user_count,
  CASE 
    WHEN role = 'admin' THEN 'Full system access'
    WHEN role = 'manager' THEN 'Management access'
    WHEN role = 'employee' THEN 'Limited access'
    ELSE 'Unknown role'
  END as permissions
FROM public.profiles
GROUP BY role
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'manager' THEN 2 
    WHEN 'employee' THEN 3 
    ELSE 4 
  END;

-- Expected: Count of users per role

-- ============================================================================
-- 3. CHECK FOR USERS WITHOUT ROLES OR INVALID ROLES
-- ============================================================================
SELECT 
  'ROLE ISSUES' as check_type,
  p.email,
  p.role,
  CASE 
    WHEN p.role IS NULL THEN '⚠️ No role assigned'
    WHEN p.role NOT IN ('admin', 'manager', 'employee') THEN '⚠️ Invalid role'
    ELSE '✓ Valid role'
  END as status
FROM public.profiles p
WHERE p.role IS NULL 
   OR p.role NOT IN ('admin', 'manager', 'employee');

-- Expected: No rows (all users should have valid roles)
-- If rows appear, those users need role assignment

-- ============================================================================
-- 4. VERIFY RLS POLICIES USE ROLES CORRECTLY
-- ============================================================================
SELECT 
  tablename as table_name,
  policyname as policy_name,
  CASE 
    WHEN policyname LIKE '%admin%' OR policyname LIKE '%Admins%' THEN '🔴 Admin Only'
    WHEN policyname LIKE '%employee%' OR policyname LIKE '%Employees%' THEN '🟢 Employee Access'
    WHEN policyname LIKE '%user%' OR policyname LIKE '%Users%' THEN '🔵 All Users'
    ELSE '⚪ Other'
  END as access_type,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'customers', 'transactions', 'products', 
    'announcements', 'system_settings'
  )
ORDER BY tablename, 
  CASE 
    WHEN policyname LIKE '%admin%' THEN 1 
    WHEN policyname LIKE '%employee%' THEN 2 
    ELSE 3 
  END;

-- Expected: See role-based policies clearly categorized

-- ============================================================================
-- 5. ROLE-BASED ACCESS MATRIX
-- ============================================================================
SELECT 
  '========== ADMIN ROLE ==========' as access_matrix,
  '✓ View all customers' as permission
UNION ALL SELECT '', '✓ Create/Edit/Delete customers'
UNION ALL SELECT '', '✓ View all transactions'
UNION ALL SELECT '', '✓ Create/Edit/Delete transactions'
UNION ALL SELECT '', '✓ Manage products (Full CRUD)'
UNION ALL SELECT '', '✓ Manage announcements (Full CRUD)'
UNION ALL SELECT '', '✓ Manage system settings'
UNION ALL SELECT '', '✓ View all users'

UNION ALL SELECT '========== EMPLOYEE ROLE ==========', ''
UNION ALL SELECT '', '✓ View assigned customers only'
UNION ALL SELECT '', '✓ Create/Edit assigned customers'
UNION ALL SELECT '', '✓ View own transactions only'
UNION ALL SELECT '', '✓ Create transactions'
UNION ALL SELECT '', '✓ View products (read-only)'
UNION ALL SELECT '', '✓ View published announcements only'
UNION ALL SELECT '', '✗ Cannot manage settings'

UNION ALL SELECT '========== MANAGER ROLE ==========', ''
UNION ALL SELECT '', '(Currently same as employee)'
UNION ALL SELECT '', 'Can be customized with additional policies';

-- ============================================================================
-- 6. ASSIGN ROLE TO USER (EXAMPLES - Uncomment and modify as needed)
-- ============================================================================

-- Make a user ADMIN:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- Make a user EMPLOYEE:
-- UPDATE public.profiles 
-- SET role = 'employee' 
-- WHERE email = 'user-email@example.com';

-- Make a user MANAGER:
-- UPDATE public.profiles 
-- SET role = 'manager' 
-- WHERE email = 'manager-email@example.com';

-- ============================================================================
-- 7. ASSIGN YOUR FIRST ADMIN (Run this if you need an admin)
-- ============================================================================

-- Option A: Make yourself admin by email
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'YOUR_EMAIL_HERE';

-- Option B: Make first user admin
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);

-- ============================================================================
-- 8. VERIFY SPECIFIC USER'S ACCESS
-- ============================================================================

-- Check what tables a specific user can access:
-- Replace 'user-email@example.com' with actual email

/*
SELECT 
  'USER ACCESS CHECK' as check_type,
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN 'Can access: ALL tables (Full CRUD)'
    WHEN role = 'employee' THEN 'Can access: Assigned customers, Own transactions, View products'
    ELSE 'Limited access'
  END as access_summary
FROM public.profiles
WHERE email = 'user-email@example.com';
*/

-- ============================================================================
-- 9. TEST ROLE-BASED ACCESS (Simulation)
-- ============================================================================

-- These queries show what admins vs employees can see:

-- ADMIN VIEW: All customers
-- SELECT COUNT(*) as admin_sees_customers 
-- FROM public.customers;

-- EMPLOYEE VIEW: Only assigned customers (simulated)
-- SELECT COUNT(*) as employee_sees_customers 
-- FROM public.customers 
-- WHERE assigned_employee_id = auth.uid();

-- ADMIN VIEW: All transactions
-- SELECT COUNT(*) as admin_sees_transactions 
-- FROM public.transactions;

-- EMPLOYEE VIEW: Only own transactions (simulated)
-- SELECT COUNT(*) as employee_sees_transactions 
-- FROM public.transactions 
-- WHERE created_by = auth.uid();

-- ============================================================================
-- 10. SUMMARY - ROLE SYSTEM STATUS
-- ============================================================================
SELECT 
  '========== ROLE SYSTEM STATUS ==========' as summary,
  '' as detail

UNION ALL
SELECT 
  'Total Users:',
  COUNT(*)::text
FROM public.profiles

UNION ALL
SELECT 
  'Admins:',
  COUNT(*)::text || ' users'
FROM public.profiles
WHERE role = 'admin'

UNION ALL
SELECT 
  'Managers:',
  COUNT(*)::text || ' users'
FROM public.profiles
WHERE role = 'manager'

UNION ALL
SELECT 
  'Employees:',
  COUNT(*)::text || ' users'
FROM public.profiles
WHERE role = 'employee'

UNION ALL
SELECT 
  'Users without roles:',
  COUNT(*)::text || CASE WHEN COUNT(*) > 0 THEN ' ⚠️ NEEDS FIXING' ELSE ' ✓' END
FROM public.profiles
WHERE role IS NULL OR role NOT IN ('admin', 'manager', 'employee')

UNION ALL
SELECT 
  'Role-based policies:',
  COUNT(*)::text || ' policies'
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL
SELECT 
  '========== STATUS ==========',
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') 
    THEN '✓ AT LEAST ONE ADMIN EXISTS'
    ELSE '⚠️ NO ADMIN FOUND - ASSIGN ONE!'
  END;

-- ============================================================================
-- ROLE MANAGEMENT COMPLETE
-- ============================================================================
-- Next steps if needed:
-- 1. If no admin exists, uncomment section 7 and assign your first admin
-- 2. Check section 1 to see all users and their current roles
-- 3. Use section 6 to assign roles to specific users
-- ============================================================================
