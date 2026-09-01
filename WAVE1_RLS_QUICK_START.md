# Wave 1 RLS Configuration Quick Start Guide

## Overview

This guide provides step-by-step instructions for implementing RLS policies on three customer management tables. All SQL is provided and ready to execute.

---

## Prerequisites Checklist

Before starting, verify these are complete:

- [x] Task 1.1: `customers` table created
- [x] Task 1.2: `customer_interactions` table created
- [x] Task 1.3: `customer_audit_log` table created
- [x] Task 1.4: `user_roles` table created
- [x] Test users created in Supabase Auth

If any prerequisites are missing, complete them before proceeding.

---

## Implementation Steps

### Step 1: Enable RLS on Customers Table (Task 1.5)

**Time**: ~2 minutes

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy the **entire** script from `SQL_SCRIPTS_WAVE1_RLS.md` section titled "Task 1.5"
5. Paste into the SQL Editor
6. Click "Run"
7. Expected: Query completes without errors

**What it does:**
- Enables RLS on the `customers` table
- Creates `customers_select_policy` (role-based filtering for SELECT)
- Creates `customers_modify_policy` (admin/manager only for INSERT/UPDATE/DELETE)

**Verification:**
```sql
-- Run this to verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'customers' AND schemaname = 'public';
-- Result: customers | true
```

---

### Step 2: Enable RLS on Interactions Table (Task 1.6)

**Time**: ~2 minutes

1. In the same SQL Editor
2. Create a new query
3. Copy the **entire** script from `SQL_SCRIPTS_WAVE1_RLS.md` section titled "Task 1.6"
4. Paste into the SQL Editor
5. Click "Run"
6. Expected: Query completes without errors

**What it does:**
- Enables RLS on the `customer_interactions` table
- Creates `interactions_select_policy` (authorized users can see interactions for accessible customers)
- Creates `interactions_modify_policy` (users can create/modify own, admins/managers can manage all)

**Verification:**
```sql
-- Run this to verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'customer_interactions' AND schemaname = 'public';
-- Result: customer_interactions | true
```

---

### Step 3: Enable RLS on Audit Log Table (Task 1.7)

**Time**: ~2 minutes

1. In the same SQL Editor
2. Create a new query
3. Copy the **entire** script from `SQL_SCRIPTS_WAVE1_RLS.md` section titled "Task 1.7"
4. Paste into the SQL Editor
5. Click "Run"
6. Expected: Query completes without errors

**What it does:**
- Enables RLS on the `customer_audit_log` table
- Creates `audit_log_select_policy` (admin/manager only for SELECT)
- Creates `audit_log_insert_policy` (service role only for INSERT)
- Creates `audit_log_immutable_policy` (denies all UPDATE)
- Creates `audit_log_no_delete_policy` (denies all DELETE)

**Verification:**
```sql
-- Run this to verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'customer_audit_log' AND schemaname = 'public';
-- Result: customer_audit_log | true
```

---

### Step 4: Verify All Policies

**Time**: ~2 minutes

1. Run this verification query:

```sql
-- Check all policies created
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('customers', 'customer_interactions', 'customer_audit_log')
  AND schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Results**:
- `customers`: 2 policies (select, modify)
- `customer_interactions`: 2 policies (select, modify)
- `customer_audit_log`: 4 policies (select, insert, immutable, no_delete)
- Total: 8 policies

---

## Quick Test (Optional)

To verify RLS is working, run these as different users:

### Test 1: Admin Access
```sql
-- Login as admin user, run:
SELECT COUNT(*) FROM public.customers;
-- Expected: Returns count of all customers
```

### Test 2: Manager Access
```sql
-- Login as manager user, run:
SELECT COUNT(*) FROM public.customers;
-- Expected: Returns count of all customers (same as admin)
```

### Test 3: Employee Access (if assigned)
```sql
-- Login as employee user, run:
SELECT COUNT(*) FROM public.customers;
-- Expected: Returns count of only assigned customers (should be less than admin count)
```

---

## Access Control Reference

Quick reference for what each role can do:

### Customers Table
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Admin | All | ✅ | ✅ | ✅ |
| Manager | All | ✅ | ✅ | ✅ |
| Employee | Assigned only | ❌ | ❌ | ❌ |

### Interactions Table
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Admin | All | ✅ | ✅ | ✅ |
| Manager | All | ✅ | ✅ | ✅ |
| Employee | Assigned only | Assigned only | Own only | Own only |

### Audit Log Table
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Admin | ✅ | ❌ | ❌ | ❌ |
| Manager | ✅ | ❌ | ❌ | ❌ |
| Employee | ❌ | ❌ | ❌ | ❌ |

---

## Troubleshooting

### Policy already exists error
```sql
-- If you see "policy ... already exists", drop and recreate:
DROP POLICY IF EXISTS customers_select_policy ON public.customers;
DROP POLICY IF EXISTS customers_modify_policy ON public.customers;
DROP POLICY IF EXISTS interactions_select_policy ON public.customer_interactions;
DROP POLICY IF EXISTS interactions_modify_policy ON public.customer_interactions;
DROP POLICY IF EXISTS audit_log_select_policy ON public.customer_audit_log;
DROP POLICY IF EXISTS audit_log_insert_policy ON public.customer_audit_log;
DROP POLICY IF EXISTS audit_log_immutable_policy ON public.customer_audit_log;
DROP POLICY IF EXISTS audit_log_no_delete_policy ON public.customer_audit_log;

-- Then re-run the policy creation scripts
```

### User has no role error
```sql
-- If employee can't access customers, check their role:
SELECT * FROM public.user_roles WHERE user_id = 'USER_ID_HERE';

-- If empty, insert a role:
INSERT INTO public.user_roles (user_id, role) VALUES ('USER_ID_HERE', 'employee');
```

### Employee can't see any customers
```sql
-- Verify customer is assigned to them:
SELECT * FROM public.customers 
WHERE assigned_employee_id = auth.uid();

-- If empty, assign a customer:
UPDATE public.customers 
SET assigned_employee_id = 'EMPLOYEE_USER_ID' 
WHERE id = 'CUSTOMER_ID';
```

---

## Status Tracking

Track your implementation progress:

- [ ] Prerequisites verified (Task 1.1-1.4 complete)
- [ ] Task 1.5: Customers table RLS - Executed
- [ ] Task 1.5: Verification - Passed
- [ ] Task 1.6: Interactions table RLS - Executed
- [ ] Task 1.6: Verification - Passed
- [ ] Task 1.7: Audit log table RLS - Executed
- [ ] Task 1.7: Verification - Passed
- [ ] All policies verified (8 total)
- [ ] Quick tests passed
- [ ] Ready to proceed to Wave 2

---

## Success Criteria

✅ All tasks complete when:

1. All three RLS enable statements execute without error
2. All eight policies are created (check with verification query)
3. Admin users can view all customers
4. Manager users can view all customers
5. Employee users can see only assigned customers
6. Employees cannot create/update/delete customers
7. All users cannot modify audit logs

---

## Next Steps

After completing RLS configuration:

1. **Wave 2: Data Access Layer**
   - Create TypeScript types
   - Implement validation utilities
   - Create server actions for CRUD operations

2. **Wave 3: Page Components**
   - Create customer list page
   - Create customer detail page
   - Create customer form

3. **Waves 4+: UI & Testing**
   - Style components
   - Add search/filter functionality
   - Write unit and property tests

---

## Need Help?

Refer to:
- **Detailed Policies**: See `SQL_SCRIPTS_WAVE1_RLS.md`
- **Complete Report**: See `WAVE1_RLS_CONFIGURATION_REPORT.md`
- **Design Document**: See `.kiro/specs/horizon-bms-phase2-customers/design.md`

---

## Time Summary

| Task | Time | Status |
|------|------|--------|
| Task 1.5 (Customers) | 2 min | ⏳ To Do |
| Task 1.6 (Interactions) | 2 min | ⏳ To Do |
| Task 1.7 (Audit Log) | 2 min | ⏳ To Do |
| Verification | 2 min | ⏳ To Do |
| Testing | 3-5 min | ⏳ Optional |
| **Total** | **11-13 min** | ⏳ **To Do** |

**Total time to completion**: ~15 minutes with verification and optional testing

