-- ============================================================================
-- FIX: Allow employees to create customers
-- ============================================================================
-- Run this in Supabase SQL Editor

-- First, check what policies currently exist
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'customers';

-- Drop existing insert policy if it exists (to recreate cleanly)
DROP POLICY IF EXISTS employees_create_customers ON public.customers;
DROP POLICY IF EXISTS authenticated_insert_customers ON public.customers;

-- Create policy: ALL authenticated active users can insert customers
CREATE POLICY employees_create_customers
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  )
);

-- Verify the policy was created
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'customers'
ORDER BY policyname;
