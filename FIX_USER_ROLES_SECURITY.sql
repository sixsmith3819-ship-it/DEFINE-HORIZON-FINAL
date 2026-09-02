-- ============================================================================
-- FIX: Remove SECURITY DEFINER from user_roles view
-- This script removes the SECURITY DEFINER property to enforce RLS properly
-- ============================================================================

-- Drop the existing view completely
DROP VIEW IF EXISTS public.user_roles CASCADE;

-- Recreate the view WITHOUT SECURITY DEFINER
-- This ensures RLS policies are applied based on the querying user, not the view creator
CREATE VIEW public.user_roles 
WITH (security_invoker=true)
AS
SELECT 
  id as user_id, 
  role, 
  is_active, 
  created_at 
FROM public.profiles;

-- Grant permissions
GRANT SELECT ON public.user_roles TO authenticated, service_role;

-- Verify the fix
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname = 'user_roles' AND schemaname = 'public';

-- Success message
SELECT 'user_roles view recreated WITHOUT security_definer property' as status;
