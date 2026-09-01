-- ============================================================================
-- FIX CUSTOMERS TABLE COLUMN MISMATCH
-- The code expects first_name, last_name, business_name, phone
-- But fresh database has customer_name, phone_number
-- ============================================================================

-- Option 1: Update query in code to use correct column names
-- (This is handled in TypeScript fix)

-- Option 2: Make sure user_roles doesn't exist and we use profiles instead
-- Check if user_roles table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') 
    THEN 'user_roles table EXISTS - may cause issues'
    ELSE 'user_roles table does NOT exist - using profiles table (correct)'
  END as status;

-- The fresh database uses 'profiles' table, not 'user_roles'
-- So the TypeScript code needs to be updated

-- Verify profiles table structure
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Verify customers table structure  
SELECT column_name, data_type
FROM information_schema.columns  
WHERE table_name = 'customers'
ORDER BY ordinal_position;
