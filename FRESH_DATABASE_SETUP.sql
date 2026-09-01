-- ============================================================================
-- DEFINE HORIZON BMS - COMPLETE DATABASE SETUP (FRESH START)
-- ============================================================================
-- This script sets up a BRAND NEW database from scratch
-- Includes: Tables, RLS Policies, Triggers, Functions, Indexes, Sample Data
-- Run this on a fresh Supabase project
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE ALL TABLES
-- ============================================================================

-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  id_number TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  customer_type TEXT NOT NULL DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business')),
  assigned_employee_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_employee ON public.customers(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone_number);

-- 3. PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  selling_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  supplier TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON public.products(quantity);

-- 4. TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('local', 'international')),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  service_provider TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  payment_method TEXT NOT NULL,
  reference_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 5. CUSTOMER INTERACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_interactions_customer ON public.customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.customer_interactions(created_at DESC);

-- 6. ANNOUNCEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  publish_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON public.announcements(publish_date);

-- 7. SYSTEM SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.system_settings(setting_key);

-- 8. COMMISSION RATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT UNIQUE NOT NULL CHECK (transaction_type IN ('local', 'international')),
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_commission_rates_type ON public.commission_rates(transaction_type);

-- ============================================================================
-- PART 2: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'employee',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 3: CREATE TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at on profiles
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Auto-update updated_at on customers
CREATE TRIGGER set_updated_at_customers
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Auto-update updated_at on products
CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 4: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: CREATE RLS POLICIES - PROFILES
-- ============================================================================

-- Service role has full access
CREATE POLICY service_role_all_profiles
ON public.profiles FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Users can read any profile (needed for app)
CREATE POLICY users_select_profiles
ON public.profiles FOR SELECT
TO authenticated, anon
USING (true);

-- Anyone can insert profiles (needed for signup)
CREATE POLICY users_insert_profiles
ON public.profiles FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY users_update_own_profile
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY admins_update_all_profiles
ON public.profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PART 6: CREATE RLS POLICIES - CUSTOMERS
-- ============================================================================

-- Service role full access
CREATE POLICY service_role_all_customers
ON public.customers FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Admins can do everything
CREATE POLICY admins_all_customers
ON public.customers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Employees can view assigned customers
CREATE POLICY employees_view_assigned_customers
ON public.customers FOR SELECT
TO authenticated
USING (
  assigned_employee_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Employees can create customers
CREATE POLICY employees_create_customers
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Employees can update assigned customers
CREATE POLICY employees_update_assigned_customers
ON public.customers FOR UPDATE
TO authenticated
USING (
  assigned_employee_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- ============================================================================
-- PART 7: CREATE RLS POLICIES - PRODUCTS
-- ============================================================================

-- Service role full access
CREATE POLICY service_role_all_products
ON public.products FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Everyone can view products
CREATE POLICY users_view_products
ON public.products FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage products
CREATE POLICY admins_manage_products
ON public.products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PART 8: CREATE RLS POLICIES - TRANSACTIONS
-- ============================================================================

-- Service role full access
CREATE POLICY service_role_all_transactions
ON public.transactions FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Admins can view all transactions
CREATE POLICY admins_view_all_transactions
ON public.transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Employees can view their own transactions
CREATE POLICY employees_view_own_transactions
ON public.transactions FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Employees can create transactions
CREATE POLICY employees_create_transactions
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  )
);

-- ============================================================================
-- PART 9: CREATE RLS POLICIES - ANNOUNCEMENTS
-- ============================================================================

-- Service role full access
CREATE POLICY service_role_all_announcements
ON public.announcements FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Everyone can view published announcements
CREATE POLICY users_view_published_announcements
ON public.announcements FOR SELECT
TO authenticated
USING (
  status = 'published' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can manage announcements
CREATE POLICY admins_manage_announcements
ON public.announcements FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PART 10: CREATE RLS POLICIES - SYSTEM SETTINGS
-- ============================================================================

-- Service role full access
CREATE POLICY service_role_all_settings
ON public.system_settings FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Everyone can view public settings
CREATE POLICY users_view_public_settings
ON public.system_settings FOR SELECT
TO authenticated
USING (
  is_public = true OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can manage settings
CREATE POLICY admins_manage_settings
ON public.system_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PART 11: CREATE RLS POLICIES - CUSTOMER INTERACTIONS
-- ============================================================================

-- Service role full access
CREATE POLICY service_role_all_interactions
ON public.customer_interactions FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Users can view interactions for customers they can access
CREATE POLICY users_view_customer_interactions
ON public.customer_interactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_id
    AND (
      c.assigned_employee_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  )
);

-- Users can create interactions
CREATE POLICY users_create_interactions
ON public.customer_interactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  )
);

-- ============================================================================
-- PART 12: CREATE RLS POLICIES - COMMISSION RATES
-- ============================================================================

-- Service role full access
CREATE POLICY service_role_all_commission_rates
ON public.commission_rates FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Everyone can view commission rates
CREATE POLICY users_view_commission_rates
ON public.commission_rates FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage commission rates
CREATE POLICY admins_manage_commission_rates
ON public.commission_rates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PART 13: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT ON public.customer_interactions TO authenticated;
GRANT SELECT ON public.announcements TO authenticated;
GRANT SELECT ON public.system_settings TO authenticated;
GRANT SELECT ON public.commission_rates TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;

-- ============================================================================
-- PART 14: INSERT DEFAULT DATA
-- ============================================================================

-- Default commission rates
INSERT INTO public.commission_rates (transaction_type, rate, notes, created_by)
SELECT 
  'local',
  2.5,
  'Default commission rate for local transactions',
  id
FROM auth.users
LIMIT 1
ON CONFLICT (transaction_type) DO NOTHING;

INSERT INTO public.commission_rates (transaction_type, rate, notes, created_by)
SELECT 
  'international',
  3.5,
  'Default commission rate for international transactions',
  id
FROM auth.users
LIMIT 1
ON CONFLICT (transaction_type) DO NOTHING;

-- ============================================================================
-- DATABASE SETUP COMPLETE!
-- ============================================================================

SELECT 'Database setup complete!' as status,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created,
       (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as rls_policies_created,
       (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers_created;
