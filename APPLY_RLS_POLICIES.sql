-- ============================================================================
-- COMPLETE RLS POLICIES FOR ALL TABLES
-- Safe to run multiple times - drops existing policies first
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop Existing Policies (Safe - Won't fail if they don't exist)
-- ============================================================================

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do all operations" ON public.profiles;

-- Drop existing policies for customers
DROP POLICY IF EXISTS "Users can view assigned customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update assigned customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can manage all customers" ON public.customers;

-- Drop existing policies for transactions
DROP POLICY IF EXISTS "Employees can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Employees can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;

-- Drop existing policies for products
DROP POLICY IF EXISTS "All users can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can create products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Drop existing policies for announcements
DROP POLICY IF EXISTS "Employees can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "All users can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;

-- Drop existing policies for system_settings
DROP POLICY IF EXISTS "Anyone can view public settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage all settings" ON public.system_settings;

-- Drop existing policies for customer_interactions
DROP POLICY IF EXISTS "Users view accessible interactions" ON public.customer_interactions;
DROP POLICY IF EXISTS "Users can view accessible interactions" ON public.customer_interactions;
DROP POLICY IF EXISTS "Users create interactions" ON public.customer_interactions;
DROP POLICY IF EXISTS "Users can create interactions" ON public.customer_interactions;
DROP POLICY IF EXISTS "Users update own interactions" ON public.customer_interactions;
DROP POLICY IF EXISTS "Users can update own interactions" ON public.customer_interactions;
DROP POLICY IF EXISTS "Users can soft delete interactions" ON public.customer_interactions;

-- Drop existing policies for customer_audit_log
DROP POLICY IF EXISTS "Users can view accessible audit logs" ON public.customer_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.customer_audit_log;

-- Drop existing policies for transaction_audit_log
DROP POLICY IF EXISTS "Employees can view own transaction audit logs" ON public.transaction_audit_log;
DROP POLICY IF EXISTS "Admins can view all transaction audit logs" ON public.transaction_audit_log;
DROP POLICY IF EXISTS "System can insert transaction audit logs" ON public.transaction_audit_log;

-- Drop existing policies for commission_rates
DROP POLICY IF EXISTS "All users can view commission rates" ON public.commission_rates;
DROP POLICY IF EXISTS "Admins can manage commission rates" ON public.commission_rates;

-- ============================================================================
-- STEP 2: Enable RLS on All Tables
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create Fresh Policies
-- ============================================================================

-- 3.1 Profiles Table
CREATE POLICY "Users can read own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3.2 Customers Table
CREATE POLICY "Users can view assigned customers" ON public.customers 
  FOR SELECT USING (
    assigned_employee_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view all customers" ON public.customers 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create customers" ON public.customers 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update assigned customers" ON public.customers 
  FOR UPDATE USING (
    assigned_employee_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all customers" ON public.customers 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3.3 Transactions Table
CREATE POLICY "Employees can view own transactions" ON public.transactions 
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can view all transactions" ON public.transactions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Employees can create transactions" ON public.transactions 
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update transactions" ON public.transactions 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete transactions" ON public.transactions 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3.4 Products Table
CREATE POLICY "All users can view products" ON public.products 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create products" ON public.products 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update products" ON public.products 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete products" ON public.products 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3.5 Announcements Table
CREATE POLICY "Employees can view published announcements" ON public.announcements 
  FOR SELECT USING (
    status = 'published' 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all announcements" ON public.announcements 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3.6 System Settings Table
CREATE POLICY "Anyone can view public settings" ON public.system_settings 
  FOR SELECT USING (
    is_public = true 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all settings" ON public.system_settings 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3.7 Customer Interactions Table
CREATE POLICY "Users view accessible interactions" ON public.customer_interactions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.id = customer_interactions.customer_id 
      AND (
        c.assigned_employee_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    )
  );

CREATE POLICY "Users create interactions" ON public.customer_interactions 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.id = customer_interactions.customer_id 
      AND (
        c.assigned_employee_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    )
  );

CREATE POLICY "Users update own interactions" ON public.customer_interactions 
  FOR UPDATE USING (
    created_by = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3.8 Customer Audit Log Table
CREATE POLICY "Users can view accessible audit logs" ON public.customer_audit_log 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.id = customer_audit_log.customer_id 
      AND (
        c.assigned_employee_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    )
  );

CREATE POLICY "System can insert audit logs" ON public.customer_audit_log 
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- 3.9 Transaction Audit Log Table
CREATE POLICY "Employees can view own transaction audit logs" ON public.transaction_audit_log 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_audit_log.transaction_id 
      AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transaction audit logs" ON public.transaction_audit_log 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert transaction audit logs" ON public.transaction_audit_log 
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- 3.10 Commission Rates Table
CREATE POLICY "All users can view commission rates" ON public.commission_rates 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage commission rates" ON public.commission_rates 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- STEP 4: Grant Permissions to Authenticated Role
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customer_interactions TO authenticated;
GRANT SELECT, INSERT ON public.customer_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT ON public.transaction_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_rates TO authenticated;

-- ============================================================================
-- STEP 5: Verification Queries (Run these separately to check)
-- ============================================================================

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN (
--     'profiles', 'customers', 'customer_interactions', 'customer_audit_log',
--     'transactions', 'transaction_audit_log', 'products', 
--     'announcements', 'system_settings', 'commission_rates'
--   )
-- ORDER BY tablename;

-- View all policies created
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- ============================================================================
-- DONE! All RLS policies applied successfully
-- ============================================================================
