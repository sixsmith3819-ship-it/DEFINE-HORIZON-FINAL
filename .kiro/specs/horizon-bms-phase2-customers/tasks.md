# Implementation Plan: Customer Management Module (Phase 2)

## Overview

The Customer Management Module extends the Horizon BMS with comprehensive customer record management across individual and business customer types. Implementation follows a sequential wave structure: database schema setup, data access layer, page components, UI components, search and filtering, styling, and testing. The design leverages Next.js 16 server actions, Supabase for persistence, and Tailwind CSS for styling. All tasks include role-based access control enforcement and comprehensive audit trail logging.

## Notes

- **Design Patterns**: Next.js 16 server actions for mutations, async server components for data fetching
- **Testing Strategy**: Property-based tests validate universal data persistence and validation properties; unit tests cover specific examples and edge cases
- **RLS Enforcement**: All database access respects Supabase Row-Level Security policies configured for Admin/Manager/Employee roles
- **Audit Trail**: All mutations automatically create audit log entries tracking operation, user, timestamp, and field changes
- **Optional Testing**: Tasks marked with `*` are optional property-based and unit tests; core implementation must complete first

---

## Tasks

### Wave 1: Database Schema and RLS Setup

- [x] 1.1 Create `customers` table with discriminated union schema
  - Create table with customer_type field supporting 'individual' and 'business'
  - Add individual-specific fields: first_name, last_name, date_of_birth
  - Add business-specific fields: business_name, contact_person, business_registration_number, tax_id, website
  - Add shared fields: email (unique), phone, address, status (default 'active')
  - Add audit fields: created_at, created_by, updated_at, updated_by, assigned_employee_id
  - Include CHECK constraints for required fields per customer type
  - Create indexes on status, assigned_employee_id, created_by, email
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 12.1_

- [x] 1.2 Create `customer_interactions` table for notes and history
  - Create table with customer_id (FK), interaction_type, content, is_deleted
  - Add timestamp and user tracking: created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
  - Add CHECK constraint for non-empty content (no whitespace-only entries)
  - Create indexes on customer_id and created_at for query performance
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 1.3 Create `customer_audit_log` table for immutable audit trail
  - Create table with customer_id (FK), operation_type, field_name, previous_value, new_value, details (JSONB)
  - Add created_at and created_by timestamps
  - Create indexes on customer_id and created_at for audit query performance
  - Ensure operation_type covers: create, update, delete, assign, reactivate
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 1.4 Create `user_roles` table (if not exists) for role assignments
  - Create lightweight table with user_id (FK to auth.users), role (admin/manager/employee)
  - Add created_at timestamp for audit purposes
  - Create index on user_id for fast role lookups
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 1.5 Configure RLS policies for customers table
  - Admin sees all customers (no filter)
  - Manager sees all customers (no filter)
  - Employee sees only assigned customers (WHERE assigned_employee_id = auth.uid())
  - Admin and Manager can INSERT, UPDATE, DELETE
  - Employee can only view (SELECT) assigned customers, cannot modify
  - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_

- [x] 1.6 Configure RLS policies for customer_interactions table
  - Authorized users can SELECT interactions for customers they can view
  - Users can INSERT, UPDATE own interactions (created_by = auth.uid())
  - Manager/Admin can UPDATE/DELETE any interaction
  - Employee can only UPDATE/DELETE their own interactions
  - _Requirements: 7.5, 7.6, 7.7_

- [x] 1.7 Configure RLS policies for customer_audit_log table
  - Admin and Manager can SELECT audit logs
  - Employee cannot SELECT audit logs
  - All audit log entries are INSERT-only (no UPDATE or DELETE allowed)
  - _Requirements: 10.6_

### Wave 2: Data Access Layer and Server Actions

- [x] 2.1 Create TypeScript types in `lib/types/customer.ts`
  - Define Customer, IndividualCustomer, BusinessCustomer discriminated union types
  - Define CustomerDetail, CustomerInteraction, AuditLogEntry types
  - Define CustomerFormData for form submissions
  - Define CustomerFilters, SortField, PaginatedCustomers interfaces
  - Define enum types: CustomerType, CustomerStatus, InteractionType, OperationType
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 4.5, 5.1, 7.1, 10.1_

- [x] 2.2 Create validation utilities in `lib/validation/customer-validation.ts`
  - Implement email validation (pattern: ^[^\s@]+@[^\s@]+\.[^\s@]+$)
  - Implement phone validation (pattern: ^[\d\s\-()]{10,15}$)
  - Implement name validation (1-100 characters, no restrictions on special chars)
  - Implement business registration validation (required for business customers)
  - Return specific error messages for each validation rule
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 2.3 Implement permission checking utility in `lib/auth/permissions.ts`
  - Create checkPermission(userId, operation, resource?) function
  - Implement role-based permission matrix:
    - Admin: all operations allowed
    - Manager: all except view_audit_log
    - Employee: add_note (assigned only), view (assigned only)
  - Create isCustomerAssignedToUser(customerId, userId) helper
  - _Requirements: 1.6, 2.7, 4.3, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 2.4 Implement audit logging utility in `lib/audit/audit-logger.ts`
  - Create createAuditLogEntry(customerId, operation, userId, changes?, details?) function
  - Track field-level changes for update operations (previous_value, new_value)
  - Support operation types: create, update, delete, assign, reactivate
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7_

- [x] 2.5 Create server action `createCustomer` in `lib/actions/customers.ts`
  - Accept CustomerFormData and validate all fields
  - Check authorization (Manager or Admin only)
  - Create customer and interaction audit log entry atomically
  - Return success with customerId or error with specific message
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 10.1_

- [x] 2.6 Create server action `updateCustomer` in `lib/actions/customers.ts`
  - Accept customerId and partial CustomerFormData updates
  - Check authorization (Manager or Admin only)
  - Track field changes for audit log (before/after values)
  - Create audit log entry with field-level changes
  - Update updated_at timestamp and updated_by user
  - Return success or error
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 10.1, 10.3_

- [x] 2.7 Create server action `softDeleteCustomer` in `lib/actions/customers.ts`
  - Accept customerId
  - Check authorization (Manager or Admin only)
  - Change status from 'active' to 'inactive' atomically
  - Create audit log entry with operation_type 'delete', record previous and new status
  - Preserve all interaction history and audit trail data
  - Return success or error
  - _Requirements: 6.1, 6.2, 6.6, 10.1, 10.2_

- [x] 2.8 Create server action `reactivateCustomer` in `lib/actions/customers.ts`
  - Accept customerId
  - Check authorization (Manager or Admin only)
  - Change status from 'inactive' to 'active'
  - Create audit log entry with operation_type 'reactivate'
  - Return success or error
  - _Requirements: 6.7, 10.1_

- [x] 2.9 Create server action `addCustomerNote` in `lib/actions/customers.ts`
  - Accept customerId and note content
  - Check authorization (assigned employee, manager, or admin)
  - Validate content is non-empty and not whitespace-only
  - Create interaction history entry with type 'note'
  - Create audit log entry with operation_type 'action'
  - Return success with interactionId or error
  - _Requirements: 7.2, 7.3, 7.4, 10.5_

- [x] 2.10 Create server action `updateCustomerNote` in `lib/actions/customers.ts`
  - Accept interactionId and new content
  - Check authorization (own note, manager, or admin)
  - Validate content is non-empty
  - Update interaction and track updated_at, updated_by
  - Create audit log entry
  - Return success or error
  - _Requirements: 7.5, 7.6_

- [x] 2.11 Create server action `deleteCustomerNote` in `lib/actions/customers.ts`
  - Accept interactionId
  - Check authorization (own note, manager, or admin)
  - Soft delete: set is_deleted=true, record deleted_at and deleted_by
  - Create audit log entry
  - Return success or error
  - _Requirements: 7.8_

- [x] 2.12 Create server action `assignCustomerToEmployee` in `lib/actions/customers.ts`
  - Accept customerId and employeeId
  - Check authorization (Manager or Admin only)
  - Record previous assignment for audit log
  - Update assigned_employee_id atomically
  - Create audit log entry with operation_type 'assign'
  - Return success or error
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.4_

- [x] 2.13 Create server action `getCustomers` in `lib/actions/customers.ts`
  - Accept page, pageSize, searchTerm, filters (status/customerType/dateRange), sortBy
  - Apply role-based filtering (employees see only assigned)
  - Apply search term filtering across firstName, lastName, businessName, email, phone
  - Apply customer type and status filters
  - Apply sorting by name, email, createdAt, or status
  - Return PaginatedCustomers with totalCount and metadata
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 2.14 Create server action `getCustomerDetail` in `lib/actions/customers.ts`
  - Accept customerId
  - Check authorization (can view customer)
  - Fetch customer, interactions (ordered DESC by createdAt), and audit log if authorized
  - Return CustomerDetail or error
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 10.6_

- [x] 2.15 Create server action `getCustomerAuditLog` in `lib/actions/customers.ts`
  - Accept customerId
  - Check authorization (Admin or Manager only, deny Employee)
  - Fetch audit log entries ordered DESC by createdAt
  - Return AuditLogEntry[] or error
  - _Requirements: 10.1, 10.6_

### Wave 3: Page Components

- [x] 3.1 Create `/app/customers/page.tsx` (customer list page)
  - Accept searchParams for page, search, filters, sort
  - Call getCustomers server action with params
  - Render CustomerList component with data
  - Handle loading and error states
  - Include pagination controls and filter UI
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.2 Create `/app/customers/[id]/page.tsx` (customer detail page)
  - Accept customerId from params
  - Call getCustomerDetail server action
  - Render full customer info, InteractionTimeline, and AuditTrail if authorized
  - Include edit button for Manager/Admin, delete button
  - Display assigned employee info
  - Handle authorization errors gracefully
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 10.6, 11.5_

- [x] 3.3 Create `/app/customers/new/page.tsx` (create customer page)
  - Render customer type selector (Individual vs Business)
  - Render CustomerForm component with empty initial values
  - Call createCustomer server action on submit
  - Redirect to detail page on success
  - Display validation errors on form
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 11.1_

- [x] 3.4 Create `/app/customers/[id]/edit/page.tsx` (edit customer page)
  - Accept customerId from params
  - Call getCustomerDetail to populate form
  - Render CustomerForm component with existing data
  - Call updateCustomer server action on submit
  - Redirect to detail page on success
  - Display validation errors and update confirmations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

### Wave 4: UI Components

- [x] 4.1 Create `CustomerList` component in `components/customers/CustomerList.tsx`
  - Accept props: customers[], totalCount, currentPage, pageSize, onPageChange, onSort, sortBy
  - Render responsive table (desktop) or card view (mobile)
  - Display: name, email, status, type, assigned employee, action buttons
  - Include click handler to navigate to detail page
  - Include status badge with visual indicators
  - _Requirements: 4.4, 4.5, 11.1, 11.2, 11.3_

- [x] 4.2 Create `CustomerForm` component in `components/customers/CustomerForm.tsx`
  - Accept props: customer?, customerType, isSubmitting?, onSubmit
  - Render conditional fields based on customerType
  - Include all individual fields: firstName, lastName, dateOfBirth
  - Include all business fields: businessName, contactPerson, businessRegistrationNumber, taxId, website
  - Include shared fields: email, phone, address
  - Display real-time validation feedback for each field
  - Show required field indicators
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1, 5.2, 11.1_

- [x] 4.3 Create `InteractionTimeline` component in `components/customers/InteractionTimeline.tsx`
  - Accept props: interactions[], canEdit?, canDelete?, onAddNote?, onEditNote?, onDeleteNote?
  - Render chronological timeline (newest first)
  - Display interaction type badge, user name, timestamp, content
  - Show delete indicator for soft-deleted entries
  - Include add note form at top
  - Include edit/delete buttons for authorized users
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 4.4 Create `AuditTrail` component in `components/customers/AuditTrail.tsx`
  - Accept props: entries[], isLoading?
  - Render read-only chronological log (newest first)
  - Display operation type, user, timestamp, changed fields (before/after), details
  - Use expandable sections for detailed change information
  - Include operation type badges with distinct styling
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 4.5 Create `CustomerCard` component in `components/customers/CustomerCard.tsx`
  - Accept props: customer, onView?, onClick?
  - Display customer summary card (mobile list view)
  - Show name, email, status, type, assigned employee
  - Include action buttons for view and edit
  - _Requirements: 11.2_

- [x] 4.6 Create `SearchAndFilter` component in `components/customers/SearchAndFilter.tsx`
  - Accept props: onSearch, onFilterChange, onSortChange, currentFilters?, currentSort?
  - Include search input with debouncing (300ms)
  - Include filter dropdowns for: status, customerType, dateRange
  - Include sort controls for: name, email, createdAt, status
  - Display active filter chips with clear buttons
  - _Requirements: 4.4, 4.6, 4.7_

### Wave 5: Search, Filter, and Sort Functionality

- [x] 5.1 Implement search debouncing and URL state management
  - Update CustomerList page to use URLSearchParams
  - Debounce search input (300ms) before calling server action
  - Persist search, filters, sort, and page in URL
  - Maintain state across page navigation
  - _Requirements: 4.4, 4.7_

- [x] 5.2 Implement customer type filtering
  - Add filter UI to select Individual, Business, or All
  - Update getCustomers query to filter by customer_type
  - Display visual indicators for customer type in list
  - _Requirements: 4.6_

- [x] 5.3 Implement status filtering and display
  - Add status filter toggle (Active/Inactive/All)
  - Update getCustomers to apply status filter
  - Display status badges with distinct colors (green=active, gray=inactive)
  - Ensure Employees don't see inactive assigned customers (except own assignments)
  - _Requirements: 4.6, 6.3, 6.4, 6.5_

- [x] 5.4 Implement date range filtering
  - Add date range picker (from/to dates) in filter UI
  - Update getCustomers to filter by created_at range
  - Display selected date range in active filters
  - _Requirements: 4.6_

- [x] 5.5 Implement sort functionality
  - Add sort controls for: name, email, createdAt, status
  - Store sort direction (asc/desc) in state
  - Update getCustomers query ORDER BY clause
  - Display sort indicator (↑↓) on active sort column
  - _Requirements: 4.7_

- [x] 5.6 Implement pagination with validation
  - Accept page number from URL, default to 1
  - Validate page number is >= 1 and <= totalPages
  - Display page size (25 per page) with info
  - Include prev/next/page number controls
  - Disable controls appropriately at boundaries
  - _Requirements: 4.5, 4.8_

### Wave 6: Styling and Responsive Design

- [x] 6.1 Style customer list page (desktop/tablet/mobile)
  - Desktop (≥1200px): Full table with all columns, side-by-side layout
  - Tablet (768-1199px): Condensed table, hide non-essential columns
  - Mobile (<768px): Card view with essential info, action buttons
  - Ensure 44px minimum touch targets on mobile
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.7_

- [x] 6.2 Style customer detail page with responsive layout
  - Desktop: Two-column layout (customer info left, timeline right)
  - Tablet: Stacked layout with good spacing
  - Mobile: Single column, full-width components
  - Ensure timeline is scrollable on mobile without losing function
  - _Requirements: 11.3, 11.4, 11.5, 11.8_

- [x] 6.3 Style customer forms with validation feedback
  - Display field labels, inputs, and validation messages
  - Highlight invalid fields with red border and error message below
  - Show required field indicators (*)
  - Use conditional field visibility based on customer type
  - Style submit button with loading state
  - _Requirements: 3.5, 3.6, 11.1, 11.7_

- [x] 6.4 Style interaction timeline component
  - Desktop: Vertical timeline with content on alternating sides
  - Mobile: Single-column timeline with dates as separate rows
  - Use icons for interaction types
  - Distinguish deleted entries with strikethrough and faded styling
  - _Requirements: 11.5, 11.8_

- [x] 6.5 Style audit trail component
  - Use table or list layout for audit entries
  - Color-code operation types (green=create, blue=update, red=delete, yellow=assign)
  - Display expandable sections for detailed changes
  - Use monospace font for before/after values
  - _Requirements: 10.6_

- [x] 6.6 Apply consistent Tailwind CSS styling across all components
  - Use color scheme consistent with existing Horizon BMS design
  - Apply spacing and sizing guidelines
  - Ensure accessibility: sufficient color contrast, readable fonts
  - Use lucide-react icons throughout for consistency
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

### Wave 7: Property Tests and Unit Tests

- [ ] 7.1* Write property test for individual customer data persistence round-trip
  - **Property 1: Individual Customer Data Persistence Round-Trip**
  - **Validates: Requirements 1.1, 1.2, 3.1, 12.1**
  - Generate random individual customer data, create customer, retrieve customer
  - Assert all fields are preserved exactly (firstName, lastName, email, phone, address, dateOfBirth)
  - Run 100+ iterations with varied input

- [ ] 7.2* Write property test for business customer data persistence round-trip
  - **Property 2: Business Customer Data Persistence Round-Trip**
  - **Validates: Requirements 2.1, 2.2, 3.1, 12.1**
  - Generate random business customer data, create customer, retrieve customer
  - Assert all fields preserved (businessName, contactPerson, businessRegistrationNumber, email, phone, address, taxId, website)
  - Run 100+ iterations with varied input

- [ ] 7.3* Write property test for email validation
  - **Property 3: Email Format Validation**
  - **Validates: Requirements 3.1**
  - Generate invalid email strings (missing @, domain, extension)
  - Assert form submission fails with validation error
  - Test with 50+ invalid email variations

- [ ] 7.4* Write property test for phone validation
  - **Property 4: Phone Format Validation**
  - **Validates: Requirements 3.1**
  - Generate invalid phone numbers (too short, too long, invalid chars)
  - Assert form submission fails with validation error
  - Test with 50+ invalid phone variations

- [ ] 7.5* Write property test for soft delete status transition
  - **Property 5: Soft Delete Status Transition**
  - **Validates: Requirements 6.1, 6.2**
  - Create customer, soft delete, retrieve customer
  - Assert status changed to 'inactive', all other fields unchanged
  - Run 100+ iterations

- [ ] 7.6* Write property test for soft delete data preservation
  - **Property 6: Soft Delete Data Preservation**
  - **Validates: Requirements 6.6, 10.1**
  - Create customer, add notes/interactions, soft delete
  - Assert all interactions and audit log entries still exist and are unchanged
  - Run 50+ iterations

- [ ] 7.7* Write property test for interaction history append-only
  - **Property 7: Interaction History Append-Only**
  - **Validates: Requirements 7.2, 7.3**
  - Create customer, add N random notes
  - Assert total interaction count increased by exactly N
  - Assert all new interactions have correct timestamps
  - Run 100+ iterations with 1-10 notes per iteration

- [ ] 7.8* Write property test for audit log immutability
  - **Property 8: Audit Log Immutability**
  - **Validates: Requirements 10.7**
  - Create customer and audit log entry
  - Attempt to update or delete audit log entry (should fail)
  - Assert original entry unchanged in database
  - Run 50+ iterations

- [ ] 7.9* Write property test for role-based search filtering
  - **Property 9: Role-Based Search Result Filtering**
  - **Validates: Requirements 4.3, 9.4**
  - Create multiple customers with different assignments
  - Call getCustomers as employee user
  - Assert result set includes only customers assigned to that employee
  - Run 100+ iterations with 2-20 customers per iteration

- [ ] 7.10* Write property test for customer assignment audit trail
  - **Property 10: Customer Assignment Audit Trail**
  - **Validates: Requirements 8.2, 10.2, 10.4**
  - Assign customer to employee, retrieve audit log
  - Assert assignment audit entry exists and documents change atomically
  - Run 50+ iterations

- [ ] 7.11* Write property test for required field enforcement
  - **Property 11: Required Field Enforcement**
  - **Validates: Requirements 3.2, 3.3**
  - Generate customer data with missing required fields (one field at a time)
  - Assert form submission fails with specific field error message
  - Test both individual and business customer types
  - Run 100+ iterations

- [ ] 7.12* Write property test for permission denial consistency
  - **Property 12: Permission Denial Consistency**
  - **Validates: Requirements 1.6, 2.7, 6.5, 9.1, 9.2, 9.5**
  - Call create/edit/delete endpoints as employee user
  - Assert all operations fail with consistent permission denied error code
  - Run 50+ iterations per operation type

- [ ] 7.13* Write property test for search result ordering
  - **Property 13: Search Result Ordering**
  - **Validates: Requirements 4.7**
  - Create 20+ customers, search with sort specification
  - Assert results ordered according to field and direction (asc/desc)
  - Apply same sort twice, assert ordering identical
  - Run 50+ iterations

- [ ] 7.14* Write property test for pagination consistency
  - **Property 14: Pagination Consistency**
  - **Validates: Requirements 4.5**
  - Create 50+ customers, search with pageSize=25
  - Assert each page contains ≤25 records
  - Assert no duplicate customers across pages
  - Run 50+ iterations with random page selections

- [ ] 7.15* Write property test for update timestamp advancement
  - **Property 15: Update Timestamp Advancement**
  - **Validates: Requirements 5.3, 5.4**
  - Create customer, wait 10ms, update customer
  - Assert updated_at > created_at
  - Assert updated_at recorded in database
  - Run 100+ iterations

- [ ] 7.16* Write unit test for createCustomer with valid individual data
  - Create customer with all required individual fields
  - Assert customer stored with correct values
  - Assert created_at and created_by recorded
  - Assert status defaults to 'active'
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [ ] 7.17* Write unit test for createCustomer with valid business data
  - Create customer with all required business fields
  - Assert customer stored with correct values
  - Assert created_at and created_by recorded
  - Assert status defaults to 'active'
  - _Requirements: 2.1, 2.4, 2.5, 2.6_

- [ ] 7.18* Write unit test for employee create customer denied
  - Attempt to create customer as employee user
  - Assert operation denied with permission error
  - Assert no customer created
  - _Requirements: 1.6, 2.7, 9.5_

- [ ] 7.19* Write unit test for updateCustomer field changes
  - Create customer, update specific fields
  - Assert updated fields changed, unchanged fields preserved
  - Assert updated_at timestamp changed
  - Assert audit log entry documents field changes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 10.3_

- [ ] 7.20* Write unit test for softDeleteCustomer status change
  - Create customer with status='active'
  - Soft delete customer
  - Assert status='inactive'
  - Assert interaction history preserved
  - Assert audit log entry created
  - _Requirements: 6.1, 6.2, 6.6, 10.2_

- [ ] 7.21* Write unit test for addCustomerNote authorization
  - Test manager can add note to any customer
  - Test admin can add note to any customer
  - Test employee can add note to assigned customer
  - Test employee denied note to unassigned customer
  - _Requirements: 7.2, 9.6, 9.7_

- [ ] 7.22* Write unit test for search with multiple filters
  - Create 20 customers with varied types, statuses, assignments
  - Search with status=active, customerType=individual, sort by name
  - Assert only active individuals returned in correct order
  - _Requirements: 4.4, 4.6, 4.7_

- [ ] 7.23* Write unit test for getCustomerDetail includes all data
  - Create customer, add 5 notes, retrieve detail
  - Assert customer data complete
  - Assert all 5 interactions included
  - Assert audit log included
  - _Requirements: 7.1, 10.6_

- [ ] 7.24* Write unit test for concurrent update conflict handling
  - Simulate two simultaneous updates to same customer
  - Assert one succeeds and one fails gracefully
  - Assert database consistency maintained
  - _Requirements: 12.2, 12.5_

- [ ] 7.25* Write unit test for soft-deleted customer not in employee list
  - Create inactive customer assigned to employee
  - Search as employee
  - Assert inactive customer not included in results
  - _Requirements: 6.5_

### Wave 8: Testing and Verification

- [ ] 8.1 Run all property tests and verify passing
  - Execute all 15 property tests (Wave 7, tasks 7.1-7.15)
  - Verify 100+ iterations per test complete successfully
  - Assert all properties pass with no failing counterexamples
  - Document any timeout or performance issues
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 4.3, 4.5, 4.7, 5.3, 5.4, 6.1, 6.2, 7.2, 8.2, 10.1, 12.1_

- [ ] 8.2 Run all unit tests and verify passing
  - Execute all 14 unit tests (Wave 7, tasks 7.16-7.25)
  - Verify all tests pass with clear assertions
  - Fix any failing tests before proceeding
  - Document test coverage for each requirement
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 2.1, 2.4, 2.5, 2.6, 2.7, 3.1, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.5, 6.6, 7.1, 7.2, 9.5, 9.6, 9.7, 10.2, 10.3, 10.6, 12.2, 12.5_

- [ ] 8.3 Test CRUD operations manually (end-to-end)
  - Create new individual customer via UI
  - Verify customer appears in list
  - Edit customer and verify changes persisted
  - Add 3 notes to customer
  - Verify notes appear in timeline with correct order
  - Soft delete customer and verify marked inactive
  - Reactivate customer and verify restored to active
  - _Requirements: 1.1, 2.1, 5.1, 5.2, 6.1, 6.7, 7.2, 7.3_

- [ ] 8.4 Test role-based access control (Admin/Manager/Employee)
  - Login as Admin: verify full CRUD access to all customers
  - Login as Manager: verify full CRUD access to all customers
  - Login as Employee: verify view-only and note-adding for assigned customers
  - Attempt employee create/edit/delete (should fail with permission error)
  - Verify each role sees correct customer list
  - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 8.5 Test search, filter, and sort functionality
  - Search by first name, last name, email, phone (test each)
  - Filter by status (active/inactive)
  - Filter by customer type (individual/business)
  - Filter by date range (created after/before dates)
  - Sort by name (asc/desc), email, createdAt, status
  - Combine multiple filters and verify results correct
  - Verify filters persist in URL
  - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 8.6 Test pagination and result limits
  - Create 60+ customers
  - Load customer list page 1 (should have 25 records)
  - Verify pagination controls present
  - Navigate to page 2 (should have 25 records, different from page 1)
  - Navigate to page 3 (verify records continue)
  - Go to last page (verify fewer than 25 records)
  - _Requirements: 4.5, 4.8_

- [ ] 8.7 Test validation error messages
  - Try to create customer with invalid email (missing @, no domain)
  - Verify specific email validation error displayed
  - Try to create with invalid phone (too short, invalid chars)
  - Verify specific phone validation error displayed
  - Try to create individual without first name
  - Verify required field error for first name
  - Try to submit with all fields empty
  - Verify all required fields flagged
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 8.8 Test audit log completeness and immutability
  - Create customer and verify create audit entry exists
  - Update customer field and verify update audit entry with before/after values
  - Assign to employee and verify assignment audit entry
  - Soft delete and verify delete audit entry
  - Verify no audit entries are missing or incorrect
  - Attempt to edit audit log entry directly (should fail)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 8.9 Test responsive design on multiple device sizes
  - Test desktop view (1920px width): verify full table, 2-column layouts
  - Test tablet view (768px width): verify condensed table, stacked layouts
  - Test mobile view (375px width): verify card view, single column, 44px touch targets
  - Verify all buttons and inputs accessible on mobile
  - Test timeline responsiveness and scrolling on mobile
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ] 8.10 Test concurrent operations and conflict handling
  - Simulate two managers editing same customer simultaneously
  - Verify one succeeds and other fails gracefully
  - Verify no data corruption or unexpected state
  - Test assignment conflicts (assign same customer to two employees)
  - Verify database maintains consistency
  - _Requirements: 12.2, 12.3, 12.4, 12.5_

- [ ] 8.11 Test edge cases and error conditions
  - Create customer with email exactly at 255 character limit
  - Create customer with very long names (near 100 char limit)
  - Try to create duplicate email (should fail with unique constraint)
  - Try to assign deleted/inactive employee to customer
  - Search with empty search term (should return all accessible)
  - Search with special characters in search term
  - _Requirements: 3.4, 12.1, 12.3, 12.4_

### Final Checkpoint

- [ ] 8.12 Final verification checkpoint
  - Ensure all property tests pass (15 tests)
  - Ensure all unit tests pass (14 tests)
  - Ensure no console errors or warnings
  - Verify all requirements mapped to at least one test/task
  - Verify responsive design works on desktop/tablet/mobile
  - Ask user for feedback on any issues or clarifications needed before moving to next phase

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "description": "Database schema and infrastructure",
      "tasks": ["1.1", "1.2", "1.3", "1.4"]
    },
    {
      "id": 1,
      "description": "RLS policies and data access layer setup",
      "tasks": ["1.5", "1.6", "1.7", "2.1", "2.2", "2.3", "2.4"]
    },
    {
      "id": 2,
      "description": "Server actions for customer CRUD and queries",
      "tasks": ["2.5", "2.6", "2.7", "2.8", "2.9", "2.10", "2.11", "2.12", "2.13", "2.14", "2.15"]
    },
    {
      "id": 3,
      "description": "Page components (list, detail, create, edit)",
      "tasks": ["3.1", "3.2", "3.3", "3.4"]
    },
    {
      "id": 4,
      "description": "UI components (CustomerList, Form, Timeline, AuditTrail)",
      "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"]
    },
    {
      "id": 5,
      "description": "Search, filter, sort, pagination functionality",
      "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"]
    },
    {
      "id": 6,
      "description": "Styling and responsive design",
      "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6"]
    },
    {
      "id": 7,
      "description": "Property tests and unit tests",
      "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10", "7.11", "7.12", "7.13", "7.14", "7.15", "7.16", "7.17", "7.18", "7.19", "7.20", "7.21", "7.22", "7.23", "7.24", "7.25"]
    },
    {
      "id": 8,
      "description": "Testing and verification",
      "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9", "8.10", "8.11", "8.12"]
    }
  ]
}
```

---

## Implementation Notes

### Property-Based Testing Strategy

The design document includes 15 correctness properties (Properties 1-15). Tasks 7.1-7.15 implement each as a property-based test with 100+ iterations. Each test:
- Generates random valid inputs matching property specification
- Executes the operation under test
- Asserts the property holds true
- Runs many iterations to catch edge cases

Property tests complement unit tests: units test specific examples, properties verify universal correctness across input space.

### Test Execution Order

1. **Wave 7 property tests** (7.1-7.15): Validate data persistence, validation rules, permissions, audit trails
2. **Wave 7 unit tests** (7.16-7.25): Validate specific scenarios and authorization
3. **Wave 8 manual tests** (8.3-8.11): End-to-end validation through UI

### Concurrent Update Handling

Task 12.2 and 12.5 require concurrent update safety. Implementation strategy:
- Use Supabase optimistic locking (default update behavior includes conflict detection)
- Return error if updated row count is 0 (indicates row was modified between read and update)
- Client retries read-then-update if conflict detected
- Audit log entries atomically created with updates to maintain consistency

### Responsive Design Breakpoints

- **Mobile**: < 768px (375px test size)
- **Tablet**: 768px - 1199px
- **Desktop**: ≥ 1200px (1920px test size)

All components must remain functional and readable at each breakpoint.

### Performance Targets

- Customer search query: < 200ms for 1000+ records
- Page load (detail + interactions + audit log): < 500ms
- Pagination: instant (cached results)
- Validation: instant (client-side)

