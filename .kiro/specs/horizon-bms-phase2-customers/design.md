# Design Document: Customer Management Module

## Introduction

The Customer Management Module provides a complete system for managing customer records with support for two customer types (individual and business), role-based access control, interaction history tracking, and comprehensive audit trails. The design follows Next.js/React patterns established in the Horizon BMS architecture, leveraging Supabase for data persistence and authentication integration.

## Architecture Overview

### Technology Stack

- **Frontend Framework**: Next.js 16 with React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **UI Components**: lucide-react for icons
- **Authentication**: Supabase Auth (integrated with existing system)

### System Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                   UI Components Layer                │
│  (Customer List, Detail View, Forms, Timeline)      │
├─────────────────────────────────────────────────────┤
│              API Routes / Server Actions             │
│  (Next.js /api/customers routes + Server Actions)   │
├─────────────────────────────────────────────────────┤
│               Business Logic Layer                   │
│  (Validation, Authorization, Audit Logging)         │
├─────────────────────────────────────────────────────┤
│                 Data Access Layer                    │
│  (Supabase Client, Queries, Transactions)           │
├─────────────────────────────────────────────────────┤
│              Supabase PostgreSQL Database            │
└─────────────────────────────────────────────────────┘
```

## Database Schema Design

### Core Tables

#### `customers` Table

Stores core customer information for both individual and business types using a discriminated union pattern.

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('individual', 'business')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Individual Fields
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  
  -- Business Fields
  business_name VARCHAR(100),
  contact_person VARCHAR(100),
  business_registration_number VARCHAR(100),
  tax_id VARCHAR(50),
  website VARCHAR(255),
  
  -- Shared Fields
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Assignment Fields
  assigned_employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT individual_required_fields CHECK (
    (customer_type = 'individual' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
    (customer_type = 'business')
  ),
  CONSTRAINT business_required_fields CHECK (
    (customer_type = 'business' AND business_name IS NOT NULL AND contact_person IS NOT NULL) OR
    (customer_type = 'individual')
  )
);

CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_assigned_employee_id ON customers(assigned_employee_id);
CREATE INDEX idx_customers_created_by ON customers(created_by);
CREATE INDEX idx_customers_email ON customers(email);
```

#### `customer_interactions` Table

Stores notes, actions, and communication history for each customer.

```sql
CREATE TABLE customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL DEFAULT 'note' CHECK (interaction_type IN ('note', 'call', 'email', 'meeting', 'action')),
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT non_empty_content CHECK (LENGTH(TRIM(content)) > 0)
);

CREATE INDEX idx_customer_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX idx_customer_interactions_created_at ON customer_interactions(created_at DESC);
```

#### `customer_audit_log` Table

Immutable audit trail of all customer management operations.

```sql
CREATE TABLE customer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('create', 'update', 'delete', 'assign', 'reactivate')),
  field_name VARCHAR(100),
  previous_value TEXT,
  new_value TEXT,
  details JSONB,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  CONSTRAINT immutable_check CHECK (1=1) -- enforced at application level
);

CREATE INDEX idx_customer_audit_log_customer_id ON customer_audit_log(customer_id);
CREATE INDEX idx_customer_audit_log_created_at ON customer_audit_log(created_at DESC);
```

### Row-Level Security Policies

```sql
-- Customers: Admin sees all, Manager sees all, Employee sees assigned
CREATE POLICY customers_select_policy ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND (role = 'admin' OR role = 'manager' OR 
             (role = 'employee' AND auth.uid() = customers.assigned_employee_id))
    )
  );

-- Customers: Admin and Manager can create/update/delete
CREATE POLICY customers_modify_policy ON customers
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Interactions: Authorized users can read/write
CREATE POLICY interactions_select_policy ON customer_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = customer_interactions.customer_id
        AND (ur.role = 'admin' OR ur.role = 'manager' OR
             (ur.role = 'employee' AND auth.uid() = c.assigned_employee_id))
    )
  );

-- Audit log: Admin and Manager only
CREATE POLICY audit_log_select_policy ON customer_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
```

## Component Architecture

### Page Components

#### `/app/customers/page.tsx` - Customer List

Displays searchable, filterable customer list with pagination.

**Responsibilities**:
- Fetch and display customers based on user role
- Handle search, filtering, sorting, and pagination
- Route to detail view on row click

**Key Props/State**:
- `currentPage: number` - current pagination page
- `searchTerm: string` - active search query
- `filters: CustomerFilters` - applied filters
- `sortBy: SortField` - sort column and direction
- `customers: PaginatedCustomers` - customer data and metadata

#### `/app/customers/[id]/page.tsx` - Customer Detail

Displays complete customer record with interaction history and edit controls.

**Responsibilities**:
- Fetch and display full customer record
- Display interaction history timeline
- Provide edit form for authorized users
- Display audit trail

**Key Props/State**:
- `customerId: string` - customer UUID from URL
- `customer: CustomerDetail` - full customer data
- `interactions: CustomerInteraction[]` - chronological interaction history
- `auditLog: AuditLogEntry[]` - operations performed on customer

#### `/app/customers/new/page.tsx` - Create Customer

Form for creating new individual or business customer records.

**Responsibilities**:
- Render conditional form based on customer type selection
- Validate user input before submission
- Handle form submission and navigation

#### `/app/customers/[id]/edit/page.tsx` - Edit Customer

Form for updating existing customer information.

**Responsibilities**:
- Load and populate form with existing customer data
- Validate updates before submission
- Track field changes for audit log

### UI Components

#### `CustomerList` Component

```typescript
interface CustomerListProps {
  customers: Customer[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort: (field: SortField) => void;
  sortBy?: SortField;
}

// Renders: Responsive table with search, filters, sorting, pagination
// Handles: Click to detail, inline status display, employee assignment chip
```

#### `CustomerForm` Component

```typescript
interface CustomerFormProps {
  customer?: Customer;
  customerType: 'individual' | 'business';
  isSubmitting?: boolean;
  onSubmit: (data: CustomerFormData) => Promise<void>;
}

// Renders: Conditional fields based on customer type
// Handles: Real-time validation, field validation feedback
// Features: Required field indicators, validation error messages
```

#### `InteractionTimeline` Component

```typescript
interface InteractionTimelineProps {
  interactions: CustomerInteraction[];
  canEdit?: boolean;
  canDelete?: boolean;
  onAddNote?: (content: string) => Promise<void>;
  onEditNote?: (id: string, content: string) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
}

// Renders: Chronological timeline of interactions
// Handles: Add note form, edit/delete buttons, timestamps and user names
// Features: Deleted note indicators, modification timestamps
```

#### `AuditTrail` Component

```typescript
interface AuditTrailProps {
  entries: AuditLogEntry[];
  isLoading?: boolean;
}

// Renders: Read-only chronological audit log
// Displays: Operation, user, timestamp, before/after values
// Features: Filterable by operation type, expandable details
```

### Server Actions and API Routes

#### Server Actions (Next.js 19+)

```typescript
// lib/actions/customers.ts

export async function createCustomer(formData: CustomerFormData): Promise<{
  success: boolean;
  customerId?: string;
  error?: string;
}> {
  // Authorization check (Manager or Admin only)
  // Validation of input data
  // Database transaction for customer creation + audit log
  // Returns customer ID or error
}

export async function updateCustomer(
  customerId: string,
  updates: Partial<CustomerFormData>
): Promise<{ success: boolean; error?: string }> {
  // Authorization check (Manager or Admin only)
  // Validation of updates
  // Track field changes for audit log
  // Database update + audit log entry
}

export async function softDeleteCustomer(customerId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // Authorization check (Manager or Admin only)
  // Update status to 'inactive'
  // Create audit log entry
}

export async function addCustomerNote(
  customerId: string,
  content: string
): Promise<{ success: boolean; interactionId?: string; error?: string }> {
  // Authorization check (assigned employee, manager, or admin)
  // Validate content is non-empty
  // Create interaction history entry
  // Create audit log entry
}

export async function assignCustomerToEmployee(
  customerId: string,
  employeeId: string
): Promise<{ success: boolean; error?: string }> {
  // Authorization check (Manager or Admin only)
  // Record previous assignment for audit log
  // Update customer assignment
  // Create assignment audit log entry
}

export async function getCustomers(
  page: number = 1,
  pageSize: number = 25,
  searchTerm?: string,
  filters?: CustomerFilters,
  sortBy?: SortField
): Promise<PaginatedCustomers> {
  // Apply role-based filtering
  // Apply search term filtering
  // Apply customer filters
  // Apply sorting
  // Apply pagination
  // Return results with total count
}

export async function getCustomerDetail(customerId: string): Promise<{
  customer?: CustomerDetail;
  interactions?: CustomerInteraction[];
  auditLog?: AuditLogEntry[];
  error?: string;
}> {
  // Authorization check
  // Fetch customer, interactions (ordered by timestamp DESC), audit log
}
```

#### API Routes (for integrations)

```typescript
// app/api/customers/route.ts
export async function GET(request: Request) {
  // Search/list endpoint with query parameters
  // Role-based filtering
  // Pagination support
}

export async function POST(request: Request) {
  // Create customer endpoint
  // Input validation
  // Authorization check
}

// app/api/customers/[id]/route.ts
export async function GET(request: Request, { params }) {
  // Get customer detail
  // Include interactions and audit log if authorized
}

export async function PUT(request: Request, { params }) {
  // Update customer endpoint
  // Field-level validation
}

export async function DELETE(request: Request, { params }) {
  // Soft delete endpoint
}
```

## Data Models and Types

### TypeScript Types

```typescript
// lib/types/customer.ts

export type CustomerType = 'individual' | 'business';
export type CustomerStatus = 'active' | 'inactive';
export type InteractionType = 'note' | 'call' | 'email' | 'meeting' | 'action';
export type OperationType = 'create' | 'update' | 'delete' | 'assign' | 'reactivate';

export interface BaseCustomer {
  id: string;
  customerType: CustomerType;
  status: CustomerStatus;
  email: string;
  phone: string;
  address: string;
  assignedEmployeeId: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface IndividualCustomer extends BaseCustomer {
  customerType: 'individual';
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
}

export interface BusinessCustomer extends BaseCustomer {
  customerType: 'business';
  businessName: string;
  contactPerson: string;
  businessRegistrationNumber: string;
  taxId?: string;
  website?: string;
}

export type Customer = IndividualCustomer | BusinessCustomer;

export interface CustomerDetail extends Customer {
  interactions: CustomerInteraction[];
  auditLog: AuditLogEntry[];
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  interactionType: InteractionType;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  customerId: string;
  operationType: OperationType;
  fieldName?: string;
  previousValue?: string;
  newValue?: string;
  details?: Record<string, any>;
  createdAt: Date;
  createdBy: string;
}

export interface CustomerFormData {
  customerType: CustomerType;
  // Individual fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  // Business fields
  businessName?: string;
  contactPerson?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  website?: string;
  // Shared fields
  email: string;
  phone: string;
  address: string;
}

export interface CustomerFilters {
  status?: CustomerStatus;
  customerType?: CustomerType;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface SortField {
  field: 'name' | 'email' | 'createdAt' | 'status';
  direction: 'asc' | 'desc';
}

export interface PaginatedCustomers {
  customers: Customer[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}
```

## Authorization and Access Control

### Role-Based Permissions Matrix

| Operation | Admin | Manager | Employee |
|-----------|-------|---------|----------|
| View All Customers | ✓ | ✓ | ✗ |
| View Assigned Customers | ✓ | ✓ | ✓ |
| Create Customer | ✓ | ✓ | ✗ |
| Edit Customer | ✓ | ✓ | ✗ |
| Soft Delete Customer | ✓ | ✓ | ✗ |
| Assign Customer | ✓ | ✓ | ✗ |
| Add Note | ✓ | ✓ | ✓* |
| Edit Note | ✓ | ✓ | ✓** |
| View Audit Log | ✓ | ✓ | ✗ |

*Employee can only add notes to assigned customers
**Employee can only edit their own notes

### Authorization Implementation

```typescript
// lib/auth/permissions.ts

export async function checkPermission(
  userId: string,
  operation: string,
  resource?: { customerId?: string; assignedEmployeeId?: string }
): Promise<boolean> {
  const userRole = await getUserRole(userId);
  
  if (userRole === 'admin') return true;
  if (userRole === 'manager') return !['view_audit_log'].includes(operation);
  if (userRole === 'employee') {
    // Employee-specific permission checks
    if (operation === 'add_note' && resource?.customerId) {
      return await isCustomerAssignedToUser(resource.customerId, userId);
    }
    return !['create', 'edit', 'delete', 'assign', 'view_audit_log'].includes(operation);
  }
  return false;
}

export async function isCustomerAssignedToUser(
  customerId: string,
  userId: string
): Promise<boolean> {
  const customer = await getCustomer(customerId);
  return customer?.assignedEmployeeId === userId;
}
```

## Validation Rules

### Email Validation

Pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Local part: non-whitespace, non-@ characters
- Domain: non-whitespace, non-@ characters, dot-separated
- Extension: at least one character

### Phone Validation

Pattern: `^[\d\s\-()]{10,15}$`
- Contains only digits, spaces, hyphens, parentheses
- Length: 10 to 15 characters
- Preserves formatting for display

### Name Validation

- Maximum length: 100 characters
- Minimum length: 1 character
- No validation on special characters (allows names like "Mary-Jane" or "O'Connor")

### Business Registration Number

- Maximum length: 100 characters
- Required for business customers

## Error Handling and User Feedback

### Validation Error Messages

```typescript
export const validationMessages = {
  email: {
    required: 'Email address is required',
    invalid: 'Please enter a valid email address (example@domain.com)',
    unique: 'A customer with this email already exists'
  },
  phone: {
    required: 'Phone number is required',
    invalid: 'Phone number must contain 10-15 numeric digits'
  },
  name: {
    required: 'Name is required',
    tooLong: 'Name cannot exceed 100 characters'
  }
};
```

### API Error Responses

```typescript
interface ApiErrorResponse {
  error: string;
  message: string;
  code: string;
  details?: Record<string, string>;
  timestamp: Date;
}

export const errorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DATABASE_ERROR: 'DATABASE_ERROR'
};
```

## Responsive Design Approach

### Breakpoints

- **Mobile**: < 768px - Single column layout, stacked forms
- **Tablet**: 768px - 1199px - Two column layout, condensed tables
- **Desktop**: ≥ 1200px - Full multi-column layout, expanded tables

### Component Responsive Patterns

**CustomerList Table**:
- Desktop: Full table with all columns
- Tablet: Hide non-essential columns (notes count, date fields become badges)
- Mobile: Card view with customer name, email, status, action button

**Forms**:
- Desktop: Two-column grid for related fields
- Tablet: Single column with improved spacing
- Mobile: Single column, full-width inputs with 44px minimum height

**Interaction Timeline**:
- Desktop: Vertical timeline with content on alternating sides
- Mobile: Single-column vertical timeline, date appears as separate row

## Performance Considerations

### Database Optimization

- Indexes on frequently queried columns (status, assigned_employee_id, email)
- Composite indexes for common query patterns
- Pagination queries limited to 25 records per page

### Frontend Optimization

- Lazy load customer interactions and audit log on detail page
- Server-side pagination to avoid loading large datasets
- Search debouncing (300ms) to reduce query frequency
- Component memoization for list items to prevent unnecessary re-renders

### Caching Strategy

- Browser cache for static assets
- Server-side query result caching for common searches (5-minute TTL)
- User role cache in session (invalidate on role change)

## Correctness Properties

*Properties define universal behaviors that should hold true across all valid system executions, serving as the bridge between human-readable requirements and machine-verifiable correctness.*

### Property 1: Individual Customer Data Persistence Round-Trip

*For any* individual customer record created with valid data, storing and retrieving that customer SHALL preserve all provided fields (firstName, lastName, email, phone, address, dateOfBirth) with identical values.

**Validates: Requirements 1.1, 1.2, 3.1, 12.1**

### Property 2: Business Customer Data Persistence Round-Trip

*For any* business customer record created with valid data, storing and retrieving that customer SHALL preserve all provided fields (businessName, contactPerson, businessRegistrationNumber, email, phone, address, taxId, website) with identical values.

**Validates: Requirements 2.1, 2.2, 3.1, 12.1**

### Property 3: Email Format Validation

*For any* string that does not match the email format pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`, submitting a customer form with that string in the email field SHALL result in validation failure and form rejection.

**Validates: Requirements 3.1**

### Property 4: Phone Format Validation

*For any* string that does not match the phone format constraints (10-15 characters, only digits/spaces/hyphens/parentheses), submitting a customer form with that string in the phone field SHALL result in validation failure and form rejection.

**Validates: Requirements 3.1**

### Property 5: Soft Delete Status Transition

*For any* active customer record, performing a soft delete operation SHALL change the customer status from Active to Inactive, and retrieving that customer after soft delete SHALL return status as Inactive.

**Validates: Requirements 6.1, 6.2**

### Property 6: Soft Delete Data Preservation

*For any* customer record that is soft deleted, all associated interaction history records and audit trail entries SHALL remain in the database unchanged and retrievable.

**Validates: Requirements 6.6, 10.1**

### Property 7: Interaction History Append-Only

*For any* customer record, adding a note to the interaction history SHALL create a new timestamped entry, and the total number of interactions associated with that customer SHALL increase by exactly one.

**Validates: Requirements 7.2, 7.3**

### Property 8: Audit Log Immutability

*For any* audit log entry created in the system, attempting to update or delete that entry through any API or data access mechanism SHALL fail with a permission error.

**Validates: Requirements 10.7**

### Property 9: Role-Based Search Result Filtering

*For any* employee user performing a customer search, the result set SHALL include only customers assigned to that employee (where assigned_employee_id equals the user's ID).

**Validates: Requirements 4.3, 9.4**

### Property 10: Customer Assignment Audit Trail

*For any* customer record that is assigned to an employee, creating an audit log entry documenting the assignment change SHALL occur atomically with the assignment update in the database.

**Validates: Requirements 8.2, 10.2, 10.4**

### Property 11: Required Field Enforcement

*For any* customer creation form submission, if a required field (First Name and Last Name for individual customers, or Business Name and Contact Person for business customers) is missing or empty, the form submission SHALL fail with a specific validation error message for that field.

**Validates: Requirements 3.2, 3.3**

### Property 12: Permission Denial Consistency

*For any* API endpoint that requires Admin or Manager role (create, edit, delete customer operations), when called by an Employee user, the operation SHALL fail with a consistent permission denied error code and message.

**Validates: Requirements 1.6, 2.7, 6.5, 9.1, 9.2, 9.5**

### Property 13: Search Result Ordering

*For any* customer search performed with an active sort specification, the returned customer list SHALL be ordered according to the specified sort field and direction (ascending or descending), and applying the same sort a second time SHALL produce identical ordering.

**Validates: Requirements 4.7**

### Property 14: Pagination Consistency

*For any* customer search with pageSize=25 and currentPage=N, the customer list SHALL contain at most 25 records, and the records returned SHALL be unique across different page numbers (no duplicate customers across pages).

**Validates: Requirements 4.5**

### Property 15: Update Timestamp Advancement

*For any* customer record that is updated, the updated_at timestamp SHALL be greater than the original created_at timestamp, and the updated_at value SHALL be recorded in the database.

**Validates: Requirements 5.3, 5.4**
