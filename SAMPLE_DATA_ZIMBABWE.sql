-- ============================================================================
-- SAMPLE DATA FOR DEFINE HORIZON BUSINESS MANAGEMENT SYSTEM
-- Zimbabwean context with realistic names, phone numbers, and transactions
-- ============================================================================

-- IMPORTANT: Run this AFTER you have at least one admin user created
-- This script assumes you have a user profile to reference as created_by

-- ============================================================================
-- PART 1: GET YOUR USER ID (You'll need this)
-- ============================================================================

-- First, find your user ID to use as created_by
SELECT 
  id as your_user_id,
  email,
  role,
  'Copy this ID and replace YOUR_USER_ID_HERE in the INSERT statements below' as instruction
FROM public.profiles
WHERE role = 'admin'
LIMIT 1;

-- ============================================================================
-- PART 2: SAMPLE CUSTOMERS (Zimbabwean names and phone numbers)
-- ============================================================================

-- Replace YOUR_USER_ID_HERE with your actual user ID from Part 1

INSERT INTO public.customers (
  customer_name,
  phone_number,
  email,
  id_number,
  address,
  status,
  customer_type,
  assigned_employee_id,
  created_by
) VALUES
-- Active Individual Customers
(
  'Tanaka Moyo',
  '+263772123456',
  'tanaka.moyo@gmail.com',
  '63-1234567-A-12',
  '123 Samora Machel Avenue, Harare',
  'active',
  'individual',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'Chipo Mutasa',
  '+263712345678',
  'chipo.mutasa@yahoo.com',
  '63-2345678-B-23',
  '45 Robert Mugabe Road, Bulawayo',
  'active',
  'individual',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'Tendai Ncube',
  '+263773456789',
  'tendai.ncube@gmail.com',
  '63-3456789-C-34',
  '78 Herbert Chitepo Street, Mutare',
  'active',
  'individual',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'Rumbidzai Khumalo',
  '+263714567890',
  'rumbi.khumalo@outlook.com',
  '63-4567890-D-45',
  '12 Josiah Tongogara Avenue, Gweru',
  'active',
  'individual',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'Farai Sibanda',
  '+263775678901',
  'farai.sibanda@gmail.com',
  '63-5678901-E-56',
  '89 Julius Nyerere Way, Harare',
  'active',
  'individual',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),

-- Business Customers
(
  'Simba Manufacturing (Pvt) Ltd',
  '+263242123456',
  'info@simbamanufacturing.co.zw',
  'REG-12345-ZW',
  '234 Industrial Sites, Willowvale, Harare',
  'active',
  'business',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'Zimbabwe Retail Solutions',
  '+263292234567',
  'contact@zimretail.co.zw',
  'REG-23456-ZW',
  '56 Fife Street, Bulawayo',
  'active',
  'business',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'Harare Tech Hub',
  '+263242345678',
  'admin@hararetechhub.co.zw',
  'REG-34567-ZW',
  '12 Sam Nujoma Street, Mount Pleasant, Harare',
  'active',
  'business',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),

-- VIP Customers
(
  'Dr. Kudakwashe Mapfumo',
  '+263772987654',
  'dr.mapfumo@medicalcenter.co.zw',
  '63-6789012-F-67',
  '45 Borrowdale Road, Harare',
  'active',
  'individual',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'Mrs. Nyasha Dube',
  '+263713456789',
  'nyasha.dube@corporate.co.zw',
  '63-7890123-G-78',
  '78 Avondale Drive, Harare',
  'active',
  'individual',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
);

-- ============================================================================
-- PART 3: SAMPLE PRODUCTS
-- ============================================================================

INSERT INTO public.products (
  product_name,
  category,
  brand,
  model,
  selling_price,
  cost_price,
  quantity,
  low_stock_threshold,
  supplier,
  status,
  created_by,
  updated_by
) VALUES
-- Electronics
(
  'Samsung Galaxy A54 5G',
  'electronics',
  'Samsung',
  'A54',
  450.00,
  380.00,
  25,
  5,
  'Tech Distributors Zimbabwe',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'HP Pavilion Laptop',
  'electronics',
  'HP',
  'Pavilion 15',
  850.00,
  720.00,
  15,
  3,
  'Computer World Harare',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'JBL Bluetooth Speaker',
  'electronics',
  'JBL',
  'Flip 6',
  120.00,
  95.00,
  40,
  10,
  'Audio Solutions ZW',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),

-- Appliances
(
  'Defy Chest Freezer',
  'appliances',
  'Defy',
  'CF210',
  380.00,
  310.00,
  12,
  3,
  'Home Appliances Zimbabwe',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'LG Microwave Oven',
  'appliances',
  'LG',
  'MS2535GIS',
  150.00,
  120.00,
  20,
  5,
  'Home Appliances Zimbabwe',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),

-- Furniture
(
  '3-Seater Leather Sofa',
  'furniture',
  'Comfort Living',
  'CL-3S-2024',
  650.00,
  480.00,
  8,
  2,
  'Furniture Manufacturers Bulawayo',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'King Size Bed Frame',
  'furniture',
  'Sleep Haven',
  'KSB-001',
  420.00,
  320.00,
  10,
  2,
  'Furniture Manufacturers Bulawayo',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),

-- Clothing
(
  'Mens Formal Suit',
  'clothing',
  'Executive Wear',
  'EW-MS-001',
  180.00,
  130.00,
  30,
  8,
  'Textile Traders Harare',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'Ladies Designer Dress',
  'clothing',
  'Fashion Hub',
  'FH-LD-2024',
  95.00,
  65.00,
  45,
  10,
  'Textile Traders Harare',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),

-- Groceries
(
  'Rice 10kg Bag',
  'groceries',
  'Zimbabwe Grain',
  'ZG-R-10KG',
  12.50,
  9.00,
  150,
  30,
  'Wholesale Grocers Harare',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
),
(
  'Cooking Oil 5L',
  'groceries',
  'Pure Oil',
  'PO-5L',
  8.75,
  6.50,
  200,
  40,
  'Wholesale Grocers Harare',
  'active',
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE'
);

-- ============================================================================
-- PART 4: SAMPLE ANNOUNCEMENTS
-- ============================================================================

INSERT INTO public.announcements (
  title,
  content,
  priority,
  status,
  publish_date,
  expiry_date,
  created_by
) VALUES
(
  'Welcome to Define Horizon BMS',
  'We are excited to launch our new Business Management System. This platform will streamline all our operations including customer management, transactions, inventory, and analytics. Please familiarize yourself with the system features.',
  'high',
  'published',
  NOW(),
  NOW() + INTERVAL ''30 days'',
  'YOUR_USER_ID_HERE'
),
(
  'System Training Sessions - January 2024',
  'Mandatory training sessions for all employees will be held next week. Monday: Customer Management, Wednesday: Transaction Processing, Friday: Inventory & Reports. Attendance is required.',
  'high',
  'published',
  NOW(),
  NOW() + INTERVAL ''14 days'',
  'YOUR_USER_ID_HERE'
),
(
  'New Commission Rates Effective Immediately',
  'Please note the updated commission structure: Local transactions - 2.5%, International transactions - 3.5%. These rates apply to all transactions processed from today onwards.',
  'medium',
  'published',
  NOW(),
  NOW() + INTERVAL ''60 days'',
  'YOUR_USER_ID_HERE'
),
(
  'Holiday Schedule - December 2024',
  'The office will be closed from December 24th to January 2nd for the holiday season. Emergency contact numbers will be shared via email. Have a wonderful festive season!',
  'low',
  'draft',
  NOW() + INTERVAL ''7 days'',
  NOW() + INTERVAL ''45 days'',
  'YOUR_USER_ID_HERE'
);

-- ============================================================================
-- PART 5: SAMPLE SYSTEM SETTINGS
-- ============================================================================

INSERT INTO public.system_settings (
  setting_key,
  setting_value,
  setting_type,
  description,
  is_public,
  updated_by
) VALUES
(
  'company_name',
  'Define Horizon Business Management',
  'string',
  'Official company name displayed across the system',
  true,
  'YOUR_USER_ID_HERE'
),
(
  'company_phone',
  '+263242123456',
  'string',
  'Main company phone number',
  true,
  'YOUR_USER_ID_HERE'
),
(
  'company_email',
  'info@definehorizon.co.zw',
  'string',
  'Main company email address',
  true,
  'YOUR_USER_ID_HERE'
),
(
  'company_address',
  '123 Enterprise Road, Harare, Zimbabwe',
  'string',
  'Physical company address',
  true,
  'YOUR_USER_ID_HERE'
),
(
  'currency',
  'USD',
  'string',
  'Primary currency for transactions',
  true,
  'YOUR_USER_ID_HERE'
),
(
  'tax_rate',
  '15',
  'number',
  'Default tax rate percentage',
  false,
  'YOUR_USER_ID_HERE'
),
(
  'low_stock_alert',
  'true',
  'boolean',
  'Enable low stock notifications',
  false,
  'YOUR_USER_ID_HERE'
);

-- ============================================================================
-- PART 6: VERIFY SAMPLE DATA INSERTED
-- ============================================================================

-- Check customers
SELECT 'Customers Inserted' as data_type, COUNT(*) as count FROM public.customers;

-- Check products
SELECT 'Products Inserted' as data_type, COUNT(*) as count FROM public.products;

-- Check announcements
SELECT 'Announcements Inserted' as data_type, COUNT(*) as count FROM public.announcements;

-- Check settings
SELECT 'Settings Inserted' as data_type, COUNT(*) as count FROM public.system_settings;

-- ============================================================================
-- INSTRUCTIONS:
-- 1. First run PART 1 to get your user ID
-- 2. Replace ALL instances of YOUR_USER_ID_HERE with your actual user ID
-- 3. Run the entire script
-- 4. Verify with PART 6 queries
-- ============================================================================

-- Sample data includes:
-- ✓ 10 Customers (Zimbabwean names, phone numbers, addresses)
-- ✓ 11 Products (Electronics, Appliances, Furniture, Clothing, Groceries)
-- ✓ 4 Announcements (High, Medium, Low priority)
-- ✓ 7 System Settings (Company info, currency, tax)

