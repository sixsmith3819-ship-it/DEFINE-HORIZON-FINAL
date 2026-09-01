-- ============================================================================
-- COMPLETE DATABASE SETUP - ALL TABLES + RLS POLICIES
-- Run this ONCE to create all missing tables and apply RLS
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE MISSING TABLES
-- ============================================================================

-- 1. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(20) NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_public ON public.system_settings(is_public);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  selling_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  supplier VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON public.products(quantity);

-- 3. Transaction Audit Log Table
CREATE TABLE IF NOT EXISTS public.transaction_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,
  field_name VARCHAR(100),
  previous_value TEXT,
  new_value TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_audit_transaction_id ON public.transaction_audit_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_created_at ON public.transaction_audit_log(created_at DESC);

-- 4. Commission Rates Table
CREATE TABLE IF NOT EXISTS public.commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(20) UNIQUE NOT NULL CHECK (transaction_type IN ('local', 'international')),
  rate DECIMAL(5,2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Insert default commission rates
INSERT INTO public.commission_rates (transaction_type, rate, updated_by)
SELECT 'local', 8.00, (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.commission_rates WHERE transaction_type = 'local');

INSERT INTO public.commission_rates (transaction_type, rate, updated_by)
SELECT 'international', 10.00, (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.commission_rates WHERE transaction_type = 'international');

-- ============================================================================
-- PART 2: DROP EXISTING RLS POLICIES
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
-- PART 3: ENABLE RLS ON ALL TABLES
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
-- PART 4: CREATE RLS POLICIES
-- ============================================================================

-- Profiles
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

-- Customers
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

-- Transactions
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

-- Products
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

-- Announcements
CREATE POLICY "Employees can view published announcements" ON public.announcements 
  FOR SELECT USING (
    status = 'published' 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all announcements" ON public.announcements 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- System Settings
CREATE POLICY "Anyone can view public settings" ON public.system_settings 
  FOR SELECT USING (
    is_public = true 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all settings" ON public.system_settings 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Customer Interactions
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

-- Customer Audit Log
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

-- Transaction Audit Log
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

-- Commission Rates
CREATE POLICY "All users can view commission rates" ON public.commission_rates 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage commission rates" ON public.commission_rates 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- PART 5: GRANT PERMISSIONS
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
-- PART 6: INSERT DEFAULT SETTINGS
-- ============================================================================

INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by)
SELECT 'commission_rate_local', '8', 'number', 'Commission rate for local transactions (%)', false, (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'commission_rate_local');

INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by)
SELECT 'commission_rate_international', '10', 'number', 'Commission rate for international transactions (%)', false, (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'commission_rate_international');

INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by)
SELECT 'low_stock_threshold_default', '10', 'number', 'Default low stock threshold for new products', false, (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'low_stock_threshold_default');

INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by)
SELECT 'company_name', 'Define Horizon', 'string', 'Company name displayed throughout the system', true, (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'company_name');

-- ============================================================================
-- COMPLETE! ALL TABLES CREATED AND RLS POLICIES APPLIED
-- ============================================================================
