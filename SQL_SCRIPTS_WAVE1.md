# SQL Scripts for Wave 1 Database Setup

Complete SQL scripts for all Phase 2 Wave 1 database setup tasks. These scripts create the core tables for the Customer Management Module.

---

## Overview

This document contains SQL for 4 parallel tasks:
1. Create `customers` table with discriminated union schema
2. Create `customer_interactions` table for notes and history
3. Create `customer_audit_log` table for immutable audit trail
4. Create `user_roles` table for role assignments

All scripts are designed to be run in the Supabase SQL Editor.

---

## Task 1.1: Create `customers` Table

**Requirements**: 1.1, 1.2, 2.1, 2.2, 12.1

Copy this script into Supabase SQL Editor and run it:

```sql
-- ============================================================================
-- WAVE 1, TASK 1.1: Create customers table with discriminated union schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('individual', 'business')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Individual Fields
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  
  -- Business Fields
  business_name VARCHAR(100),
  contact_person VARCHAR(100),
  business_registration_number VARCHAR(100),
  tax_id VARCHAR(50),
  website VARCHAR(255),
  
  -- Shared Fields
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Assignment Fields
  assigned_employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT individual_required_fields CHECK (
    (customer_type = 'individual' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
    (customer_type = 'business')
  ),
  CONSTRAINT business_required_fields CHECK (
    (customer_type = 'business' AND business_name IS NOT NULL AND contact_person IS NOT NULL) OR
    (customer_type = 'individual')
  )
);

-- Add documentation
COMMENT ON TABLE public.customers IS 'Core customer information for both individual and business types using discriminated union pattern';
COMMENT ON COLUMN public.customers.id IS 'Unique customer identifier';
COMMENT ON COLUMN public.customers.customer_type IS 'Customer type: individual or business (discriminator)';
COMMENT ON COLUMN public.customers.status IS 'Customer status: active or inactive (soft delete)';
COMMENT ON COLUMN public.customers.email IS 'Customer email address (unique constraint)';
COMMENT ON COLUMN public.customers.phone IS 'Customer phone number';
COMMENT ON COLUMN public.customers.address IS 'Customer address';
COMMENT ON COLUMN public.customers.assigned_employee_id IS 'Employee assigned to manage this customer';
COMMENT ON COLUMN public.customers.created_at IS 'Timestamp when customer record was created';
COMMENT ON COLUMN public.customers.created_by IS 'User ID who created the customer';
COMMENT ON COLUMN public.customers.updated_at IS 'Timestamp of last customer update';
COMMENT ON COLUMN public.customers.updated_by IS 'User ID who last updated the customer';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_employee_id ON public.customers(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- ============================================================================
-- Task 1.1 Complete - customers table created with all constraints and indexes
-- ============================================================================
```

---

## Task 1.2: Create `customer_interactions` Table

**Requirements**: 7.1, 7.2, 7.3, 7.4

Copy this script into Supabase SQL Editor and run it:

```sql
-- ============================================================================
-- WAVE 1, TASK 1.2: Create customer_interactions table for notes and history
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL DEFAULT 'note' CHECK (interaction_type IN ('note', 'call', 'email', 'meeting', 'action')),
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT non_empty_content CHECK (LENGTH(TRIM(content)) > 0)
);

-- Add documentation
COMMENT ON TABLE public.customer_interactions IS 'Stores notes, actions, and communication history for each customer';
COMMENT ON COLUMN public.customer_interactions.id IS 'Unique interaction identifier';
COMMENT ON COLUMN public.customer_interactions.customer_id IS 'Reference to customer (cascades on delete)';
COMMENT ON COLUMN public.customer_interactions.interaction_type IS 'Type of interaction: note, call, email, meeting, or action';
COMMENT ON COLUMN public.customer_interactions.content IS 'Interaction content (non-empty constraint)';
COMMENT ON COLUMN public.customer_interactions.is_deleted IS 'Soft delete flag (false = visible, true = deleted)';
COMMENT ON COLUMN public.customer_interactions.created_at IS 'Timestamp when interaction was created';
COMMENT ON COLUMN public.customer_interactions.created_by IS 'User ID who created the interaction';
COMMENT ON COLUMN public.customer_interactions.updated_at IS 'Timestamp of last interaction update';
COMMENT ON COLUMN public.customer_interactions.updated_by IS 'User ID who last updated the interaction';
COMMENT ON COLUMN public.customer_interactions.deleted_at IS 'Timestamp when interaction was deleted (soft delete)';
COMMENT ON COLUMN public.customer_interactions.deleted_by IS 'User ID who deleted the interaction';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON public.customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_created_at ON public.customer_interactions(created_at DESC);

-- ============================================================================
-- Task 1.2 Complete - customer_interactions table created with all constraints and indexes
-- ============================================================================
```

---

## Task 1.3: Create `customer_audit_log` Table

**Requirements**: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7

Copy this script into Supabase SQL Editor and run it:

```sql
-- ============================================================================
-- WAVE 1, TASK 1.3: Create customer_audit_log table for immutable audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('create', 'update', 'delete', 'assign', 'reactivate')),
  field_name VARCHAR(100),
  previous_value TEXT,
  new_value TEXT,
  details JSONB,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  CONSTRAINT immutable_check CHECK (1=1)
);

-- Add documentation
COMMENT ON TABLE public.customer_audit_log IS 'Immutable audit trail of all customer management operations';
COMMENT ON COLUMN public.customer_audit_log.id IS 'Unique audit log entry identifier';
COMMENT ON COLUMN public.customer_audit_log.customer_id IS 'Reference to customer (cascades on delete)';
COMMENT ON COLUMN public.customer_audit_log.operation_type IS 'Type of operation: create, update, delete, assign, or reactivate';
COMMENT ON COLUMN public.customer_audit_log.field_name IS 'Name of field that was changed (for update operations)';
COMMENT ON COLUMN public.customer_audit_log.previous_value IS 'Previous value of changed field';
COMMENT ON COLUMN public.customer_audit_log.new_value IS 'New value of changed field';
COMMENT ON COLUMN public.customer_audit_log.details IS 'Additional details about the operation (JSONB format)';
COMMENT ON COLUMN public.customer_audit_log.created_at IS 'Timestamp when operation occurred';
COMMENT ON COLUMN public.customer_audit_log.created_by IS 'User ID who performed the operation';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_customer_audit_log_customer_id ON public.customer_audit_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_audit_log_created_at ON public.customer_audit_log(created_at DESC);

-- ============================================================================
-- Task 1.3 Complete - customer_audit_log table created with all constraints and indexes
-- ============================================================================
```

---

## Task 1.4: Create `user_roles` Table

**Requirements**: 9.1, 9.2, 9.3, 9.4, 9.5

Copy this script into Supabase SQL Editor and run it:

```sql
-- ============================================================================
-- WAVE 1, TASK 1.4: Create user_roles table for role assignments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_role UNIQUE(user_id)
);

-- Add documentation
COMMENT ON TABLE public.user_roles IS 'User role assignments for role-based access control';
COMMENT ON COLUMN public.user_roles.id IS 'Unique role assignment identifier';
COMMENT ON COLUMN public.user_roles.user_id IS 'Reference to auth user (cascades on delete, unique per user)';
COMMENT ON COLUMN public.user_roles.role IS 'User role: admin, manager, or employee';
COMMENT ON COLUMN public.user_roles.created_at IS 'Timestamp when role assignment was created';

-- Create index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ============================================================================
-- Task 1.4 Complete - user_roles table created with all constraints and indexes
-- ============================================================================
```

---

## Verification Scripts

Use these scripts to verify that all tables were created successfully with correct structure, constraints, and indexes.

### Verify All Tables Exist

```sql
-- Check that all 4 tables exist in the public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'customer_interactions', 'customer_audit_log', 'user_roles')
ORDER BY table_name;

-- Expected Result: 4 rows
-- - customer_audit_log | BASE TABLE
-- - customer_interactions | BASE TABLE
-- - customers | BASE TABLE
-- - user_roles | BASE TABLE
```

### Verify customers Table Structure

```sql
-- Check customers table columns and data types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Expected Result: 18 columns (id, customer_type, status, first_name, last_name, 
-- date_of_birth, business_name, contact_person, business_registration_number, 
-- tax_id, website, email, phone, address, created_at, created_by, updated_at, 
-- updated_by, assigned_employee_id)
```

### Verify customer_interactions Table Structure

```sql
-- Check customer_interactions table columns and data types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customer_interactions'
ORDER BY ordinal_position;

-- Expected Result: 11 columns (id, customer_id, interaction_type, content, 
-- is_deleted, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)
```

### Verify customer_audit_log Table Structure

```sql
-- Check customer_audit_log table columns and data types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customer_audit_log'
ORDER BY ordinal_position;

-- Expected Result: 9 columns (id, customer_id, operation_type, field_name, 
-- previous_value, new_value, details, created_at, created_by)
```

### Verify user_roles Table Structure

```sql
-- Check user_roles table columns and data types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- Expected Result: 4 columns (id, user_id, role, created_at)
```

### Verify All Indexes Created

```sql
-- Check all indexes created for Wave 1 tables
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('customers', 'customer_interactions', 'customer_audit_log', 'user_roles')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected Indexes:
-- customers: pkey, idx_customers_status, idx_customers_assigned_employee_id, 
--           idx_customers_created_by, idx_customers_email
-- customer_interactions: pkey, idx_customer_interactions_customer_id, 
--                       idx_customer_interactions_created_at
-- customer_audit_log: pkey, idx_customer_audit_log_customer_id, 
--                    idx_customer_audit_log_created_at
-- user_roles: pkey, idx_user_roles_user_id
```

### Verify Constraints

```sql
-- Check CHECK constraints on all Wave 1 tables
SELECT 
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('customers', 'customer_interactions', 'customer_audit_log', 'user_roles')
  AND table_schema = 'public'
  AND constraint_type IN ('CHECK', 'UNIQUE', 'FOREIGN KEY')
ORDER BY table_name, constraint_name;

-- Expected Constraints:
-- customers: customer_type CHECK, status CHECK, individual_required_fields CHECK, 
--           business_required_fields CHECK, email UNIQUE
-- customer_interactions: interaction_type CHECK, non_empty_content CHECK
-- customer_audit_log: operation_type CHECK, immutable_check CHECK
-- user_roles: role CHECK, unique_user_role UNIQUE
```

---

## Sample Data Testing (Optional)

These scripts can be used to test that tables are working correctly by inserting sample data.

### Get a Test User ID

First, you need a real user ID from your auth.users table. Run this to find one:

```sql
-- Find the first user in auth.users table
SELECT id, email FROM auth.users LIMIT 1;

-- Copy the returned UUID and use it in the sample data scripts below
```

### Insert Sample Individual Customer

Replace `'00000000-0000-0000-0000-000000000001'` with a real user ID from auth.users:

```sql
INSERT INTO public.customers (
  customer_type, first_name, last_name, email, phone, address, 
  created_by, updated_by
) VALUES (
  'individual',
  'John',
  'Doe',
  'john.doe@example.com',
  '555-123-4567',
  '123 Main St, Anytown, USA',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
);

-- Expected: 1 row inserted
-- Query back: SELECT * FROM public.customers WHERE email = 'john.doe@example.com';
```

### Insert Sample Business Customer

Replace `'00000000-0000-0000-0000-000000000001'` with a real user ID:

```sql
INSERT INTO public.customers (
  customer_type, business_name, contact_person, business_registration_number,
  email, phone, address, created_by, updated_by
) VALUES (
  'business',
  'Acme Corporation',
  'Jane Smith',
  'BR-123456789',
  'contact@acmecorp.com',
  '555-987-6543',
  '456 Business Ave, Commerce City, USA',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
);

-- Expected: 1 row inserted
-- Query back: SELECT * FROM public.customers WHERE business_name = 'Acme Corporation';
```

### Insert Sample Interaction

First get a customer ID:

```sql
-- Find a customer ID
SELECT id FROM public.customers LIMIT 1;

-- Then insert an interaction (replace customer_id and user_id with real values):
INSERT INTO public.customer_interactions (
  customer_id, interaction_type, content, created_by, updated_by
) VALUES (
  'paste-customer-id-here',
  'note',
  'Customer called regarding account status update',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
);

-- Expected: 1 row inserted
```

### Insert Sample Audit Log Entry

```sql
-- Find a customer ID first
SELECT id FROM public.customers LIMIT 1;

-- Then insert an audit log entry (replace customer_id and user_id with real values):
INSERT INTO public.customer_audit_log (
  customer_id, operation_type, field_name, previous_value, new_value,
  created_by
) VALUES (
  'paste-customer-id-here',
  'update',
  'status',
  'active',
  'inactive',
  '00000000-0000-0000-0000-000000000001'
);

-- Expected: 1 row inserted
```

### Insert Sample User Role

```sql
-- Find a user ID first
SELECT id FROM auth.users LIMIT 1;

-- Then insert a user role (replace user_id with a real value):
INSERT INTO public.user_roles (user_id, role) VALUES (
  'paste-user-id-here',
  'manager'
);

-- Expected: 1 row inserted
```

---

## Troubleshooting

### If a table creation script fails:

1. **Table already exists error**: This shouldn't happen with the IF NOT EXISTS clause, but if it does, you can drop the table:
   ```sql
   DROP TABLE IF EXISTS public.customer_audit_log CASCADE;
   DROP TABLE IF EXISTS public.customer_interactions CASCADE;
   DROP TABLE IF EXISTS public.customers CASCADE;
   DROP TABLE IF EXISTS public.user_roles CASCADE;
   ```
   Then re-run the creation scripts.

2. **Foreign key constraint errors**: Ensure that auth.users table exists (it should by default in Supabase). If not, contact Supabase support.

3. **Permission denied errors**: Ensure you're using a role with CREATE TABLE permissions (usually postgres role or service_role).

4. **Syntax errors**: Copy the scripts exactly as provided. Check for any modifications that might have introduced errors.

---

## Notes

- All table creation scripts use `IF NOT EXISTS` to prevent errors if run multiple times
- Foreign keys reference `auth.users(id)` which is the Supabase authentication table
- The `status` field defaults to 'active' for new customers
- The `created_at` and `updated_at` fields use `now()` to automatically record timestamps
- The email field has a UNIQUE constraint to prevent duplicate email addresses
- The customer_interactions table has CASCADE delete for integrity when a customer is deleted
- The user_roles table has a UNIQUE constraint on user_id to ensure one role per user
- Indexes are created for query performance optimization
- All table creation is idempotent (safe to run multiple times)

---

## Execution Order

For a fresh setup, execute scripts in this order:

1. **Task 1.4: Create user_roles table** (no dependencies)
2. **Task 1.1: Create customers table** (depends on auth.users, independent of others)
3. **Task 1.2: Create customer_interactions table** (depends on customers table)
4. **Task 1.3: Create customer_audit_log table** (depends on customers table)

Alternatively, all scripts can be run in any order since the IF NOT EXISTS clauses handle dependencies gracefully.

**Total execution time**: < 1 second for all 4 tables

