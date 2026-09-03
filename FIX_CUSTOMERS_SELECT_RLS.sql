-- ============================================================================
-- FIX: Allow employees to view customers they created
-- ============================================================================

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS employees_view_assigned_customers ON public.customers;

-- Recreate: employees can see customers they created OR are assigned to
-- Admins and managers can see all customers (covered by admins_all_customers)
CREATE POLICY employees_view_customers
ON public.customers FOR SELECT
TO authenticated
USING (
  -- Admins and managers see all
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
  OR
  -- Employees see customers they created
  created_by = auth.uid()
  OR
  -- Employees see customers assigned to them
  assigned_employee_id = auth.uid()
);

-- Verify
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'customers'
ORDER BY policyname;
