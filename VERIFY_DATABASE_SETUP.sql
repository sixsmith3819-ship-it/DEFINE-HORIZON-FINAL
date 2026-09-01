-- ============================================================================
-- VERIFICATION SCRIPT - Check All Tables and RLS Policies
-- Run this to verify COMPLETE_DATABASE_SETUP.sql worked correctly
-- ============================================================================

-- ============================================================================
-- 1. CHECK ALL TABLES EXIST
-- ============================================================================
SELECT 
  'TABLE CHECK' as check_type,
  tablename as name,
  'EXISTS ✓' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles',
    'customers',
    'customer_interactions',
    'customer_audit_log',
    'transactions',
    'transaction_audit_log',
    'products',
    'announcements',
    'system_settings',
    'commission_rates'
  )
ORDER BY tablename;

-- Expected: 10 rows (all tables exist)

-- ============================================================================
-- 2. CHECK RLS IS ENABLED ON ALL TABLES
-- ============================================================================
SELECT 
  'RLS STATUS' as check_type,
  tablename as name,
  CASE 
    WHEN rowsecurity THEN '✓ ENABLED' 
    ELSE '✗ DISABLED' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles',
    'customers',
    'customer_interactions',
    'customer_audit_log',
    'transactions',
    'transaction_audit_log',
    'products',
    'announcements',
    'system_settings',
    'commission_rates'
  )
ORDER BY tablename;

-- Expected: All 10 tables should show "✓ ENABLED"

-- ============================================================================
-- 3. COUNT RLS POLICIES PER TABLE
-- ============================================================================
SELECT 
  'POLICY COUNT' as check_type,
  tablename as name,
  COUNT(*) || ' policies' as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'customers',
    'customer_interactions',
    'customer_audit_log',
    'transactions',
    'transaction_audit_log',
    'products',
    'announcements',
    'system_settings',
    'commission_rates'
  )
GROUP BY tablename
ORDER BY tablename;

-- Expected: Each table should have 2-5 policies

-- ============================================================================
-- 4. LIST ALL RLS POLICIES (DETAILED)
-- ============================================================================
SELECT 
  tablename as table_name,
  policyname as policy_name,
  cmd as operation,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN '✓ Allow' 
    ELSE '✗ Restrict' 
  END as type
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: 30+ policies total across all tables

-- ============================================================================
-- 5. CHECK SYSTEM SETTINGS DATA
-- ============================================================================
SELECT 
  'SYSTEM SETTINGS' as check_type,
  setting_key as name,
  setting_value as status
FROM public.system_settings
ORDER BY setting_key;

-- Expected: 4 settings (commission_rate_local, commission_rate_international, low_stock_threshold_default, company_name)

-- ============================================================================
-- 6. CHECK PERMISSIONS GRANTED
-- ============================================================================
SELECT 
  'PERMISSIONS' as check_type,
  table_name as name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as status
FROM information_schema.table_privileges
WHERE grantee = 'authenticated' 
  AND table_schema = 'public'
  AND table_name IN (
    'profiles',
    'customers',
    'customer_interactions',
    'customer_audit_log',
    'transactions',
    'transaction_audit_log',
    'products',
    'announcements',
    'system_settings',
    'commission_rates'
  )
GROUP BY table_name
ORDER BY table_name;

-- Expected: Each table should have SELECT, INSERT, UPDATE, and/or DELETE permissions

-- ============================================================================
-- 7. CHECK TABLE COLUMNS (Sample tables)
-- ============================================================================

-- System Settings columns
SELECT 
  'SYSTEM_SETTINGS COLUMNS' as check_type,
  column_name as name,
  data_type as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'system_settings'
ORDER BY ordinal_position;

-- Products columns
SELECT 
  'PRODUCTS COLUMNS' as check_type,
  column_name as name,
  data_type as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- ============================================================================
-- 8. CHECK INDEXES CREATED
-- ============================================================================
SELECT 
  'INDEXES' as check_type,
  tablename as name,
  indexname as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'system_settings',
    'products',
    'transaction_audit_log'
  )
ORDER BY tablename, indexname;

-- Expected: Multiple indexes for performance

-- ============================================================================
-- 9. SUMMARY REPORT
-- ============================================================================
SELECT 
  '========== SUMMARY ==========' as summary,
  '' as detail
UNION ALL
SELECT 
  'Tables Created:',
  COUNT(*)::text
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'customers', 'customer_interactions', 'customer_audit_log',
    'transactions', 'transaction_audit_log', 'products', 
    'announcements', 'system_settings', 'commission_rates'
  )
UNION ALL
SELECT 
  'RLS Enabled Tables:',
  COUNT(*)::text
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true
  AND tablename IN (
    'profiles', 'customers', 'customer_interactions', 'customer_audit_log',
    'transactions', 'transaction_audit_log', 'products', 
    'announcements', 'system_settings', 'commission_rates'
  )
UNION ALL
SELECT 
  'Total RLS Policies:',
  COUNT(*)::text
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'System Settings:',
  COUNT(*)::text
FROM public.system_settings
UNION ALL
SELECT 
  '========== STATUS ==========' as summary,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true AND tablename IN ('profiles', 'customers', 'customer_interactions', 'customer_audit_log', 'transactions', 'transaction_audit_log', 'products', 'announcements', 'system_settings', 'commission_rates')) = 10
    THEN '✓ ALL CHECKS PASSED'
    ELSE '✗ SOME CHECKS FAILED'
  END;

-- ============================================================================
-- 10. QUICK TEST - Try to query (should work if RLS is correct)
-- ============================================================================

-- Test 1: Query products (should work - authenticated users can view)
-- SELECT COUNT(*) as product_count FROM public.products;

-- Test 2: Query system settings (should work - public settings visible)
-- SELECT COUNT(*) as settings_count FROM public.system_settings WHERE is_public = true;

-- Test 3: Query commission rates (should work - all users can view)
-- SELECT COUNT(*) as commission_rates_count FROM public.commission_rates;

-- ============================================================================
-- VERIFICATION COMPLETE
-- ============================================================================
-- If all checks pass, your database is fully configured with RLS! ✓
-- ============================================================================
