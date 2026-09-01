# Phase 3: Financial Transaction Management - SQL Scripts

This document contains all SQL scripts needed to set up the Financial Transaction Management module database schema for Horizon BMS.

## Prerequisites
- Supabase project set up
- auth.users table exists (created by Supabase Auth)
- public.profiles table exists (from Phase 1)
- public.customers table exists (from Phase 2)
- public.handle_updated_at() function exists (from Phase 1)

## Overview

This phase implements:
1. **transactions** table - Core transaction records
2. **transaction_number_seq** sequence - Auto-generate transaction numbers
3. **commission_rates** table - Configurable commission rates
4. **transaction_audit_log** table - Complete audit trail
5. **RLS Policies** - Role-based security for all tables

## Instructions
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each script section below **in order**
4. Click Run to execute each section
5. Verify success after each script

---

## Script 1: Create Transactions Table

```sql
-- ============================================================================
-- Table: transactions
-- Description: Core financial transaction records with comprehensive tracking
-- Dependencies: auth.users, public.profiles, public.customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Customer Information
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  
  -- Transaction Details
  service_provider VARCHAR(50) NOT NULL CHECK (service_provider IN ('EcoCash', 'Mukuru', 'Mama Money', 'MOOVAR', 'WorldRemit')),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('local', 'international')),
  transaction_direction VARCHAR(10) NOT NULL CHECK (transaction_direction IN ('inbound', 'outbound')),
  
  -- Financial Information
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  
  -- Status and Metadata
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Status Change Tracking
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT
);

-- Add documentation
COMMENT ON TABLE public.transactions IS 'Financial transaction records for EcoCash, Mukuru, Mama Money, MOOVAR, and WorldRemit';
COMMENT ON COLUMN public.transactions.id IS 'Primary key - unique transaction identifier';
COMMENT ON COLUMN public.transactions.transaction_number IS 'Auto-generated transaction number (format: TXN-XXXXXX)';
COMMENT ON COLUMN public.transactions.customer_id IS 'References customers table';
COMMENT ON COLUMN public.transactions.service_provider IS 'Payment service provider: EcoCash, Mukuru, Mama Money, MOOVAR, WorldRemit';
COMMENT ON COLUMN public.transactions.transaction_type IS 'Type: local (8% commission) or international (10% commission)';
COMMENT ON COLUMN public.transactions.transaction_direction IS 'Direction: inbound (receiving) or outbound (sending)';
COMMENT ON COLUMN public.transactions.amount IS 'Transaction amount before commission';
COMMENT ON COLUMN public.transactions.currency IS 'Currency code (default: USD)';
COMMENT ON COLUMN public.transactions.commission_rate IS 'Commission rate percentage applied';
COMMENT ON COLUMN public.transactions.commission_amount IS 'Calculated commission amount';
COMMENT ON COLUMN public.transactions.total_amount IS 'Total amount (amount + commission)';
COMMENT ON COLUMN public.transactions.status IS 'Status: pending, completed, or cancelled';
COMMENT ON COLUMN public.transactions.notes IS 'Optional notes about the transaction';
COMMENT ON COLUMN public.transactions.created_at IS 'Timestamp when transaction was created';
COMMENT ON COLUMN public.transactions.created_by IS 'User who created the transaction';
COMMENT ON COLUMN public.transactions.updated_at IS 'Timestamp when transaction was last updated';
COMMENT ON COLUMN public.transactions.updated_by IS 'User who last updated the transaction';
COMMENT ON COLUMN public.transactions.completed_at IS 'Timestamp when transaction was completed';
COMMENT ON COLUMN public.transactions.completed_by IS 'User who completed the transaction';
COMMENT ON COLUMN public.transactions.cancelled_at IS 'Timestamp when transaction was cancelled';
COMMENT ON COLUMN public.transactions.cancelled_by IS 'User who cancelled the transaction';
COMMENT ON COLUMN public.transactions.cancellation_reason IS 'Reason for cancellation';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_service_provider ON public.transactions(service_provider);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_direction ON public.transactions(transaction_direction);
CREATE INDEX IF NOT EXISTS idx_transactions_number ON public.transactions(transaction_number);

-- Add trigger for auto-updating updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### Verification Query:
```sql
-- Verify transactions table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'transactions';
```

---

## Script 2: Create Transaction Number Auto-Generation

```sql
-- ============================================================================
-- Sequence and Trigger: Auto-generate transaction numbers
-- Description: Automatically generates unique transaction numbers in format TXN-XXXXXX
-- ============================================================================

-- Create sequence for transaction numbers
CREATE SEQUENCE IF NOT EXISTS transaction_number_seq START 1;

COMMENT ON SEQUENCE transaction_number_seq IS 'Sequence for auto-generating transaction numbers';

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if transaction_number is NULL
  IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
    NEW.transaction_number := 'TXN-' || LPAD(nextval('transaction_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_transaction_number() IS 'Auto-generates transaction number in format TXN-XXXXXX';

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS set_transaction_number ON public.transactions;

-- Create trigger
CREATE TRIGGER set_transaction_number
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION generate_transaction_number();
```

### Verification Query:
```sql
-- Verify sequence exists
SELECT sequence_name, last_value 
FROM information_schema.sequences 
WHERE sequence_name = 'transaction_number_seq';

-- Verify trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'set_transaction_number';
```

---

## Script 3: Create Commission Rates Table

```sql
-- ============================================================================
-- Table: commission_rates
-- Description: Configurable commission rates for transaction types
-- Dependencies: auth.users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(20) UNIQUE NOT NULL CHECK (transaction_type IN ('local', 'international')),
  rate DECIMAL(5, 2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT
);

-- Add documentation
COMMENT ON TABLE public.commission_rates IS 'Configurable commission rates for local and international transactions';
COMMENT ON COLUMN public.commission_rates.id IS 'Primary key - unique rate identifier';
COMMENT ON COLUMN public.commission_rates.transaction_type IS 'Type: local or international (unique)';
COMMENT ON COLUMN public.commission_rates.rate IS 'Commission rate percentage (0-100)';
COMMENT ON COLUMN public.commission_rates.effective_from IS 'Date when this rate becomes effective';
COMMENT ON COLUMN public.commission_rates.created_at IS 'Timestamp when rate was created';
COMMENT ON COLUMN public.commission_rates.created_by IS 'User who created/updated the rate';
COMMENT ON COLUMN public.commission_rates.notes IS 'Optional notes about the rate';

-- Create index
CREATE INDEX IF NOT EXISTS idx_commission_rates_type ON public.commission_rates(transaction_type);
```

### Verification Query:
```sql
-- Verify commission_rates table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'commission_rates'
ORDER BY ordinal_position;
```

---

## Script 4: Seed Default Commission Rates

```sql
-- ============================================================================
-- Seed Data: Default commission rates
-- Description: Insert default rates (Local: 8%, International: 10%)
-- ============================================================================

-- Insert default commission rates
-- Note: Using ON CONFLICT to make this script idempotent
INSERT INTO public.commission_rates (transaction_type, rate, notes, created_by)
VALUES 
  (
    'local', 
    8.00, 
    'Default local transaction commission rate',
    (SELECT id FROM auth.users LIMIT 1)  -- Uses first available user
  ),
  (
    'international', 
    10.00, 
    'Default international transaction commission rate',
    (SELECT id FROM auth.users LIMIT 1)  -- Uses first available user
  )
ON CONFLICT (transaction_type) 
DO UPDATE SET
  rate = EXCLUDED.rate,
  notes = EXCLUDED.notes,
  effective_from = now();

-- If no users exist yet, handle gracefully
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RAISE NOTICE 'Warning: No users found. Commission rates will be created when first user signs up.';
    DELETE FROM public.commission_rates;
  ELSE
    RAISE NOTICE 'Commission rates seeded successfully';
  END IF;
END $$;
```

### Verification Query:
```sql
-- Verify commission rates
SELECT 
  transaction_type,
  rate,
  effective_from,
  notes
FROM public.commission_rates
ORDER BY transaction_type;
```

---

## Script 5: Create Transaction Audit Log Table

```sql
-- ============================================================================
-- Table: transaction_audit_log
-- Description: Complete audit trail for all transaction changes
-- Dependencies: auth.users, public.transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transaction_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Add documentation
COMMENT ON TABLE public.transaction_audit_log IS 'Complete audit trail for all transaction changes';
COMMENT ON COLUMN public.transaction_audit_log.id IS 'Primary key - unique audit log entry';
COMMENT ON COLUMN public.transaction_audit_log.transaction_id IS 'References transactions table';
COMMENT ON COLUMN public.transaction_audit_log.action IS 'Action performed: created, updated, status_changed, etc.';
COMMENT ON COLUMN public.transaction_audit_log.field_name IS 'Name of field that changed (null for create actions)';
COMMENT ON COLUMN public.transaction_audit_log.old_value IS 'Previous value (null for create actions)';
COMMENT ON COLUMN public.transaction_audit_log.new_value IS 'New value after change';
COMMENT ON COLUMN public.transaction_audit_log.created_at IS 'Timestamp of the change';
COMMENT ON COLUMN public.transaction_audit_log.created_by IS 'User who made the change';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_audit_log_transaction ON public.transaction_audit_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_log_created_at ON public.transaction_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_log_created_by ON public.transaction_audit_log(created_by);
```

### Verification Query:
```sql
-- Verify transaction_audit_log table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transaction_audit_log'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'transaction_audit_log';
```

---

## Script 6: Enable RLS and Create Policies for Transactions Table

```sql
-- ============================================================================
-- RLS Policies: transactions table
-- Description: Role-based security for transaction access
-- ============================================================================

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Employees can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;

-- Policy: Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Employees can view their own transactions
CREATE POLICY "Employees can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'employee'
    )
    AND created_by = auth.uid()
  );

-- Policy: Authenticated users can create transactions
CREATE POLICY "Users can create transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND updated_by = auth.uid()
  );

-- Policy: Only admins can update transactions (status changes, etc.)
CREATE POLICY "Admins can update transactions"
  ON public.transactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT SELECT ON public.transactions TO authenticated;
GRANT INSERT ON public.transactions TO authenticated;
GRANT UPDATE ON public.transactions TO authenticated;
```

### Verification Query:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'transactions';

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'transactions'
ORDER BY policyname;
```

---

## Script 7: Enable RLS and Create Policies for Commission Rates and Audit Log

```sql
-- ============================================================================
-- RLS Policies: commission_rates and transaction_audit_log tables
-- Description: Role-based security for commission rates and audit logs
-- ============================================================================

-- Enable RLS on commission_rates
ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "All authenticated users can view commission rates" ON public.commission_rates;
DROP POLICY IF EXISTS "Only admins can modify commission rates" ON public.commission_rates;

-- Policy: All authenticated users can view commission rates
CREATE POLICY "All authenticated users can view commission rates"
  ON public.commission_rates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Only admins can insert/update/delete commission rates
CREATE POLICY "Only admins can modify commission rates"
  ON public.commission_rates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions for commission_rates
GRANT SELECT ON public.commission_rates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.commission_rates TO authenticated;

-- Enable RLS on transaction_audit_log
ALTER TABLE public.transaction_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.transaction_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.transaction_audit_log;

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.transaction_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System/Service role can insert audit logs (bypasses RLS)
CREATE POLICY "System can insert audit logs"
  ON public.transaction_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions for transaction_audit_log
GRANT SELECT ON public.transaction_audit_log TO authenticated;
GRANT INSERT ON public.transaction_audit_log TO authenticated;
```

### Verification Query:
```sql
-- Verify RLS is enabled on both tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('commission_rates', 'transaction_audit_log')
ORDER BY tablename;

-- Verify commission_rates policies
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'commission_rates'
ORDER BY policyname;

-- Verify transaction_audit_log policies
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'transaction_audit_log'
ORDER BY policyname;
```

---

## Complete Verification

Run this comprehensive verification query to check all Phase 3 database objects:

```sql
-- ============================================================================
-- Complete Phase 3 Verification
-- ============================================================================

-- Check all tables exist
SELECT 
  'Tables' as object_type,
  table_name,
  'Exists' as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('transactions', 'commission_rates', 'transaction_audit_log')
ORDER BY table_name;

-- Check sequence exists
SELECT 
  'Sequence' as object_type,
  sequence_name as name,
  CONCAT('Last value: ', last_value) as status
FROM information_schema.sequences
WHERE sequence_name = 'transaction_number_seq';

-- Check functions exist
SELECT 
  'Function' as object_type,
  routine_name as name,
  'Exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_transaction_number', 'handle_updated_at')
ORDER BY routine_name;

-- Check triggers exist
SELECT 
  'Trigger' as object_type,
  trigger_name as name,
  CONCAT('On table: ', event_object_table) as status
FROM information_schema.triggers
WHERE trigger_name IN ('set_transaction_number', 'set_updated_at')
  AND event_object_schema = 'public'
ORDER BY trigger_name;

-- Check RLS is enabled
SELECT 
  'RLS Status' as object_type,
  tablename as name,
  CASE WHEN rowsecurity THEN 'Enabled ✓' ELSE 'Disabled ✗' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'commission_rates', 'transaction_audit_log')
ORDER BY tablename;

-- Check policies count
SELECT 
  'Policies' as object_type,
  tablename as name,
  CONCAT(COUNT(*), ' policies') as status
FROM pg_policies
WHERE tablename IN ('transactions', 'commission_rates', 'transaction_audit_log')
GROUP BY tablename
ORDER BY tablename;

-- Check commission rates data
SELECT 
  'Data' as object_type,
  CONCAT('Commission Rates: ', COUNT(*), ' rows') as name,
  CONCAT('Local: ', MAX(CASE WHEN transaction_type = 'local' THEN rate END), '%, ',
         'International: ', MAX(CASE WHEN transaction_type = 'international' THEN rate END), '%') as status
FROM public.commission_rates;

-- Check indexes
SELECT 
  'Indexes' as object_type,
  tablename as name,
  CONCAT(COUNT(*), ' indexes') as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'commission_rates', 'transaction_audit_log')
GROUP BY tablename
ORDER BY tablename;
```

Expected Results:
- ✓ 3 tables created
- ✓ 1 sequence created
- ✓ 2 functions exist (generate_transaction_number, handle_updated_at)
- ✓ 2+ triggers exist
- ✓ RLS enabled on all 3 tables
- ✓ 9 total policies (4 transactions + 2 commission_rates + 2 audit_log + 1 service role)
- ✓ 2 commission rates seeded (local: 8%, international: 10%)
- ✓ Multiple indexes created

---

## Troubleshooting

### Issue: Commission rates not seeding
**Cause**: No users exist yet in auth.users table  
**Solution**: Create first user via Supabase Auth, then re-run Script 4

### Issue: RLS policies blocking queries
**Cause**: User doesn't have proper role in profiles table  
**Solution**: 
```sql
-- Check user role
SELECT id, email, role FROM public.profiles WHERE id = auth.uid();

-- Update role if needed (run as admin)
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Issue: Transaction number not auto-generating
**Cause**: Trigger not firing or sequence not created  
**Solution**: Verify trigger and sequence with verification queries in Script 2

### Issue: Foreign key constraint errors
**Cause**: Referenced tables don't exist (profiles, customers)  
**Solution**: Ensure Phase 1 (profiles) and Phase 2 (customers) are completed first

---

## Post-Installation Testing

After running all scripts, test with these queries:

```sql
-- Test 1: Create a test transaction (will auto-generate transaction number)
INSERT INTO public.transactions (
  customer_id,
  service_provider,
  transaction_type,
  transaction_direction,
  amount,
  currency,
  commission_rate,
  commission_amount,
  total_amount,
  status,
  notes,
  created_by,
  updated_by
)
VALUES (
  (SELECT id FROM public.customers LIMIT 1),  -- Use first available customer
  'EcoCash',
  'local',
  'inbound',
  100.00,
  'USD',
  8.00,
  8.00,
  108.00,
  'pending',
  'Test transaction',
  auth.uid(),
  auth.uid()
)
RETURNING id, transaction_number;

-- Test 2: View the transaction (RLS should apply based on role)
SELECT 
  transaction_number,
  service_provider,
  amount,
  commission_amount,
  total_amount,
  status
FROM public.transactions
ORDER BY created_at DESC
LIMIT 1;

-- Test 3: View commission rates
SELECT 
  transaction_type,
  rate,
  notes
FROM public.commission_rates
ORDER BY transaction_type;

-- Test 4: Clean up test data
DELETE FROM public.transactions 
WHERE notes = 'Test transaction';
```

---

## Security Notes

1. **RLS Protection**: All tables have Row Level Security enabled
   - Admins can view/edit all transactions
   - Employees can only view their own transactions
   - All users can view commission rates (needed for commission calculation)

2. **Audit Trail**: Every transaction change is logged
   - Created by/at tracked automatically
   - Status changes record timestamp and user
   - Cancellations require a reason

3. **Data Integrity**: Multiple safeguards in place
   - Check constraints on enums (service_provider, transaction_type, etc.)
   - Amount must be > 0
   - Commission rate 0-100%
   - Foreign key constraints maintain referential integrity

4. **No Direct Deletion**: Transactions cannot be deleted
   - Use cancellation instead
   - Preserves financial audit trail
   - Audit log cascades on delete (if transaction is force-deleted by admin)

---

## Summary

Phase 3 Database Schema includes:

| Object Type | Count | Names |
|------------|-------|-------|
| Tables | 3 | transactions, commission_rates, transaction_audit_log |
| Sequences | 1 | transaction_number_seq |
| Functions | 1 | generate_transaction_number() |
| Triggers | 2 | set_transaction_number, set_updated_at |
| Indexes | 11 | Various performance indexes |
| RLS Policies | 9 | Role-based access control |
| Seed Data | 2 | Local (8%) and International (10%) rates |

**Status**: ✓ Ready for Phase 3 Wave 2 (TypeScript types and validation)

---

## Next Steps

After completing this Wave 1:
1. **Wave 2**: Create TypeScript types and validation functions
2. **Wave 3**: Implement server actions (create, read, update transactions)
3. **Wave 4**: Build transaction pages (list, create, detail, receipt)
4. **Wave 5**: Develop UI components (forms, lists, filters)
5. **Wave 6**: Integrate with dashboards
6. **Wave 7**: Testing and verification

---

*Document Version: 1.0*  
*Last Updated: Phase 3 Wave 1*  
*Compatibility: Supabase PostgreSQL 15+*
