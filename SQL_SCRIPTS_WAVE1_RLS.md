# SQL Scripts for Wave 1 RLS Policy Configuration

Complete SQL scripts for configuring Row-Level Security (RLS) policies for the Customer Management Module. These scripts enable RLS on the three core tables and create role-based access policies for Admin, Manager, and Employee users.

---

## Overview

This document contains SQL for 3 parallel RLS configuration tasks:
1. Configure RLS policies for `customers` table (Task 1.5)
2. Configure RLS policies for `customer_interactions` table (Task 1.6)
3. Configure RLS policies for `customer_audit_log` table (Task 1.7)

All scripts are designed to be run in the Supabase SQL Editor. RLS is critical for enforcing role-based access control at the database level, preventing unauthorized data access.

---

## Prerequisites

Before running these RLS scripts, ensure the following tables and prerequisites are in place:

1. ✅ `auth.users` table (Supabase built-in)
2. ✅ `public.user_roles` table with columns: `user_id`, `role` (from Task 1.4)
3. ✅ `public.customers` table (from Task 1.1)
4. ✅ `public.customer_interactions` table (from Task 1.2)
5. ✅ `public.customer_audit_log` table (from Task 1.3)

All RLS policies assume the `user_roles` table has been properly populated with user role assignments.

---

## Task 1.5: Configure RLS Policies for Customers Table

**Requirements**: 4.1, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4, 9.5, 9.7

This task enables RLS on the `customers` table and creates two policies:

### Policy 1: SELECT (customers_select_policy)

**Access Rules:**
- **Admin**: Can see ALL customers (no filtering)
- **Manager**: Can see ALL customers (no filtering)
- **Employee**: Can see only customers where `assigned_employee_id = auth.uid()`
- **Service Role**: Can see all customers (for server-side operations)

### Policy 2: INSERT, UPDATE, DELETE (customers_modify_policy)

**Access Rules:**
- **Admin**: Can create, update, and delete any customer
- **Manager**: Can create, update, and delete any customer
- **Employee**: CANNOT create, update, or delete customers
- **Service Role**: Can perform all operations (for triggers and background jobs)

Copy this entire script into Supabase SQL Editor and run it:

```sql
-- ============================================================================
-- WAVE 1, TASK 1.5: Configure RLS policies for customers table
-- ============================================================================

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policy 1: SELECT (customers_select_policy)
-- Admin and Manager: see all customers
-- Employee: see only assigned customers
-- Service role: see all customers
-- ============================================================================

CREATE POLICY customers_select_policy ON public.customers
  FOR SELECT
  USING (
    -- Service role (anon key with elevated permissions) can see all
    auth.role() = 'service_role'
    OR
    -- Check user role and apply appropriate filtering
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND (
          -- Admin or Manager sees all customers
          role IN ('admin', 'manager')
          OR
          -- Employee sees only customers assigned to them
          (role = 'employee' AND auth.uid() = customers.assigned_employee_id)
        )
    )
  );

-- ============================================================================
-- Policy 2: INSERT, UPDATE, DELETE (customers_modify_policy)
-- Only Admin and Manager can modify
-- Employee cannot modify
-- Service role can modify (for server-side operations)
-- ============================================================================

CREATE POLICY customers_modify_policy ON public.customers
  FOR INSERT, UPDATE, DELETE
  USING (
    -- Service role can perform all modifications
    auth.role() = 'service_role'
    OR
    -- Only Admin and Manager can modify customers
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    -- Additional check for INSERT/UPDATE - ensure only Admin/Manager can modify
    auth.role() = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Add documentation for RLS policies
COMMENT ON POLICY customers_select_policy ON public.customers IS 
  'Customers table SELECT policy: Admin/Manager see all, Employee sees only assigned customers';

COMMENT ON POLICY customers_modify_policy ON public.customers IS 
  'Customers table INSERT/UPDATE/DELETE policy: Only Admin/Manager can modify, Employee cannot modify';

-- ============================================================================
-- Task 1.5 Complete - RLS enabled on customers table with 2 policies
-- ============================================================================
```

---

## Task 1.6: Configure RLS Policies for Customer Interactions Table

**Requirements**: 7.5, 7.6, 7.7

This task enables RLS on the `customer_interactions` table and creates policies for reading and writing interactions:

### Policy 1: SELECT (interactions_select_policy)

**Access Rules:**
- **Admin**: Can see all interactions for all customers
- **Manager**: Can see all interactions for all customers
- **Employee**: Can see interactions only for customers assigned to them
- **Service Role**: Can see all interactions (for server-side operations)

### Policy 2: INSERT, UPDATE, DELETE (interactions_modify_policy)

**Access Rules:**
- **Users can INSERT their own interactions**: `created_by = auth.uid()` (for any customer they can access)
- **Manager/Admin can INSERT** interactions for any customer
- **Manager/Admin can UPDATE/DELETE** any interaction
- **Employee can UPDATE/DELETE** only their own interactions (`created_by = auth.uid()`)
- **Service Role**: Can perform all operations (for audit logging)

Copy this entire script into Supabase SQL Editor and run it:

```sql
-- ============================================================================
-- WAVE 1, TASK 1.6: Configure RLS policies for customer_interactions table
-- ============================================================================

-- Enable RLS on customer_interactions table
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policy 1: SELECT (interactions_select_policy)
-- Authorized users can read interactions for customers they can view
-- Admin: can see all interactions
-- Manager: can see all interactions
-- Employee: can only see interactions for customers assigned to them
-- Service role: can see all interactions
-- ============================================================================

CREATE POLICY interactions_select_policy ON public.customer_interactions
  FOR SELECT
  USING (
    -- Service role can see all interactions
    auth.role() = 'service_role'
    OR
    -- Check if user has access to the customer this interaction belongs to
    EXISTS (
      SELECT 1 FROM public.customers c
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = customer_interactions.customer_id
        AND (
          -- Admin or Manager sees all interactions
          ur.role IN ('admin', 'manager')
          OR
          -- Employee sees interactions only for assigned customers
          (ur.role = 'employee' AND auth.uid() = c.assigned_employee_id)
        )
    )
  );

-- ============================================================================
-- Policy 2: INSERT, UPDATE, DELETE (interactions_modify_policy)
-- Users can INSERT their own interactions (created_by = auth.uid())
-- Manager/Admin can INSERT for any customer
-- Manager/Admin can UPDATE/DELETE any interaction
-- Employee can UPDATE/DELETE only their own interactions
-- Service role can perform all modifications
-- ============================================================================

CREATE POLICY interactions_modify_policy ON public.customer_interactions
  FOR INSERT, UPDATE, DELETE
  USING (
    -- Service role can perform all modifications
    auth.role() = 'service_role'
    OR
    -- For existing records (UPDATE/DELETE): check authorization
    EXISTS (
      SELECT 1 FROM public.customers c
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = customer_interactions.customer_id
        AND (
          -- Admin/Manager can modify any interaction
          ur.role IN ('admin', 'manager')
          OR
          -- Employee can only modify their own interactions
          (ur.role = 'employee' AND auth.uid() = customer_interactions.created_by)
        )
    )
  )
  WITH CHECK (
    -- For INSERT/UPDATE: ensure the associated customer exists and user can access it
    auth.role() = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM public.customers c
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = customer_interactions.customer_id
        AND (
          -- Admin/Manager can create/modify for any customer
          ur.role IN ('admin', 'manager')
          OR
          -- Employee can only create/modify interactions for assigned customers
          -- AND only if they are the ones creating it
          (ur.role = 'employee' AND auth.uid() = c.assigned_employee_id AND auth.uid() = customer_interactions.created_by)
        )
    )
  );

-- Add documentation for RLS policies
COMMENT ON POLICY interactions_select_policy ON public.customer_interactions IS 
  'Customer interactions SELECT policy: Authorized users can see interactions for customers they can view';

COMMENT ON POLICY interactions_modify_policy ON public.customer_interactions IS 
  'Customer interactions INSERT/UPDATE/DELETE policy: Users can create/modify their own, Admin/Manager can modify any';

-- ============================================================================
-- Task 1.6 Complete - RLS enabled on customer_interactions table with 2 policies
-- ============================================================================
```

---

## Task 1.7: Configure RLS Policies for Customer Audit Log Table

**Requirements**: 10.6, 10.7

This task enables RLS on the `customer_audit_log` table and creates policies for immutable audit logging:

### Policy 1: SELECT (audit_log_select_policy)

**Access Rules:**
- **Admin**: Can view ALL audit logs
- **Manager**: Can view ALL audit logs
- **Employee**: CANNOT view audit logs
- **Service Role**: Can view all audit logs (for server-side queries)

### Policy 2: INSERT (audit_log_insert_policy)

**Access Rules:**
- **Service role only** can INSERT audit log entries (from server-side via triggers or background jobs)
- **No user** should be able to INSERT audit logs directly (enforces immutability and audit trail integrity)
- **No UPDATE or DELETE** is allowed on audit logs (immutable)

Copy this entire script into Supabase SQL Editor and run it:

```sql
-- ============================================================================
-- WAVE 1, TASK 1.7: Configure RLS policies for customer_audit_log table
-- ============================================================================

-- Enable RLS on customer_audit_log table
ALTER TABLE public.customer_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policy 1: SELECT (audit_log_select_policy)
-- Admin and Manager can view ALL audit logs
-- Employee CANNOT view audit logs
-- Service role can view all audit logs
-- ============================================================================

CREATE POLICY audit_log_select_policy ON public.customer_audit_log
  FOR SELECT
  USING (
    -- Service role can view all audit logs
    auth.role() = 'service_role'
    OR
    -- Only Admin and Manager can view audit logs
    -- Employee users cannot view audit logs
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- Policy 2: INSERT (audit_log_insert_policy)
-- Service role (server-side only) can INSERT audit log entries
-- Individual users cannot INSERT audit logs
-- Application code (via service role) creates all audit entries
-- ============================================================================

CREATE POLICY audit_log_insert_policy ON public.customer_audit_log
  FOR INSERT
  WITH CHECK (
    -- Only service role (server-side operations) can INSERT audit logs
    -- This ensures all audit entries are created via controlled server-side code
    -- not by user requests
    auth.role() = 'service_role'
  );

-- ============================================================================
-- Prevent UPDATE and DELETE on audit logs (immutability enforcement)
-- Audit logs are immutable - no user should be able to modify them
-- ============================================================================

-- Note: RLS does not restrict UPDATE/DELETE by default for tables with only INSERT policy
-- To fully enforce immutability, we use a default DENY policy for UPDATE/DELETE

CREATE POLICY audit_log_immutable_policy ON public.customer_audit_log
  FOR UPDATE
  USING (FALSE);  -- Always deny UPDATE

CREATE POLICY audit_log_no_delete_policy ON public.customer_audit_log
  FOR DELETE
  USING (FALSE);  -- Always deny DELETE

-- Add documentation for RLS policies
COMMENT ON POLICY audit_log_select_policy ON public.customer_audit_log IS 
  'Audit log SELECT policy: Admin/Manager can view, Employee cannot view, Service role can view all';

COMMENT ON POLICY audit_log_insert_policy ON public.customer_audit_log IS 
  'Audit log INSERT policy: Only service role (server-side) can insert, ensuring audit trail integrity';

COMMENT ON POLICY audit_log_immutable_policy ON public.customer_audit_log IS 
  'Audit log immutability: Prevent UPDATE operations on audit logs';

COMMENT ON POLICY audit_log_no_delete_policy ON public.customer_audit_log IS 
  'Audit log immutability: Prevent DELETE operations on audit logs';

-- ============================================================================
-- Task 1.7 Complete - RLS enabled on customer_audit_log table with 3 policies
-- ============================================================================
```

---

## Verification Scripts

Use these scripts to verify that RLS is enabled and all policies are created correctly.

### Verify RLS is Enabled on All Tables

```sql
-- Check RLS status on all three tables
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'customer_interactions', 'customer_audit_log')
ORDER BY tablename;

-- Expected Result:
-- tablename | rowsecurity
-- -----------+-----------
-- customer_audit_log | t
-- customer_interactions | t
-- customers | t
```

### Verify All Policies Exist

```sql
-- Check all policies on all three tables
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('customers', 'customer_interactions', 'customer_audit_log')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected Result:
-- customers table:
--   - customers_select_policy (PERMISSIVE, SELECT)
--   - customers_modify_policy (PERMISSIVE, INSERT, UPDATE, DELETE)
-- customer_interactions table:
--   - interactions_select_policy (PERMISSIVE, SELECT)
--   - interactions_modify_policy (PERMISSIVE, INSERT, UPDATE, DELETE)
-- customer_audit_log table:
--   - audit_log_select_policy (PERMISSIVE, SELECT)
--   - audit_log_insert_policy (PERMISSIVE, INSERT)
--   - audit_log_immutable_policy (RESTRICTIVE, UPDATE)
--   - audit_log_no_delete_policy (RESTRICTIVE, DELETE)
```

### Verify Policy Details

```sql
-- Get detailed information about each policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  roles,
  using_expr,
  check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'customer_interactions', 'customer_audit_log')
ORDER BY tablename, policyname;

-- This shows the actual SQL expressions for each policy
```

---

## Testing RLS Policies

Use these test scripts to verify that RLS is working correctly for different user roles.

### Test Setup: Create Test Users and Assign Roles

First, create test users in your Supabase project:

1. Login to Supabase Dashboard
2. Go to Authentication → Users
3. Create three test users:
   - `admin@test.com` (will be assigned admin role)
   - `manager@test.com` (will be assigned manager role)
   - `employee@test.com` (will be assigned employee role)

Then, get their user IDs from the auth.users table and insert role assignments:

```sql
-- Get test user IDs (run this to see the UUIDs)
SELECT id, email FROM auth.users WHERE email IN ('admin@test.com', 'manager@test.com', 'employee@test.com');

-- Insert test role assignments (replace UUIDs with actual IDs from above)
INSERT INTO public.user_roles (user_id, role) VALUES
  ('ADMIN_USER_ID', 'admin'),
  ('MANAGER_USER_ID', 'manager'),
  ('EMPLOYEE_USER_ID', 'employee')
ON CONFLICT DO NOTHING;
```

### Test Scenario 1: Admin User Access

```sql
-- As admin user, test SELECT on customers
SELECT COUNT(*) FROM public.customers;
-- Expected: Admin should see all customers

-- As admin user, test INSERT
INSERT INTO public.customers (customer_type, email, phone, address, created_by, updated_by)
VALUES ('individual', 'test@example.com', '555-1234', '123 Main St', auth.uid(), auth.uid());
-- Expected: INSERT succeeds for admin

-- As admin user, test UPDATE
UPDATE public.customers SET status = 'inactive' WHERE id = (SELECT id FROM public.customers LIMIT 1);
-- Expected: UPDATE succeeds for admin

-- As admin user, test audit log SELECT
SELECT COUNT(*) FROM public.customer_audit_log;
-- Expected: Admin should see all audit log entries
```

### Test Scenario 2: Manager User Access

```sql
-- As manager user, test SELECT on customers
SELECT COUNT(*) FROM public.customers;
-- Expected: Manager should see all customers (same count as admin)

-- As manager user, test INSERT
INSERT INTO public.customers (customer_type, email, phone, address, created_by, updated_by)
VALUES ('business', 'business@example.com', '555-5678', '456 Business Ave', auth.uid(), auth.uid());
-- Expected: INSERT succeeds for manager

-- As manager user, test audit log SELECT
SELECT COUNT(*) FROM public.customer_audit_log;
-- Expected: Manager should see all audit log entries
```

### Test Scenario 3: Employee User Access

```sql
-- As employee user, test SELECT on customers
-- First, assign some customers to this employee
UPDATE public.customers SET assigned_employee_id = auth.uid() LIMIT 1;

SELECT COUNT(*) FROM public.customers;
-- Expected: Employee should see only 1 customer (the assigned one)

-- As employee user, test INSERT (should fail)
INSERT INTO public.customers (customer_type, email, phone, address, created_by, updated_by)
VALUES ('individual', 'employee@example.com', '555-9999', '789 Employee St', auth.uid(), auth.uid());
-- Expected: INSERT fails with RLS error for employee

-- As employee user, test UPDATE (should fail)
UPDATE public.customers SET status = 'inactive' WHERE id = (SELECT id FROM public.customers LIMIT 1);
-- Expected: UPDATE fails with RLS error for employee

-- As employee user, test audit log SELECT (should fail)
SELECT COUNT(*) FROM public.customer_audit_log;
-- Expected: SELECT fails with RLS error - employee cannot view audit logs
```

### Test Scenario 4: Customer Interactions RLS

```sql
-- As employee user, add a note to an assigned customer
-- First, get assigned customer ID
WITH assigned_customer AS (
  SELECT id FROM public.customers WHERE assigned_employee_id = auth.uid() LIMIT 1
)
INSERT INTO public.customer_interactions (customer_id, interaction_type, content, created_by, updated_by)
SELECT id, 'note', 'Employee added this note', auth.uid(), auth.uid()
FROM assigned_customer;
-- Expected: INSERT succeeds if the customer is assigned to this employee

-- As employee user, try to add a note to an unassigned customer (should fail)
WITH unassigned_customer AS (
  SELECT id FROM public.customers WHERE assigned_employee_id IS NULL OR assigned_employee_id != auth.uid() LIMIT 1
)
INSERT INTO public.customer_interactions (customer_id, interaction_type, content, created_by, updated_by)
SELECT id, 'note', 'This should fail', auth.uid(), auth.uid()
FROM unassigned_customer;
-- Expected: INSERT fails with RLS error - employee cannot add notes to unassigned customers
```

---

## Troubleshooting RLS Policies

### Issue: "Policy with that name already exists"

This happens when running the scripts multiple times. Solution:

```sql
-- Drop existing policies and recreate them
DROP POLICY IF EXISTS customers_select_policy ON public.customers;
DROP POLICY IF EXISTS customers_modify_policy ON public.customers;
DROP POLICY IF EXISTS interactions_select_policy ON public.customer_interactions;
DROP POLICY IF EXISTS interactions_modify_policy ON public.customer_interactions;
DROP POLICY IF EXISTS audit_log_select_policy ON public.customer_audit_log;
DROP POLICY IF EXISTS audit_log_insert_policy ON public.customer_audit_log;
DROP POLICY IF EXISTS audit_log_immutable_policy ON public.customer_audit_log;
DROP POLICY IF EXISTS audit_log_no_delete_policy ON public.customer_audit_log;

-- Then re-run the policy creation scripts above
```

### Issue: "User has no role in user_roles table"

This happens when a user doesn't have an entry in the `user_roles` table. Solution:

```sql
-- Check if user has a role entry
SELECT * FROM public.user_roles WHERE user_id = auth.uid();

-- If empty, insert a role assignment
INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'employee');
```

### Issue: Queries returning 0 rows unexpectedly

This usually means RLS is blocking access. Enable query logging:

```sql
-- Test with service role to bypass RLS
-- In your application code, use supabase service_role key instead of anon key

-- Or check the actual policy conditions manually:
SELECT 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'employee')
  ) as user_has_role;
```

### Issue: "Permission denied" errors

This usually means the RLS policy is correctly denying access. Check:

1. Is the user authenticated? (`auth.uid()` should not be NULL)
2. Does the user have a role in `user_roles` table?
3. Is the role correct for the operation being attempted?

---

## Notes

- **RLS is enforced at the database level**, providing security even if application code is compromised
- **Service role can bypass RLS** - use only for server-side operations you control
- **Anon key respects RLS** - this is what the frontend uses for client-side operations
- **Always test RLS policies** with test users before deploying to production
- **Performance**: RLS policies add small overhead (~1-5ms per query). Indexes help mitigate this.
- **Audit logs are immutable** - all changes are recorded but not editable, ensuring compliance
- **Employee visibility is strict** - employees only see customers assigned to them, providing data isolation

---

## Policy Enforcement Summary

| Role | Customers (READ) | Customers (WRITE) | Interactions (READ) | Interactions (WRITE) | Audit Log (READ) | Audit Log (WRITE) |
|------|------------------|-------------------|---------------------|----------------------|------------------|-------------------|
| Admin | All | All | All | All | All | N/A (service only) |
| Manager | All | All | All | All | All | N/A (service only) |
| Employee | Assigned only | Denied | Assigned only | Own only | Denied | Denied |
| Service Role | All | All | All | All | All | Own only (INSERT) |

---

## Execution Checklist

Use this checklist to track RLS policy implementation:

- [ ] Read all prerequisites (tables 1.1-1.4 exist and are populated)
- [ ] Run Task 1.5 script (Enable RLS on customers table with 2 policies)
- [ ] Verify Task 1.5 with verification scripts
- [ ] Run Task 1.6 script (Enable RLS on customer_interactions table with 2 policies)
- [ ] Verify Task 1.6 with verification scripts
- [ ] Run Task 1.7 script (Enable RLS on customer_audit_log table with 3 policies)
- [ ] Verify Task 1.7 with verification scripts
- [ ] Test RLS policies with test users (Scenarios 1-4)
- [ ] Document any issues or customizations
- [ ] Proceed to Wave 2 (Data Access Layer)

---

## Total Execution Time

Expected execution time for all three RLS policy tasks:
- **Script execution**: < 2 seconds
- **Verification**: < 5 seconds
- **Testing**: 5-10 minutes (if running manual tests)
- **Total**: ~15-20 minutes including verification

---

## Next Steps

After completing these three RLS policy tasks:

1. **Wave 2**: Create TypeScript types and validation utilities (tasks 2.1-2.4)
2. **Wave 2**: Implement server actions for CRUD operations (tasks 2.5-2.15)
3. **Wave 3**: Create page components for customer list, detail, create, edit
4. **Waves 4-8**: UI components, styling, testing

All subsequent data access will respect these RLS policies, ensuring role-based access control throughout the application.

