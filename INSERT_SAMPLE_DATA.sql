-- ============================================================================
-- SAMPLE DATA - AUTOMATED VERSION (Corrected)
-- Zimbabwean context with realistic data
-- ============================================================================

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the first admin user ID
  SELECT id INTO admin_user_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found. Please create an admin user first.';
  END IF;

  -- Insert Customers
  INSERT INTO public.customers (
    customer_name, phone_number, email, id_number, address, status, customer_type, assigned_employee_id, created_by
  ) VALUES
  ('Tanaka Moyo', '+263772123456', 'tanaka.moyo@gmail.com', '63-1234567-A-12', '123 Samora Machel Avenue, Harare', 'active', 'individual', admin_user_id, admin_user_id),
  ('Chipo Mutasa', '+263712345678', 'chipo.mutasa@yahoo.com', '63-2345678-B-23', '45 Robert Mugabe Road, Bulawayo', 'active', 'individual', admin_user_id, admin_user_id),
  ('Tendai Ncube', '+263773456789', 'tendai.ncube@gmail.com', '63-3456789-C-34', '78 Herbert Chitepo Street, Mutare', 'active', 'individual', admin_user_id, admin_user_id),
  ('Rumbidzai Khumalo', '+263714567890', 'rumbi.khumalo@outlook.com', '63-4567890-D-45', '12 Josiah Tongogara Avenue, Gweru', 'active', 'individual', admin_user_id, admin_user_id),
  ('Farai Sibanda', '+263775678901', 'farai.sibanda@gmail.com', '63-5678901-E-56', '89 Julius Nyerere Way, Harare', 'active', 'individual', admin_user_id, admin_user_id),
  ('Simba Manufacturing (Pvt) Ltd', '+263242123456', 'info@simbamanufacturing.co.zw', 'REG-12345-ZW', '234 Industrial Sites, Willowvale, Harare', 'active', 'business', admin_user_id, admin_user_id),
  ('Zimbabwe Retail Solutions', '+263292234567', 'contact@zimretail.co.zw', 'REG-23456-ZW', '56 Fife Street, Bulawayo', 'active', 'business', admin_user_id, admin_user_id),
  ('Harare Tech Hub', '+263242345678', 'admin@hararetechhub.co.zw', 'REG-34567-ZW', '12 Sam Nujoma Street, Mount Pleasant, Harare', 'active', 'business', admin_user_id, admin_user_id),
  ('Dr. Kudakwashe Mapfumo', '+263772987654', 'dr.mapfumo@medicalcenter.co.zw', '63-6789012-F-67', '45 Borrowdale Road, Harare', 'active', 'individual', admin_user_id, admin_user_id),
  ('Mrs. Nyasha Dube', '+263713456789', 'nyasha.dube@corporate.co.zw', '63-7890123-G-78', '78 Avondale Drive, Harare', 'active', 'individual', admin_user_id, admin_user_id);

  RAISE NOTICE 'Inserted 10 customers';

  -- Insert Products
  INSERT INTO public.products (
    product_name, category, brand, model, selling_price, cost_price, quantity, low_stock_threshold, supplier, status, created_by, updated_by
  ) VALUES
  ('Samsung Galaxy A54 5G', 'electronics', 'Samsung', 'A54', 450.00, 380.00, 25, 5, 'Tech Distributors Zimbabwe', 'active', admin_user_id, admin_user_id),
  ('HP Pavilion Laptop', 'electronics', 'HP', 'Pavilion 15', 850.00, 720.00, 15, 3, 'Computer World Harare', 'active', admin_user_id, admin_user_id),
  ('JBL Bluetooth Speaker', 'electronics', 'JBL', 'Flip 6', 120.00, 95.00, 40, 10, 'Audio Solutions ZW', 'active', admin_user_id, admin_user_id),
  ('Defy Chest Freezer', 'appliances', 'Defy', 'CF210', 380.00, 310.00, 12, 3, 'Home Appliances Zimbabwe', 'active', admin_user_id, admin_user_id),
  ('LG Microwave Oven', 'appliances', 'LG', 'MS2535GIS', 150.00, 120.00, 20, 5, 'Home Appliances Zimbabwe', 'active', admin_user_id, admin_user_id),
  ('3-Seater Leather Sofa', 'furniture', 'Comfort Living', 'CL-3S-2024', 650.00, 480.00, 8, 2, 'Furniture Manufacturers Bulawayo', 'active', admin_user_id, admin_user_id),
  ('King Size Bed Frame', 'furniture', 'Sleep Haven', 'KSB-001', 420.00, 320.00, 10, 2, 'Furniture Manufacturers Bulawayo', 'active', admin_user_id, admin_user_id),
  ('Mens Formal Suit', 'clothing', 'Executive Wear', 'EW-MS-001', 180.00, 130.00, 30, 8, 'Textile Traders Harare', 'active', admin_user_id, admin_user_id),
  ('Ladies Designer Dress', 'clothing', 'Fashion Hub', 'FH-LD-2024', 95.00, 65.00, 45, 10, 'Textile Traders Harare', 'active', admin_user_id, admin_user_id),
  ('Rice 10kg Bag', 'groceries', 'Zimbabwe Grain', 'ZG-R-10KG', 12.50, 9.00, 150, 30, 'Wholesale Grocers Harare', 'active', admin_user_id, admin_user_id),
  ('Cooking Oil 5L', 'groceries', 'Pure Oil', 'PO-5L', 8.75, 6.50, 200, 40, 'Wholesale Grocers Harare', 'active', admin_user_id, admin_user_id);

  RAISE NOTICE 'Inserted 11 products';

  -- Insert Announcements
  INSERT INTO public.announcements (
    title, content, priority, status, publish_date, expiry_date, created_by
  ) VALUES
  ('Welcome to Define Horizon BMS', 'We are excited to launch our new Business Management System. This platform will streamline all our operations.', 'high', 'published', NOW(), NOW() + INTERVAL '30 days', admin_user_id),
  ('System Training Sessions', 'Mandatory training sessions for all employees will be held next week. Attendance is required.', 'high', 'published', NOW(), NOW() + INTERVAL '14 days', admin_user_id),
  ('New Commission Rates', 'Updated commission structure: Local - 2.5%, International - 3.5%.', 'medium', 'published', NOW(), NOW() + INTERVAL '60 days', admin_user_id),
  ('Holiday Schedule', 'Office closed December 24th to January 2nd. Have a wonderful festive season!', 'low', 'draft', NOW() + INTERVAL '7 days', NOW() + INTERVAL '45 days', admin_user_id);

  RAISE NOTICE 'Inserted 4 announcements';

  -- Insert System Settings
  INSERT INTO public.system_settings (
    setting_key, setting_value, setting_type, description, is_public, updated_by
  ) VALUES
  ('company_name', 'Define Horizon Business Management', 'string', 'Official company name', true, admin_user_id),
  ('company_phone', '+263242123456', 'string', 'Main company phone', true, admin_user_id),
  ('company_email', 'info@definehorizon.co.zw', 'string', 'Main company email', true, admin_user_id),
  ('company_address', '123 Enterprise Road, Harare, Zimbabwe', 'string', 'Physical address', true, admin_user_id),
  ('currency', 'USD', 'string', 'Primary currency', true, admin_user_id),
  ('tax_rate', '15', 'number', 'Default tax rate percentage', false, admin_user_id),
  ('low_stock_alert', 'true', 'boolean', 'Enable low stock notifications', false, admin_user_id);

  RAISE NOTICE 'Inserted 7 system settings';
END $$;

-- Verify data inserted
SELECT 'Customers' as data_type, COUNT(*) as count FROM public.customers
UNION ALL
SELECT 'Products', COUNT(*) FROM public.products
UNION ALL
SELECT 'Announcements', COUNT(*) FROM public.announcements
UNION ALL
SELECT 'System Settings', COUNT(*) FROM public.system_settings;

-- Show sample customers
SELECT customer_name, phone_number, customer_type FROM public.customers LIMIT 5;

-- Show sample products
SELECT product_name, category, selling_price FROM public.products LIMIT 5;
