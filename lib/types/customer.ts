/**
 * Customer Management Types
 * Comprehensive TypeScript interfaces and types for all customer entities
 */

// Enums
export enum CustomerType {
  Individual = 'individual',
  Business = 'business',
}

export enum CustomerStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export enum InteractionType {
  Note = 'note',
  Call = 'call',
  Email = 'email',
  Meeting = 'meeting',
  Action = 'action',
}

export enum OperationType {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Assign = 'assign',
  Reactivate = 'reactivate',
}

// Base Customer Interface
export interface BaseCustomer {
  id: string;
  customerType: CustomerType;
  status: CustomerStatus;
  email: string;
  phone: string;
  address: string;
  assignedEmployeeId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Individual Customer Interface
export interface IndividualCustomer extends BaseCustomer {
  customerType: CustomerType.Individual;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

// Business Customer Interface
export interface BusinessCustomer extends BaseCustomer {
  customerType: CustomerType.Business;
  businessName: string;
  contactPerson: string;
  businessRegistrationNumber: string;
  taxId?: string;
  website?: string;
}

// Discriminated Union for Customer
export type Customer = IndividualCustomer | BusinessCustomer;

// Customer Interaction Interface
export interface CustomerInteraction {
  id: string;
  customerId: string;
  interactionType: InteractionType;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;
  deletedBy?: string;
}

// Audit Log Entry Interface
export interface AuditLogEntry {
  id: string;
  customerId: string;
  operationType: OperationType;
  fieldName?: string;
  previousValue?: string;
  newValue?: string;
  details?: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

// Customer Detail (includes interactions and audit log)
export interface CustomerDetail extends BaseCustomer {
  interactions: CustomerInteraction[];
  auditLog: AuditLogEntry[];
  // Customer type specific fields (combined for union flexibility)
  customerType: CustomerType;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  businessName?: string;
  contactPerson?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  website?: string;
}

// Customer Form Data for Create/Update
export interface CustomerFormData {
  customerType: CustomerType;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  businessName?: string;
  contactPerson?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  website?: string;
  email: string;
  phone: string;
  address: string;
}

// Customer Filters
export interface CustomerFilters {
  status?: CustomerStatus;
  customerType?: CustomerType;
  createdAfter?: string;
  createdBefore?: string;
}

// Sort Field
export interface SortField {
  field: 'name' | 'email' | 'createdAt' | 'status';
  direction: 'asc' | 'desc';
}

// Paginated Customers Response
export interface PaginatedCustomers {
  customers: Customer[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

// User Role Type
export type UserRole = 'admin' | 'manager' | 'employee';

// Validation Error Response
export interface ValidationError {
  valid: boolean;
  error?: string;
}

// Validation Errors Object
export interface ValidationErrors {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  businessName?: string;
  contactPerson?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  website?: string;
  address?: string;
  [key: string]: string | undefined;
}

// Permission Check Result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// Audit Log Creation Result
export interface AuditLogResult {
  success: boolean;
  entryId?: string;
  error?: string;
}

// Field Change for Audit Logging
export interface FieldChange {
  fieldName: string;
  previousValue?: string;
  newValue: string;
}
