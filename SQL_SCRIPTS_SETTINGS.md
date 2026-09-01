# Settings Module - SQL Schema

Apply this SQL in your Supabase SQL Editor:

```sql
-- System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(20) NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_settings_key ON public.system_settings(setting_key);
CREATE INDEX idx_settings_public ON public.system_settings(is_public);

-- Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view public settings" 
  ON public.system_settings FOR SELECT 
  USING (is_public = true OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage all settings" 
  ON public.system_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Grants
GRANT SELECT ON public.system_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by)
SELECT 
  'commission_rate_local', 
  '8', 
  'number', 
  'Commission rate for local transactions (%)', 
  false,
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'commission_rate_local');

INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by)
SELECT 
  'commission_rate_international', 
  '10', 
  'number', 
  'Commission rate for international transactions (%)', 
  false,
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'commission_rate_international');

INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by)
SELECT 
  'low_stock_threshold_default', 
  '10', 
  'number', 
  'Default low stock threshold for new products', 
  false,
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'low_stock_threshold_default');

INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by)
SELECT 
  'company_name', 
  'Define Horizon', 
  'string', 
  'Company name displayed throughout the system', 
  true,
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE setting_key = 'company_name');
```

**After applying, type: "i have applied the sql, you can continue"**
