# Design Document: TypeScript Database Schema Alignment

## Overview

This design addresses the alignment of TypeScript type definitions, action functions, and validation logic with the PostgreSQL database schema after SQL compatibility fixes have been applied. The system implements a bidirectional mapping layer between TypeScript conventions (camelCase) and database conventions (snake_case), handles computed columns correctly, and ensures type safety throughout the application.

## Architecture

### High-Level Architecture

The system follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│              (React Components, Forms)                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ TypeScript Types (camelCase)
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  Validation Layer                        │
│         (lib/validation/*.ts)                           │
│  - Field validation                                     │
│  - Error message generation                             │
│  - Computed field exclusion                             │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   Action Layer                           │
│            (lib/actions/*.ts)                           │
│  - Business logic                                       │
│  - Authorization checks                                 │
│  - Data transformation (camelCase ↔ snake_case)        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Database Schema (snake_case)
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Supabase Client Layer                     │
│         (lib/supabase-*.ts)                             │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              PostgreSQL Database                         │
│  - Tables with snake_case columns                       │
│  - Computed columns (GENERATED ALWAYS)                  │
│  - Foreign key constraints                              │
│  - Indexes                                              │
│  - Views (user_roles)                                   │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Bidirectional Mapping Layer**: All database interactions go through transformation functions that convert between TypeScript conventions (camelCase) and database conventions (snake_case).

2. **Computed Column Handling**: Computed columns are marked as read-only in TypeScript types and explicitly filtered out of insert/update operations.

3. **Type Safety**: TypeScript interfaces strictly match database schema, with optional types and null unions matching database nullability constraints.

4. **Error Handling**: Database errors are caught, transformed to include field names matching the schema, and returned with descriptive messages.

## Components

### 1. Type Definitions Layer (`lib/types/`)

#### Customer Types (`lib/types/customer.ts`)

**Updates Required:**
- Change `phoneNumber` to `phone` in `BaseCustomer` interface
- Add computed field indicators for `firstName`, `lastName`, `businessName`
- Update JSDoc comments to indicate computed fields

```typescript
export interface BaseCustomer {
  id: string;
  customerType: CustomerType;
  customerName: string;
  status: CustomerStatus;
  email: string | null;
  phone: string; // Changed from phoneNumber
  idNumber: string | null;
  address: string | null;
  assignedEmployeeId: string | null;
  notes: string | null;
  
  // Computed fields (read-only, do not include in insert/update)
  readonly firstName: string | null; // Generated: customer_name when type='individual'
  readonly lastName: string; // Generated: always empty string
  readonly businessName: string | null; // Generated: customer_name when type='business'
  
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string | null;
}
```

**Design Rationale:**
- Using `readonly` modifier makes computed fields immutable in TypeScript
- Explicit JSDoc comments warn developers not to include these in mutations
- Nullable types for `firstName` and `businessName` match database NULL values

#### Announcement Types (`lib/types/announcement.ts`)

**Updates Required:**
- Add `updatedBy` field to `Announcement` interface
- Add computed `message` field
- Update `AnnouncementFormData` to include `updatedBy`

```typescript
export interface Announcement {
  id: string;
  title: string;
  content: string;
  
  // Computed field (read-only, do not include in insert/update)
  readonly message: string; // Generated: copy of content field
  
  status: AnnouncementStatus;
  priority?: string;
  publishDate?: string;
  expiryDate?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string; // New field: user who last updated
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  status: AnnouncementStatus;
  priority?: string;
  publishDate?: string;
  expiryDate?: string;
  updatedBy: string; // Required for inserts/updates
}
```

#### User Roles Type

**New Type Definition:**

```typescript
// lib/types/user-roles.ts
export interface UserRole {
  userId: string;
  role: 'admin' | 'manager' | 'employee';
  isActive: boolean;
  createdAt: string;
}
```

**Design Rationale:**
- Separate type for the user_roles view
- Maps view columns to camelCase properties
- Provides type safety for role queries

### 2. Data Transformation Layer

#### Mapping Utilities (`lib/actions/utils/mapping.ts`)

**New Utility Module:**

```typescript
/**
 * Central mapping utilities for converting between TypeScript conventions
 * (camelCase) and database conventions (snake_case)
 */

/**
 * List of computed columns that should never be included in
 * insert/update operations, organized by table
 */
const COMPUTED_COLUMNS = {
  customers: ['first_name', 'last_name', 'business_name'],
  announcements: ['message'],
} as const;

/**
 * Remove computed columns from a database payload
 */
export function excludeComputedColumns<T extends Record<string, any>>(
  data: T,
  table: keyof typeof COMPUTED_COLUMNS
): Omit<T, string> {
  const computed = COMPUTED_COLUMNS[table];
  const filtered = { ...data };
  
  computed.forEach(col => {
    delete filtered[col];
  });
  
  return filtered;
}

/**
 * Transform customer data from database (snake_case) to TypeScript (camelCase)
 */
export function transformCustomerFromDB(dbCustomer: any): Customer {
  return {
    id: dbCustomer.id,
    customerType: dbCustomer.customer_type,
    customerName: dbCustomer.customer_name,
    status: dbCustomer.status,
    email: dbCustomer.email,
    phone: dbCustomer.phone, // Updated field name
    idNumber: dbCustomer.id_number,
    address: dbCustomer.address,
    assignedEmployeeId: dbCustomer.assigned_employee_id,
    notes: dbCustomer.notes,
    
    // Computed fields
    firstName: dbCustomer.first_name,
    lastName: dbCustomer.last_name,
    businessName: dbCustomer.business_name,
    
    createdAt: dbCustomer.created_at,
    createdBy: dbCustomer.created_by,
    updatedAt: dbCustomer.updated_at,
    updatedBy: dbCustomer.updated_by,
  };
}

/**
 * Transform customer form data from TypeScript (camelCase) to database (snake_case)
 * Automatically excludes computed columns
 */
export function transformCustomerToDB(formData: CustomerFormData, userId: string) {
  const payload = {
    customer_type: formData.customerType,
    customer_name: formData.customerName,
    email: formData.email || null,
    phone: formData.phone, // Updated field name
    id_number: formData.idNumber || null,
    address: formData.address || null,
    notes: formData.notes || null,
    updated_by: userId,
  };
  
  // Explicitly exclude computed columns (defensive programming)
  return excludeComputedColumns(payload, 'customers');
}

/**
 * Transform announcement data from database to TypeScript
 */
export function transformAnnouncementFromDB(dbAnnouncement: any): Announcement {
  return {
    id: dbAnnouncement.id,
    title: dbAnnouncement.title,
    content: dbAnnouncement.content,
    message: dbAnnouncement.message, // Computed field
    status: dbAnnouncement.status,
    priority: dbAnnouncement.priority,
    publishDate: dbAnnouncement.publish_date,
    expiryDate: dbAnnouncement.expiry_date,
    createdAt: dbAnnouncement.created_at,
    createdBy: dbAnnouncement.created_by,
    updatedAt: dbAnnouncement.updated_at,
    updatedBy: dbAnnouncement.updated_by, // New field
  };
}

/**
 * Transform announcement form data to database format
 * Automatically excludes computed columns
 */
export function transformAnnouncementToDB(
  formData: AnnouncementFormData,
  userId: string
) {
  const payload = {
    title: formData.title,
    content: formData.content,
    status: formData.status,
    priority: formData.priority || null,
    publish_date: formData.publishDate || null,
    expiry_date: formData.expiryDate || null,
    updated_by: userId, // New required field
  };
  
  // Explicitly exclude computed columns
  return excludeComputedColumns(payload, 'announcements');
}

/**
 * Transform database error to include correct field names
 */
export function transformDatabaseError(error: any): string {
  const errorMessage = error.message || 'Database error occurred';
  
  // Map common Postgres error patterns to field names
  const fieldPatterns = [
    { pattern: /column "(\w+)"/, group: 1 },
    { pattern: /constraint "(\w+)"/, group: 1 },
    { pattern: /table "(\w+)"/, group: 1 },
  ];
  
  for (const { pattern, group } of fieldPatterns) {
    const match = errorMessage.match(pattern);
    if (match && match[group]) {
      return `Database error on field "${match[group]}": ${errorMessage}`;
    }
  }
  
  return errorMessage;
}
```

**Design Rationale:**
- Centralized mapping logic prevents duplication and inconsistencies
- `excludeComputedColumns` provides defensive filtering for all mutations
- Error transformation extracts field names from PostgreSQL error messages
- Type-safe transformations ensure correct field mapping

### 3. Action Functions Layer (`lib/actions/`)

#### Customer Actions (`lib/actions/customers.ts`)

**Required Changes:**

```typescript
// Update imports
import {
  transformCustomerFromDB,
  transformCustomerToDB,
  excludeComputedColumns,
  transformDatabaseError,
} from './utils/mapping';

/**
 * Create a new customer
 */
export async function createCustomer(
  data: CustomerFormData
): Promise<{ 
  success: boolean; 
  customerId?: string; 
  error?: string; 
  validationErrors?: ValidationErrors 
}> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Authorization check using user_roles view
    const { data: userRole } = await supabase
      .from('user_roles') // Use view instead of profiles table
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['admin', 'manager'].includes(userRole.role)) {
      return { success: false, error: 'Permission denied' };
    }

    // Transform to database format (excludes computed columns)
    const customerData = transformCustomerToDB(data, user.id);
    
    // Set default status and timestamps
    const insertData = {
      ...customerData,
      status: 'active',
      created_by: user.id,
      updated_by: user.id,
    };

    // Insert customer
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { 
        success: false, 
        error: transformDatabaseError(error) 
      };
    }

    return { success: true, customerId: newCustomer.id };
  } catch (error: any) {
    return { 
      success: false, 
      error: transformDatabaseError(error) 
    };
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  customerId: string,
  data: Partial<CustomerFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Transform to database format (excludes computed columns)
    const updateData = transformCustomerToDB(data as CustomerFormData, user.id);

    const { error } = await supabase
      .from('customers')
      .update({
        ...updateData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (error) {
      return { 
        success: false, 
        error: transformDatabaseError(error) 
      };
    }

    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: transformDatabaseError(error) 
    };
  }
}

/**
 * Get customers with filters and pagination
 */
export async function getCustomers(
  filters?: CustomerFilters,
  page = 1,
  pageSize = 10,
  sort?: SortField
): Promise<PaginatedCustomers> {
  const supabase = await createServerClient();

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' });

  // Apply filters...
  // (existing filter logic)

  const { data, error, count } = await query;

  if (error) {
    throw new Error(transformDatabaseError(error));
  }

  // Transform all customers from database format
  const customers = (data || []).map(transformCustomerFromDB);

  return {
    customers,
    totalCount: count || 0,
    pageSize,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}
```

#### Announcement Actions (`lib/actions/announcements.ts`)

**Required Changes:**

```typescript
import {
  transformAnnouncementFromDB,
  transformAnnouncementToDB,
  transformDatabaseError,
} from './utils/mapping';

/**
 * Create a new announcement
 */
export async function createAnnouncement(
  data: AnnouncementFormData
): Promise<{ success: boolean; announcementId?: string; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Transform to database format (excludes computed columns)
    const announcementData = transformAnnouncementToDB(data, user.id);

    const insertData = {
      ...announcementData,
      created_by: user.id,
      updated_by: user.id, // New required field
    };

    const { data: newAnnouncement, error } = await supabase
      .from('announcements')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { 
        success: false, 
        error: transformDatabaseError(error) 
      };
    }

    return { success: true, announcementId: newAnnouncement.id };
  } catch (error: any) {
    return { 
      success: false, 
      error: transformDatabaseError(error) 
    };
  }
}

/**
 * Get all announcements
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(transformDatabaseError(error));
  }

  // Transform all announcements from database format
  return (data || []).map(transformAnnouncementFromDB);
}
```

### 4. Validation Layer (`lib/validation/`)

#### Customer Validation (`lib/validation/customer-validation.ts`)

**Required Changes:**

```typescript
/**
 * Validates phone format
 * Updated to validate 'phone' field instead of 'phoneNumber'
 */
export function validatePhone(phone: string): ValidationError {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone is required' };
  }

  const phonePattern = /^[\d\s\-()]{10,15}$/;
  if (!phonePattern.test(phone)) {
    return { 
      valid: false, 
      error: 'Phone must contain 10-15 characters' 
    };
  }

  return { valid: true };
}

/**
 * Validates entire customer form data
 * Excludes computed fields from validation
 */
export function validateCustomerFormData(data: CustomerFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate customer name (required)
  const customerNameValidation = validateCustomerName(data.customerName);
  if (!customerNameValidation.valid) {
    errors.customerName = customerNameValidation.error;
  }

  // Validate phone (required) - updated field name
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error; // Use 'phone' as error key
  }

  // Validate email (optional)
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }

  // Validate ID number (optional)
  const idNumberValidation = validateIdNumber(data.idNumber);
  if (!idNumberValidation.valid) {
    errors.idNumber = idNumberValidation.error;
  }

  // Validate address (optional)
  const addressValidation = validateAddress(data.address);
  if (!addressValidation.valid) {
    errors.address = addressValidation.error;
  }

  // NOTE: Do NOT validate computed fields (firstName, lastName, businessName)
  // These are generated by the database and should not be validated in forms

  return errors;
}
```

**Design Rationale:**
- Validation functions use field names matching the TypeScript types
- Error keys match the form field names for easy integration with UI
- Explicit comment warns against validating computed fields
- Computed fields are never part of form data, so no validation needed

#### Announcement Validation (`lib/validation/announcement-validation.ts`)

**New Validation Functions:**

```typescript
/**
 * Validates UUID format for updatedBy field
 */
export function validateUpdatedBy(updatedBy: string): ValidationError {
  if (!updatedBy || updatedBy.trim() === '') {
    return { valid: false, error: 'Updated by user ID is required' };
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(updatedBy)) {
    return { valid: false, error: 'Invalid user ID format' };
  }

  return { valid: true };
}

/**
 * Validates entire announcement form data
 * Excludes computed field (message) from validation
 */
export function validateAnnouncementFormData(
  data: AnnouncementFormData
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate title (required)
  if (!data.title || data.title.trim() === '') {
    errors.title = 'Title is required';
  }

  // Validate content (required)
  if (!data.content || data.content.trim() === '') {
    errors.content = 'Content is required';
  }

  // Validate updatedBy (required UUID)
  const updatedByValidation = validateUpdatedBy(data.updatedBy);
  if (!updatedByValidation.valid) {
    errors.updatedBy = updatedByValidation.error;
  }

  // NOTE: Do NOT validate computed field (message)
  // It is generated from content by the database

  return errors;
}
```

### 5. Database Schema Layer

#### Computed Column Definitions

The database schema includes the following computed columns:

**Customers Table:**
```sql
-- first_name: Returns customer_name for individual customers
ALTER TABLE customers
ADD COLUMN first_name TEXT 
GENERATED ALWAYS AS (
  CASE WHEN customer_type = 'individual' THEN customer_name ELSE NULL END
) STORED;

-- last_name: Always returns empty string
ALTER TABLE customers
ADD COLUMN last_name TEXT 
GENERATED ALWAYS AS ('') STORED;

-- business_name: Returns customer_name for business customers
ALTER TABLE customers
ADD COLUMN business_name TEXT
GENERATED ALWAYS AS (
  CASE WHEN customer_type = 'business' THEN customer_name ELSE NULL END
) STORED;
```

**Announcements Table:**
```sql
-- message: Copies content field value
ALTER TABLE announcements
ADD COLUMN message TEXT 
GENERATED ALWAYS AS (content) STORED;
```

**Design Rationale:**
- `STORED` strategy materializes computed values immediately
- Enables indexing on computed columns for query performance
- Provides backward compatibility with old schema expectations
- Business logic for first_name/business_name based on customer_type

#### Index Strategy

```sql
-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON customers(first_name);
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON customers(business_name);

-- Announcement indexes
CREATE INDEX IF NOT EXISTS idx_announcements_message ON announcements(message);
CREATE INDEX IF NOT EXISTS idx_announcements_updated_by ON announcements(updated_by);
```

**Design Rationale:**
- Indexes on commonly queried fields improve performance
- Computed columns can be indexed because they use STORED strategy
- Foreign key columns (updated_by) indexed for join performance

#### Foreign Key Constraints

```sql
-- Transactions → Customers
ALTER TABLE transactions
ADD CONSTRAINT transactions_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Transactions → Profiles
ALTER TABLE transactions
ADD CONSTRAINT transactions_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
```

**Design Rationale:**
- `ON DELETE CASCADE` ensures referential integrity
- Cascading deletes remove orphaned transaction records
- Foreign key names follow PostgreSQL convention (_fkey suffix)

#### User Roles View

```sql
DROP VIEW IF EXISTS user_roles CASCADE;
CREATE OR REPLACE VIEW user_roles AS
SELECT 
  id as user_id, 
  role, 
  is_active, 
  created_at 
FROM profiles;

GRANT SELECT ON user_roles TO authenticated, service_role;
```

**Design Rationale:**
- View provides abstraction over profiles table
- Column aliases match expected API contract
- Permissions granted to authenticated users for authorization checks
- `CREATE OR REPLACE` allows safe re-execution of migration

## Data Models

### Customer Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     UI Form                              │
│  CustomerFormData (camelCase):                          │
│  {                                                       │
│    customerType: 'individual',                          │
│    customerName: 'John Doe',                            │
│    phone: '555-1234',                                   │
│    email: 'john@example.com'                            │
│  }                                                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ validateCustomerFormData()
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Validation Layer                          │
│  Validates: customerName, phone, email                  │
│  Excludes: firstName, lastName, businessName            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ transformCustomerToDB()
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Database Payload                          │
│  {                                                       │
│    customer_type: 'individual',                         │
│    customer_name: 'John Doe',                           │
│    phone: '555-1234',              ← Renamed field     │
│    email: 'john@example.com',                           │
│    created_by: 'user-uuid',                             │
│    updated_by: 'user-uuid'                              │
│  }                                                       │
│  ❌ Excludes: first_name, last_name, business_name     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Supabase INSERT
                      │
┌─────────────────────▼───────────────────────────────────┐
│              PostgreSQL Database                         │
│  Stores all fields including computed:                  │
│  - phone (renamed from phone_number)                    │
│  - first_name (generated: 'John Doe')                  │
│  - last_name (generated: '')                            │
│  - business_name (generated: NULL)                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Supabase SELECT
                      │
┌─────────────────────▼───────────────────────────────────┐
│           Database Record (snake_case)                   │
│  {                                                       │
│    id: 'cust-uuid',                                     │
│    customer_type: 'individual',                         │
│    customer_name: 'John Doe',                           │
│    phone: '555-1234',                                   │
│    first_name: 'John Doe',         ← Computed          │
│    last_name: '',                  ← Computed          │
│    business_name: null,            ← Computed          │
│    ...                                                   │
│  }                                                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ transformCustomerFromDB()
                      │
┌─────────────────────▼───────────────────────────────────┐
│           TypeScript Object (camelCase)                  │
│  Customer {                                             │
│    id: 'cust-uuid',                                     │
│    customerType: 'individual',                          │
│    customerName: 'John Doe',                            │
│    phone: '555-1234',              ← Mapped            │
│    readonly firstName: 'John Doe', ← Read-only         │
│    readonly lastName: '',          ← Read-only         │
│    readonly businessName: null,    ← Read-only         │
│    ...                                                   │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

### Announcement Data Flow

```
Form Data → Validation → Transform to DB → INSERT/UPDATE → Database
    ↓           ↓              ↓               ↓              ↓
camelCase   Excludes      snake_case      Excludes      Generates
            'message'                     'message'      'message'
                                                           field
    
Database → SELECT → Transform to TS → TypeScript Object
    ↓                     ↓                    ↓
Includes             camelCase         readonly message
'message'            mapping
```

## Interfaces

### Mapping Layer Interface

```typescript
// lib/actions/utils/mapping.ts

/**
 * Transform database record to TypeScript object
 */
export interface TransformFromDB<TDB, TTS> {
  (dbRecord: TDB): TTS;
}

/**
 * Transform TypeScript form data to database payload
 */
export interface TransformToDB<TForm, TDB> {
  (formData: TForm, userId: string): TDB;
}

/**
 * Exclude computed columns from payload
 */
export interface ExcludeComputed<T> {
  (data: T, table: 'customers' | 'announcements'): Partial<T>;
}

/**
 * Transform database error to user-friendly message
 */
export interface TransformError {
  (error: any): string;
}
```

### Action Function Interfaces

All action functions follow consistent return types:

```typescript
// Success/Error response for mutations
interface ActionResponse {
  success: boolean;
  error?: string;
  validationErrors?: ValidationErrors;
}

// Response for create operations
interface CreateResponse extends ActionResponse {
  customerId?: string; // or announcementId, etc.
}

// Response for queries
interface QueryResponse<T> {
  data: T[];
  error?: string;
}

// Paginated response
interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}
```

## Error Handling

### Error Transformation Strategy

```typescript
/**
 * Error handling hierarchy:
 * 1. Catch database errors at action layer
 * 2. Transform to include field names
 * 3. Return user-friendly error messages
 */

// Example error transformation
function transformDatabaseError(error: any): string {
  if (error.code === '23505') {
    // Unique constraint violation
    return 'A record with this value already exists';
  }
  
  if (error.code === '23503') {
    // Foreign key violation
    return 'Referenced record does not exist';
  }
  
  if (error.code === '23502') {
    // Not null violation
    const match = error.message.match(/column "(\w+)"/);
    const field = match ? match[1] : 'field';
    return `${field} is required`;
  }
  
  // Extract field name from error message
  const fieldMatch = error.message.match(/column "(\w+)"/);
  if (fieldMatch) {
    return `Error in field "${fieldMatch[1]}": ${error.message}`;
  }
  
  return error.message || 'Database operation failed';
}
```

### Validation Error Format

```typescript
interface ValidationErrors {
  [fieldName: string]: string | undefined;
}

// Example:
{
  phone: 'Phone must contain 10-15 characters',
  email: 'Please enter a valid email'
}
```

**Design Rationale:**
- Field names match TypeScript property names (camelCase)
- UI can directly map errors to form fields
- One error message per field for clarity

## Migration Strategy

### Phase 1: Database Migration
1. Run `RUN_ALL_COMPATIBILITY_FIXES.sql`
2. Verify all columns, indexes, constraints created
3. Test computed column generation with sample data

### Phase 2: TypeScript Type Updates
1. Update `lib/types/customer.ts`
2. Update `lib/types/announcement.ts`
3. Create `lib/types/user-roles.ts`
4. Mark computed fields as `readonly`

### Phase 3: Mapping Layer Implementation
1. Create `lib/actions/utils/mapping.ts`
2. Implement transformation functions
3. Implement computed column filtering
4. Implement error transformation

### Phase 4: Action Function Updates
1. Update `lib/actions/customers.ts`
2. Update `lib/actions/announcements.ts`
3. Replace direct transformations with mapping utilities
4. Update authorization checks to use `user_roles` view

### Phase 5: Validation Updates
1. Update `lib/validation/customer-validation.ts`
2. Create `lib/validation/announcement-validation.ts`
3. Update field names in validation functions
4. Add UUID validation for `updatedBy`

### Phase 6: Testing & Verification
1. Test create operations exclude computed columns
2. Test read operations include computed columns
3. Test error messages include field names
4. Test validation uses correct field names

## Testing Strategy

The testing strategy combines property-based testing for universal behaviors with example-based testing for specific scenarios and smoke tests for infrastructure verification.

### Property-Based Tests

Property-based tests will verify universal behaviors across randomly generated inputs using a minimum of 100 iterations per property.

### Integration Tests

Integration tests verify infrastructure and external service behavior with representative examples rather than extensive randomization.

### Smoke Tests

Smoke tests verify one-time infrastructure setup and configuration.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Bidirectional Field Name Mapping

*For any* database record from customers or announcements tables, when transformed to TypeScript and back to database format, the field values shall be preserved and field names shall correctly convert between snake_case (database) and camelCase (TypeScript).

**Validates: Requirements 1.1, 1.3, 2.1, 10.1, 10.2, 10.3, 10.4**

### Property 2: Computed Columns Excluded from Mutations

*For any* insert or update operation on customers or announcements tables, the database payload shall not include computed column names (`first_name`, `last_name`, `business_name` for customers; `message` for announcements).

**Validates: Requirements 1.2, 1.4, 2.2, 2.4, 8.6**

### Property 3: Individual Customer First Name Generation

*For any* customer record where `customer_type` is 'individual', the computed column `first_name` shall equal the value of `customer_name`.

**Validates: Requirements 8.1**

### Property 4: Business Customer Business Name Generation

*For any* customer record where `customer_type` is 'business', the computed column `business_name` shall equal the value of `customer_name`.

**Validates: Requirements 8.3**

### Property 5: Customer Last Name Always Empty

*For any* customer record regardless of `customer_type`, the computed column `last_name` shall always equal an empty string.

**Validates: Requirements 8.2**

### Property 6: Announcement Message Equals Content

*For any* announcement record, the computed column `message` shall equal the value of `content`.

**Validates: Requirements 8.4**

### Property 7: Validation Excludes Computed Fields

*For any* customer or announcement form data, the validation function shall not perform validation on computed fields (`firstName`, `lastName`, `businessName` for customers; `message` for announcements).

**Validates: Requirements 3.2, 3.4**

### Property 8: Validation Field Name Correctness

*For any* validation error returned by validation functions, the error object keys shall match the TypeScript property names (camelCase) of the form data.

**Validates: Requirements 3.1, 3.5, 3.6**

### Property 9: Updated By UUID Validation

*For any* announcement form data, the `updatedBy` field validation shall require a valid UUID format (8-4-4-4-12 hexadecimal pattern).

**Validates: Requirements 3.3**

### Property 10: Database Error Field Extraction

*For any* database error caught by action functions, the transformed error message shall include the field name extracted from the PostgreSQL error message when a field name is present.

**Validates: Requirements 2.7**

### Property 11: Foreign Key Column References

*For any* query operation that joins tables with foreign key relationships, the JOIN clause shall use the correct column names matching the database schema (e.g., `customer_id`, `created_by`, `updated_by`).

**Validates: Requirements 2.6**

## Deployment Considerations

### Database Migration Execution
- Run `RUN_ALL_COMPATIBILITY_FIXES.sql` during maintenance window
- Script is idempotent and can be safely re-run
- Verify completion using built-in verification queries
- Monitor Supabase dashboard for schema cache reload

### TypeScript Deployment
- Deploy type updates before action function updates to maintain type safety
- Run TypeScript compiler (`tsc --noEmit`) to verify no type errors
- Update all imports to use new mapping utilities

### Rollback Strategy
- Database changes are backward compatible (old column names still work via aliases)
- TypeScript changes are forward compatible (new field names map correctly)
- Can roll back TypeScript code without rolling back database
- Cannot roll back database without updating TypeScript (computed columns are required)

### Performance Impact
- Computed columns are STORED, so no runtime computation cost
- Indexes on computed columns improve query performance
- Transformation functions add minimal overhead (object mapping)
- No change to query patterns or database access frequency

## Security Considerations

### Row-Level Security (RLS)
- All existing RLS policies remain functional
- user_roles view respects profile table RLS
- Computed columns inherit RLS from base table

### Authorization
- Authorization checks updated to use `user_roles` view
- View permissions granted only to authenticated users
- No elevation of privileges through view access

### Data Validation
- All inputs validated before database operations
- UUID validation prevents injection attacks
- Phone and email validation prevents malformed data

### Error Messages
- Error messages include field names but not sensitive data
- Database error messages sanitized before returning to client
- No exposure of internal database structure in errors

## Monitoring & Observability

### Metrics to Track
- Database query performance on computed columns
- Error rate for database operations
- Validation error frequency by field
- Mapping transformation performance

### Logging Strategy
- Log all database errors with field names
- Log validation failures with error details
- Log authorization failures for security monitoring
- Do not log sensitive customer data (email, phone, names)

### Health Checks
- Verify user_roles view accessibility
- Verify computed columns are generating correctly
- Monitor foreign key constraint violations
- Track index usage on new columns

## Future Enhancements

### Potential Improvements
1. **Type-Safe Query Builder**: Create a typed query builder that automatically handles field name mapping
2. **Automated Migration Generation**: Generate TypeScript types from database schema automatically
3. **Validation Schema Generation**: Generate validation schemas from TypeScript types
4. **Computed Column Expansion**: Add more computed columns for common queries (full_name, display_name)
5. **GraphQL Integration**: Expose user_roles view through GraphQL API
6. **Real-time Subscriptions**: Add real-time subscriptions for customer and announcement changes

### Technical Debt to Address
1. Remove all references to old field names in codebase
2. Add comprehensive integration tests for all mapping functions
3. Document mapping layer in API documentation
4. Create developer guide for adding new tables with computed columns
