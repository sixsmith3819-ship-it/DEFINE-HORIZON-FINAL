-- ============================================================================
-- FIX: RLS policy for customer creation by all roles
-- ============================================================================

-- Step 1: Drop all existing customer INSERT/ALL policies
DROP POLICY IF EXISTS employees_create_customers ON public.customers;
DROP POLICY IF EXISTS admins_all_customers ON public.customers;

-- Step 2: Recreate admins_all_customers WITH a proper with_check
CREATE POLICY admins_all_customers
ON public.customers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Step 3: Recreate insert policy for ALL authenticated users (no is_active check)
CREATE POLICY authenticated_users_create_customers
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Step 4: Verify
SELECT policyname, cmd, with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'customers'
ORDER BY policyname;
