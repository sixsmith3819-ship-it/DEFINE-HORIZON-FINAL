-- Add full_name column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Check users and roles
SELECT id, email, role, full_name FROM public.profiles ORDER BY created_at;

-- Assign admin to first user (uncomment):
-- UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
