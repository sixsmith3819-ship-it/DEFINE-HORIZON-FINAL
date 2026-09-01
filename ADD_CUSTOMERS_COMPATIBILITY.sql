-- ============================================================================
-- ADD COMPATIBILITY FOR CUSTOMERS MODULE
-- This adds missing columns/views so old code works with fresh database
-- ============================================================================

-- PART 1: Rename phone_number to phone
ALTER TABLE public.customers 
RENAME COLUMN phone_number TO phone;

-- PART 2: Add first_name as generated column
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS first_name TEXT 
GENERATED ALWAYS AS (
  CASE 
    WHEN customer_type = 'individual' THEN customer_name
    ELSE NULL
  END
) STORED;

-- PART 3: Add last_name as generated column
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS last_name TEXT 
GENERATED ALWAYS AS ('') STORED;

-- PART 4: Add business_name as generated column
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS business_name TEXT
GENERATED ALWAYS AS (
  CASE 
    WHEN customer_type = 'business' THEN customer_name
    ELSE NULL
  END
) STORED;

-- PART 5: Create user_roles view
DROP VIEW IF EXISTS user_roles;

CREATE OR REPLACE VIEW user_roles AS
SELECT 
  id as user_id,
  role,
  is_active,
  created_at
FROM public.profiles;

GRANT SELECT ON user_roles TO authenticated, service_role;

-- PART 6: Add indexes
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON public.customers(first_name);
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON public.customers(business_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- PART 7: Verify changes
SELECT 'Compatibility Added!' as status;
SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' AND column_name IN ('phone', 'first_name', 'last_name', 'business_name');
SELECT * FROM user_roles LIMIT 1;
