# 🎉 SAMPLE DATA INSERTED - ZIMBABWEAN CONTEXT

## Overview
Two SQL files have been created with realistic Zimbabwean sample data for your Define Horizon Business Management System.

---

## 📁 Files Created

### 1. `INSERT_SAMPLE_DATA.sql` (RECOMMENDED - Automatic)
**Easiest to use** - Automatically detects your admin user ID and inserts all data.

**How to use:**
1. Open Supabase SQL Editor
2. Copy and paste the entire file
3. Click "Run"
4. Done! ✅

### 2. `SAMPLE_DATA_ZIMBABWE.sql` (Manual)
Requires you to manually replace `YOUR_USER_ID_HERE` with your actual user ID.

---

## 📊 Sample Data Included

### ✅ 10 Customers (Zimbabwean names & details)

**Individual Customers:**
- Tanaka Moyo - +263772123456 (Harare)
- Chipo Mutasa - +263712345678 (Bulawayo)
- Tendai Ncube - +263773456789 (Mutare)
- Rumbidzai Khumalo - +263714567890 (Gweru)
- Farai Sibanda - +263775678901 (Harare)
- Dr. Kudakwashe Mapfumo - +263772987654 (Harare - VIP)
- Mrs. Nyasha Dube - +263713456789 (Harare - VIP)

**Business Customers:**
- Simba Manufacturing (Pvt) Ltd - Willowvale, Harare
- Zimbabwe Retail Solutions - Bulawayo
- Harare Tech Hub - Mount Pleasant, Harare

---

### ✅ 11 Products (Multiple Categories)

**Electronics:**
- Samsung Galaxy A54 5G - $450.00
- HP Pavilion Laptop - $850.00
- JBL Bluetooth Speaker - $120.00

**Appliances:**
- Defy Chest Freezer - $380.00
- LG Microwave Oven - $150.00

**Furniture:**
- 3-Seater Leather Sofa - $650.00
- King Size Bed Frame - $420.00

**Clothing:**
- Mens Formal Suit - $180.00
- Ladies Designer Dress - $95.00

**Groceries:**
- Rice 10kg Bag - $12.50
- Cooking Oil 5L - $8.75

---

### ✅ 4 Announcements

1. **Welcome to Define Horizon BMS** (High Priority, Published)
2. **System Training Sessions** (High Priority, Published)
3. **New Commission Rates** (Medium Priority, Published)
4. **Holiday Schedule** (Low Priority, Draft)

---

### ✅ 7 System Settings

- Company Name: Define Horizon Business Management
- Company Phone: +263242123456
- Company Email: info@definehorizon.co.zw
- Company Address: 123 Enterprise Road, Harare, Zimbabwe
- Currency: USD
- Tax Rate: 15%
- Low Stock Alert: Enabled

---

## 🚀 How to Insert Sample Data

### Step 1: Open Supabase SQL Editor
Go to your Supabase dashboard:
https://guarpufcluabouzfabyw.supabase.co

Click **SQL Editor** in the left sidebar

### Step 2: Run the SQL Script
1. Open `INSERT_SAMPLE_DATA.sql` (the automated version)
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Data Inserted
You should see output like:
```
Inserted 10 customers
Inserted 11 products
Inserted 4 announcements
Inserted 7 system settings
```

And verification tables showing counts.

### Step 4: View in Your Dashboard
1. Go to http://localhost:3000
2. Login as admin
3. Navigate to:
   - **Customers** page - See all 10 customers
   - **Products** page - See all 11 products
   - **Announcements** page - See 4 announcements
   - **Settings** page - See system settings

---

## 🎯 What You Can Do Now

### Test Customer Management
- View customer list with Zimbabwean names
- Click on "Tanaka Moyo" to see customer details
- Edit customer information
- Add new interactions/notes

### Test Product Management
- Browse products by category
- Check stock levels
- Adjust stock quantities
- Create new products

### Test Transactions (Coming Next)
- Create transactions for customers
- Select products from inventory
- Calculate commissions
- View transaction history

### Test Announcements
- View published announcements
- Create new announcements
- Change priority levels

### Test Settings
- Update company information
- Change tax rates
- Toggle settings

---

## ✅ Both Branches Updated

All changes committed and pushed to:
- ✅ **master** branch
- ✅ **main** branch

---

## 🔧 Troubleshooting

**If you get "No admin user found" error:**
1. First run `COMPLETE_FIX_ALL_ISSUES.sql` to assign yourself admin role
2. Then run `INSERT_SAMPLE_DATA.sql`

**If you want to remove all sample data:**
```sql
DELETE FROM public.customers WHERE email LIKE ''%@gmail.com'' OR email LIKE ''%@yahoo.com'';
DELETE FROM public.products WHERE supplier LIKE ''%Zimbabwe'';
DELETE FROM public.announcements WHERE title LIKE ''%Horizon%'';
DELETE FROM public.system_settings WHERE setting_key LIKE ''company_%'';
```

**If you want to insert more data:**
- Just modify `INSERT_SAMPLE_DATA.sql` and add more rows
- Keep the Zimbabwean context (names, phone numbers, addresses)

---

## 📞 Zimbabwean Phone Number Format

All phone numbers follow the format:
- **Mobile:** +263 7X XXX XXXX
  - Econet: +263 77 or +263 78
  - NetOne: +263 71
  - Telecel: +263 73
- **Landline:** +263 24 (Harare), +263 29 (Bulawayo)

---

## 🎊 Success!

Your Define Horizon BMS now has realistic sample data to test with. Enjoy exploring the system!
