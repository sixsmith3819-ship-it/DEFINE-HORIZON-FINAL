-- ============================================================================
-- DIAGNOSE USER CREATION ERROR
-- Run this first to understand what is causing the error
-- ============================================================================

-- Check 1: Does profiles table exist?
SELECT 
  'Profiles table exists' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN 'YES' ELSE 'NO - CREATE IT!' END as result;

-- Check 2: What columns does profiles table have?
SELECT 
  'Column: ' || column_name as check_name,
  data_type as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check 3: Are there any triggers on auth.users?
SELECT 
  'Trigger: ' || trigger_name as check_name,
  action_statement as result
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Check 4: What are the RLS policies on profiles?
SELECT 
  'Policy: ' || policyname as check_name,
  cmd || ' - ' || qual::text as result
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check 5: Try to manually insert a test profile (will show the actual error)
-- DO $$
-- DECLARE
--   test_user_id UUID := gen_random_uuid();
-- BEGIN
--   INSERT INTO public.profiles (id, email, role, is_active)
--   VALUES (test_user_id, 'test@example.com', 'employee', true);
--   
--   RAISE NOTICE 'Test profile inserted successfully!';
--   
--   -- Clean up test
--   DELETE FROM public.profiles WHERE id = test_user_id;
-- EXCEPTION
--   WHEN OTHERS THEN
--     RAISE NOTICE 'Error: % %', SQLERRM, SQLSTATE;
-- END $$;
