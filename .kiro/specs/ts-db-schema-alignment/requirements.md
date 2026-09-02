# Requirements Document

## Introduction

THE System SHALL align TypeScript type definitions, action functions, and validation logic with the PostgreSQL database schema after SQL compatibility fixes have been applied. The database schema was modified through `RUN_ALL_COMPATIBILITY_FIXES.sql` to add computed columns and rename fields for backward compatibility. The TypeScript codebase must be updated to reflect these schema changes while maintaining type safety and data integrity.

## Glossary

- **TypeScript_Layer**: The client-side and server-side TypeScript code including type definitions, actions, and validations
- **Database_Schema**: The PostgreSQL database structure defined in Supabase including tables, columns, views, and constraints
- **Compatibility_Script**: The SQL script `RUN_ALL_COMPATIBILITY_FIXES.sql` that modifies the database schema
- **Customers_Table**: The database table storing customer information with fields for individuals and businesses
- **Announcements_Table**: The database table storing system announcements
- **Transactions_Table**: The database table storing financial transactions
- **User_Roles_View**: A database view providing user role information from the profiles table
- **Type_Definitions**: TypeScript interfaces and types located in `lib/types/` directory
- **Action_Functions**: Server-side functions in `lib/actions/` that interact with the database
- **Validation_Functions**: Input validation functions in `lib/validation/` directory
- **Computed_Column**: A database column whose value is automatically generated from other columns
- **RLS_Policy**: Row Level Security policy controlling data access permissions

## Requirements

### Requirement 1

**User Story:** As a developer, I want the TypeScript type definitions to match the database schema, so that I can write type-safe code without runtime errors

#### Acceptance Criteria

1.1. WHEN the Customers_Table schema is modified, THE TypeScript_Layer SHALL update customer type definitions to include the `phone` field instead of `phone_number`

1.2. WHEN the Customers_Table schema includes computed columns, THE TypeScript_Layer SHALL define types for `first_name`, `last_name`, and `business_name` as generated fields

1.3. WHEN the Announcements_Table schema is modified, THE TypeScript_Layer SHALL update announcement type definitions to include the `updated_by` field

1.4. WHEN the Announcements_Table schema includes computed columns, THE TypeScript_Layer SHALL define the `message` field as a computed field derived from `content`

1.5. THE TypeScript_Layer SHALL define all database field names using snake_case naming convention matching the Database_Schema

1.6. THE TypeScript_Layer SHALL define nullable fields with TypeScript optional or null union types matching database constraints

1.7. THE TypeScript_Layer SHALL define enum types matching database CHECK constraints for status and type fields

### Requirement 2

**User Story:** As a developer, I want action functions to use correct column names, so that database queries execute successfully

#### Acceptance Criteria

2.1. WHEN inserting customer data, THE Action_Functions SHALL use `phone` as the column name instead of `phone_number`

2.2. WHEN querying customer data, THE Action_Functions SHALL NOT attempt to insert or update computed columns `first_name`, `last_name`, or `business_name`

2.3. WHEN inserting announcement data, THE Action_Functions SHALL include the `updated_by` field in INSERT operations

2.4. WHEN querying announcement data, THE Action_Functions SHALL NOT attempt to insert or update the computed column `message`

2.5. WHEN querying user roles, THE Action_Functions SHALL use the `user_roles` view instead of querying the profiles table directly

2.6. WHEN the Database_Schema includes foreign key relationships, THE Action_Functions SHALL reference the correct table names and column names in JOIN operations

2.7. WHEN performing database operations, THE Action_Functions SHALL handle database errors with descriptive error messages indicating the field causing the error

### Requirement 3

**User Story:** As a developer, I want validation functions to validate correct field names, so that validation errors are meaningful

#### Acceptance Criteria

3.1. WHEN validating customer input, THE Validation_Functions SHALL validate the `phone` field instead of `phone_number`

3.2. WHEN validating customer input, THE Validation_Functions SHALL NOT validate computed fields `first_name`, `last_name`, or `business_name`

3.3. WHEN validating announcement input, THE Validation_Functions SHALL validate the `updated_by` field as a required UUID

3.4. WHEN validating announcement input, THE Validation_Functions SHALL NOT validate the computed field `message`

3.5. THE Validation_Functions SHALL return validation errors using the correct field names matching the Database_Schema

3.6. WHEN a validation error occurs, THE Validation_Functions SHALL provide error messages that reference the database field name

### Requirement 4

**User Story:** As a developer, I want indexes to be created on renamed columns, so that query performance is maintained

#### Acceptance Criteria

4.1. WHEN the `phone_number` column is renamed to `phone`, THE Database_Schema SHALL create an index `idx_customers_phone` on the `phone` column

4.2. WHEN computed columns are added to Customers_Table, THE Database_Schema SHALL create indexes on `first_name` and `business_name` fields

4.3. WHEN computed columns are added to Announcements_Table, THE Database_Schema SHALL create an index on the `message` field

4.4. WHEN the `updated_by` column is added to Announcements_Table, THE Database_Schema SHALL create an index on the `updated_by` field

### Requirement 5

**User Story:** As a developer, I want foreign key relationships to be correctly defined, so that referential integrity is enforced

#### Acceptance Criteria

5.1. WHEN the Transactions_Table references the Customers_Table, THE Database_Schema SHALL use a foreign key constraint `transactions_customer_id_fkey` that references `customers.id` with ON DELETE CASCADE

5.2. WHEN the Transactions_Table references the profiles table, THE Database_Schema SHALL use a foreign key constraint `transactions_created_by_fkey` that references `profiles.id` with ON DELETE CASCADE

5.3. WHEN foreign key constraints are recreated, THE Compatibility_Script SHALL drop existing constraints before creating new ones

5.4. WHEN foreign key constraints are modified, THE Database_Schema SHALL notify the Supabase schema cache to reload

### Requirement 6

**User Story:** As a developer, I want the User_Roles_View to provide consistent role information, so that permission checks work correctly

#### Acceptance Criteria

6.1. THE User_Roles_View SHALL expose `user_id`, `role`, `is_active`, and `created_at` fields from the profiles table

6.2. THE User_Roles_View SHALL be accessible to authenticated and service_role users

6.3. WHEN the profiles table schema changes, THE Database_Schema SHALL recreate the User_Roles_View using CREATE OR REPLACE VIEW

6.4. WHEN querying user roles, THE Action_Functions SHALL use the User_Roles_View instead of directly querying the profiles table

### Requirement 7

**User Story:** As a database administrator, I want the compatibility script to be idempotent, so that it can be run multiple times safely

#### Acceptance Criteria

7.1. WHEN renaming columns, THE Compatibility_Script SHALL check if the old column name exists before attempting to rename

7.2. WHEN adding columns, THE Compatibility_Script SHALL check if the column already exists before attempting to add it

7.3. WHEN creating indexes, THE Compatibility_Script SHALL use CREATE INDEX IF NOT EXISTS to avoid errors on duplicate execution

7.4. WHEN dropping views, THE Compatibility_Script SHALL use DROP VIEW IF EXISTS CASCADE before recreating

7.5. WHEN the Compatibility_Script completes, THE Compatibility_Script SHALL output a verification report showing the final schema state

7.6. IF a schema modification fails, THEN THE Compatibility_Script SHALL log a descriptive notice and continue with remaining operations

### Requirement 8

**User Story:** As a developer, I want computed columns to be properly defined, so that they automatically update when source data changes

#### Acceptance Criteria

8.1. THE Customers_Table SHALL define `first_name` as a GENERATED ALWAYS column that returns `customer_name` when `customer_type` is 'individual'

8.2. THE Customers_Table SHALL define `last_name` as a GENERATED ALWAYS column that returns an empty string

8.3. THE Customers_Table SHALL define `business_name` as a GENERATED ALWAYS column that returns `customer_name` when `customer_type` is 'business'

8.4. THE Announcements_Table SHALL define `message` as a GENERATED ALWAYS column that returns the value of `content`

8.5. WHEN a computed column is defined, THE Database_Schema SHALL use STORED generation strategy for immediate materialization

8.6. WHEN inserting or updating records, THE TypeScript_Layer SHALL NOT include computed columns in the data payload

### Requirement 9

**User Story:** As a developer, I want comprehensive verification of schema changes, so that I can confirm all modifications were applied correctly

#### Acceptance Criteria

9.1. WHEN the Compatibility_Script completes, THE Compatibility_Script SHALL query the Customers_Table columns and display `customer_name`, `phone`, `phone_number`, `first_name`, `last_name`, and `business_name` status

9.2. WHEN the Compatibility_Script completes, THE Compatibility_Script SHALL query the Announcements_Table columns and display `content`, `message`, `title`, `updated_by`, and `updated_at` status

9.3. WHEN the Compatibility_Script completes, THE Compatibility_Script SHALL query the information_schema.views and verify the User_Roles_View exists

9.4. WHEN the Compatibility_Script completes, THE Compatibility_Script SHALL query the information_schema.table_constraints and verify all foreign key constraints exist

9.5. WHEN the Compatibility_Script completes, THE Compatibility_Script SHALL display a final status message indicating "ALL COMPATIBILITY FIXES COMPLETED!"

### Requirement 10

**User Story:** As a developer, I want TypeScript action functions to handle schema transitions gracefully, so that both old and new field names are supported during migration

#### Acceptance Criteria

10.1. WHEN querying customer data, THE Action_Functions SHALL map the database `phone` field to TypeScript `phoneNumber` property for backward compatibility

10.2. WHEN querying announcement data, THE Action_Functions SHALL map the database `updated_by` field to TypeScript `updatedBy` property

10.3. WHEN transforming database records to TypeScript objects, THE Action_Functions SHALL use consistent camelCase naming for all properties

10.4. WHEN receiving TypeScript objects for database insertion, THE Action_Functions SHALL convert camelCase property names to snake_case column names

10.5. THE Action_Functions SHALL maintain a mapping layer between TypeScript conventions and database conventions for all tables
