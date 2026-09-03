-- Check if the employee profile has is_active = true
SELECT id, email, full_name, role, is_active 
FROM public.profiles
ORDER BY created_at DESC;
