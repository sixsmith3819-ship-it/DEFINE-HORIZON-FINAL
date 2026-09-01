# Wave 8: Manual E2E Verification Checklist
## Horizon BMS - Customer Management Module

**Date:** 2026-09-01
**Tester:** _____________
**Environment:** Development

---

## Pre-Test Setup

- [ ] Database migrations executed successfully
- [ ] Dev server running (\
pm run dev\)
- [ ] Test user accounts created:
  - [ ] Admin user
  - [ ] Manager user  
  - [ ] Employee user (with assigned customers)
- [ ] Browser DevTools open (for debugging)

---

## Test 8.1: Database Setup and RLS Verification ✅

**Status:** COMPLETE (executed during implementation)
- ✅ All tables created
- ✅ RLS policies configured
- ✅ Indexes created
- ✅ CHECK constraints working

---

## Test 8.2: Create Individual Customer

**Objective:** Verify full create flow for individual customer

### Steps:
1. [ ] Navigate to \/customers\
2. [ ] Click "New Customer" button
3. [ ] Select "Individual" customer type
4. [ ] Fill in required fields:
   - [ ] First Name: "John"
   - [ ] Last Name: "Doe"
   - [ ] Email: "john.doe@test.com"
   - [ ] Phone: "555-0100"
   - [ ] Address: "123 Test St"
5. [ ] Fill optional fields:
   - [ ] Date of Birth: "1990-01-01"
6. [ ] Click "Create Customer"

### Expected Results:
- [ ] Redirect to customer detail page
- [ ] Customer appears in list with "Individual" badge
- [ ] All fields saved correctly
- [ ] Status badge shows "Active"
- [ ] Created timestamp visible
- [ ] Audit log has "create" entry

**Actual Results:**
_____________________________________________________________

**Pass/Fail:** ________

---

## Test 8.3: Create Business Customer

**Objective:** Verify full create flow for business customer

### Steps:
1. [ ] Navigate to \/customers\
2. [ ] Click "New Customer"  
3. [ ] Select "Business" customer type
4. [ ] Fill in required fields:
   - [ ] Business Name: "Acme Corp"
   - [ ] Contact Person: "Jane Smith"
   - [ ] Business Registration: "BR123456"
   - [ ] Email: "contact@acme.com"
   - [ ] Phone: "555-0200"
   - [ ] Address: "456 Business Ave"
5. [ ] Fill optional fields:
   - [ ] Tax ID: "TAX789"
   - [ ] Website: "https://acme.com"
6. [ ] Click "Create Customer"

### Expected Results:
- [ ] Redirect to customer detail page
- [ ] Customer appears with "Business" badge
- [ ] All fields saved correctly
- [ ] Status badge shows "Active"

**Actual Results:**
_____________________________________________________________

**Pass/Fail:** ________

---

## Test 8.4: Role-Based Access Control

**Objective:** Verify permissions work for each role

### Test 8.4.1: Admin Access
1. [ ] Login as Admin
2. [ ] Navigate to \/customers\
3. [ ] Verify: Can see all customers
4. [ ] Click on any customer
5. [ ] Verify: Can edit customer
6. [ ] Verify: "Delete" button visible
7. [ ] Verify: Audit log section visible

**Expected:** Full CRUD access
**Actual:** _____________________________________________________________
**Pass/Fail:** ________

### Test 8.4.2: Manager Access
1. [ ] Login as Manager
2. [ ] Navigate to \/customers\
3. [ ] Verify: Can see all customers
4. [ ] Verify: Can create new customer
5. [ ] Verify: Can edit existing customer
6. [ ] Verify: Audit log section visible

**Expected:** Full CRUD access
**Actual:** _____________________________________________________________
**Pass/Fail:** ________

### Test 8.4.3: Employee Access
1. [ ] Login as Employee
2. [ ] Navigate to \/customers\
3. [ ] Verify: Only assigned customers visible
4. [ ] Click on assigned customer
5. [ ] Verify: Cannot see "Edit" button
6. [ ] Verify: Cannot see "Delete" button
7. [ ] Verify: Can add notes only
8. [ ] Verify: Audit log section NOT visible

**Expected:** View + add note only for assigned
**Actual:** _____________________________________________________________
**Pass/Fail:** ________

### Test 8.4.4: Employee Create Denied
1. [ ] As Employee, try to access \/customers/new\
2. [ ] Verify: Permission denied error

**Expected:** Access denied
**Actual:** _____________________________________________________________
**Pass/Fail:** ________

---

## Test 8.5: Search, Filter, Sort

**Objective:** Verify all search/filter/sort combinations work

### Test 8.5.1: Search Functionality
1. [ ] Navigate to \/customers\
2. [ ] Type "john" in search box
3. [ ] Wait 300ms for debounce
4. [ ] Verify: Only matching customers shown
5. [ ] Verify: URL updated with \?search=john\
6. [ ] Test search by: first name, last name, email, phone, company
7. [ ] Clear search
8. [ ] Verify: All customers return

**Pass/Fail:** ________

### Test 8.5.2: Status Filter
1. [ ] Click "Filters" button
2. [ ] Select "Status: Active"
3. [ ] Verify: Only active customers shown
4. [ ] Verify: URL updated with \?status=active\
5. [ ] Change to "Status: Inactive"
6. [ ] Verify: Only inactive customers shown
7. [ ] Select "All Statuses"
8. [ ] Verify: All customers return

**Pass/Fail:** ________

### Test 8.5.3: Customer Type Filter
1. [ ] Select "Type: Individual"
2. [ ] Verify: Only individual customers shown
3. [ ] Verify: URL updated with \?type=individual\
4. [ ] Change to "Type: Business"
5. [ ] Verify: Only business customers shown

**Pass/Fail:** ________

### Test 8.5.4: Date Range Filter
1. [ ] Set "Created After: 2024-01-01"
2. [ ] Set "Created Before: 2024-12-31"
3. [ ] Verify: Only customers in range shown
4. [ ] Verify: URL updated with date parameters

**Pass/Fail:** ________

### Test 8.5.5: Sort Functionality
1. [ ] Select "Sort: Name (A-Z)"
2. [ ] Verify: Customers sorted alphabetically ascending
3. [ ] Verify: Sort indicator (↑) visible on Name column
4. [ ] Select "Sort: Name (Z-A)"
5. [ ] Verify: Order reversed
6. [ ] Test sorting by: email, created date, status
7. [ ] Verify: Each sort maintains correct order

**Pass/Fail:** ________

### Test 8.5.6: Combined Filters
1. [ ] Apply: search="test" + status="active" + type="individual"
2. [ ] Verify: Only records matching ALL filters shown
3. [ ] Verify: URL contains all parameters
4. [ ] Clear all filters
5. [ ] Verify: All customers return

**Pass/Fail:** ________

---

## Test 8.6: Pagination

**Objective:** Verify pagination with 60+ customers

### Prerequisites:
- [ ] Create 60+ test customers (or use script to seed data)

### Steps:
1. [ ] Navigate to \/customers\
2. [ ] Verify: "Showing 1-25 of X customers" displayed
3. [ ] Verify: Page 1 has exactly 25 customers
4. [ ] Click "Next" button
5. [ ] Verify: Page 2 loads with different 25 customers
6. [ ] Verify: URL updated to \?page=2\
7. [ ] Navigate to page 3
8. [ ] Verify: Different set of customers
9. [ ] Click "Last" button
10. [ ] Verify: Final page has ≤25 customers
11. [ ] Verify: "Previous" button works
12. [ ] Verify: "First" button returns to page 1
13. [ ] Verify: No duplicate customers across pages

**Expected:** Pagination works correctly, no duplicates
**Actual:** _____________________________________________________________
**Pass/Fail:** ________

---

## Test 8.7: Validation Error Messages

**Objective:** Verify all validation errors display correctly

### Test 8.7.1: Invalid Email
1. [ ] Navigate to \/customers/new\
2. [ ] Enter email: "invalid" (no @)
3. [ ] Try to submit
4. [ ] Verify: Error "Invalid email format" displayed
5. [ ] Try: "user@" (no domain)
6. [ ] Verify: Same error
7. [ ] Try: "user@domain" (no extension)
8. [ ] Verify: Same error

**Pass/Fail:** ________

### Test 8.7.2: Invalid Phone
1. [ ] Enter phone: "123" (too short)
2. [ ] Try to submit
3. [ ] Verify: Error "Phone must be 10-15 digits"
4. [ ] Try: "abc-def-ghij" (invalid chars)
5. [ ] Verify: Validation error displayed

**Pass/Fail:** ________

### Test 8.7.3: Required Fields
1. [ ] Leave First Name empty (individual)
2. [ ] Try to submit
3. [ ] Verify: "First name is required" error
4. [ ] Leave all fields empty
5. [ ] Try to submit
6. [ ] Verify: All required fields flagged with errors

**Pass/Fail:** ________

---

## Test 8.8: Audit Log Completeness

**Objective:** Verify all operations create audit entries

### Steps:
1. [ ] Create customer (as Admin)
2. [ ] View detail page
3. [ ] Scroll to Audit Log section
4. [ ] Verify: "create" entry exists with timestamp and user
5. [ ] Edit customer (change email)
6. [ ] Return to detail page
7. [ ] Verify: "update" entry shows:
   - [ ] Field name: "email"
   - [ ] Previous value
   - [ ] New value
8. [ ] Assign to employee
9. [ ] Verify: "assign" entry exists
10. [ ] Soft delete customer
11. [ ] Verify: "delete" entry exists
12. [ ] Reactivate customer
13. [ ] Verify: "reactivate" entry exists
14. [ ] Try to edit audit log entry (should be impossible via UI)
15. [ ] Verify: No edit controls present

**Expected:** All operations logged, no edits allowed
**Actual:** _____________________________________________________________
**Pass/Fail:** ________

---

## Test 8.9: Responsive Design

**Objective:** Verify UI works on all device sizes

### Test 8.9.1: Desktop (1920px)
1. [ ] Resize browser to 1920px width
2. [ ] Navigate to \/customers\
3. [ ] Verify: Full table visible with all columns
4. [ ] Verify: Two-column layout on detail page
5. [ ] Verify: All buttons accessible
6. [ ] Verify: No horizontal scrolling

**Pass/Fail:** ________

### Test 8.9.2: Tablet (768px)
1. [ ] Resize browser to 768px width
2. [ ] Verify: Condensed table (some columns hidden)
3. [ ] Verify: Stacked layout on detail page
4. [ ] Verify: All content accessible
5. [ ] Verify: Buttons/inputs properly sized

**Pass/Fail:** ________

### Test 8.9.3: Mobile (375px)
1. [ ] Resize browser to 375px width  
2. [ ] Verify: Card view replaces table
3. [ ] Verify: Single column layout
4. [ ] Verify: All buttons ≥44px touch target
5. [ ] Verify: Timeline scrollable without issues
6. [ ] Verify: Form fields full width
7. [ ] Verify: No horizontal overflow
8. [ ] Test tapping all interactive elements

**Expected:** All features work on mobile
**Actual:** _____________________________________________________________
**Pass/Fail:** ________

---

## Test 8.10: Concurrent Operations

**Objective:** Test conflict handling

### Steps:
1. [ ] Open customer in two browser windows (Admin in both)
2. [ ] Edit email in Window 1, save
3. [ ] Edit phone in Window 2, save
4. [ ] Verify: Both saves succeed (no conflict)
5. [ ] Verify: Final state has both changes
6. [ ] Open same customer in two windows
7. [ ] Assign to Employee A in Window 1
8. [ ] Assign to Employee B in Window 2 (before Window 1 saves)
9. [ ] Verify: One succeeds, other fails gracefully
10. [ ] Verify: No data corruption

**Expected:** Graceful conflict handling
**Actual:** _____________________________________________________________
**Pass/Fail:** ________

---

## Test 8.11: Edge Cases

**Objective:** Verify system handles edge cases

### Test 8.11.1: Long Values
1. [ ] Create customer with 100-char first name
2. [ ] Verify: Accepted and displays correctly
3. [ ] Create customer with 255-char email
4. [ ] Verify: Accepted

**Pass/Fail:** ________

### Test 8.11.2: Duplicate Email
1. [ ] Create customer: test@example.com
2. [ ] Try to create another with same email
3. [ ] Verify: Error "Email already exists"

**Pass/Fail:** ________

### Test 8.11.3: Special Characters
1. [ ] Search with special chars: \@#\$%\
2. [ ] Verify: No errors, returns appropriate results
3. [ ] Create customer with name: "O'Brien"
4. [ ] Verify: Saves correctly

**Pass/Fail:** ________

### Test 8.11.4: Empty Search
1. [ ] Clear search field completely
2. [ ] Verify: Returns all accessible customers
3. [ ] No errors in console

**Pass/Fail:** ________

---

## Test 8.12: System Integration

**Objective:** Verify integration with Horizon BMS

### Steps:
1. [ ] Verify navigation menu includes "Customers"
2. [ ] Verify authentication works (logout/login)
3. [ ] Verify role assignments from user_roles table
4. [ ] Test deep linking: \/customers/[specific-id]\
5. [ ] Verify: Browser back/forward works correctly
6. [ ] Verify: Bookmarking filtered URLs works
7. [ ] Check browser console for errors
8. [ ] Verify: No TypeScript compilation errors

**Expected:** Seamless integration
**Actual:** _____________________________________________________________
**Pass/Fail:** ________

---

## Summary

**Total Tests:** 12
**Passed:** _____ / 12
**Failed:** _____ / 12
**Blocked:** _____ / 12

**Critical Issues Found:**
1. _____________________________________________________________
2. _____________________________________________________________
3. _____________________________________________________________

**Minor Issues Found:**
1. _____________________________________________________________
2. _____________________________________________________________
3. _____________________________________________________________

**Recommendations:**
_____________________________________________________________
_____________________________________________________________

**Sign-Off:**
- Tester: _________________ Date: _________
- Reviewer: _______________ Date: _________
- Approved for Production: ☐ Yes ☐ No

---
