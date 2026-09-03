-- Check RLS policies on customers table
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public' 
    AND tablename = 'customers'
ORDER BY 
    policyname;
