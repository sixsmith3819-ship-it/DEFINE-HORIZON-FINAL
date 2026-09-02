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
  Action = 'action',
}

// Base Customer Interface
export interface BaseCustomer {
  id: string;
  customerType: CustomerType;
  customerName: string;
  status: CustomerStatus;
  email: string | null;
  phoneNumber: string;
  idNumber: string | null;
  address: string | null;
  assignedEmployeeId: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string | null;
}

// Individual Customer Interface
export interface IndividualCustomer extends BaseCustomer {
  customerType: CustomerType.Individual;
}

// Business Customer Interface
export interface BusinessCustomer extends BaseCustomer {
  customerType: CustomerType.Business;
}

// Discriminated Union for Customer
export type Customer = IndividualCustomer | BusinessCustomer;

// Customer Interaction Interface
export interface CustomerInteraction {
  id: string;
  customerId: string;
  interactionType: string;
  notes: string;
  createdAt: string;
  createdBy: string;
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
}

// Customer Form Data for Create/Update
export interface CustomerFormData {
  customerType: CustomerType;
  customerName: string;
  email?: string;
  phoneNumber: string;
  idNumber?: string;
  address?: string;
  notes?: string;
}

// Validation Errors
export type ValidationErrors = Record<string, string>;

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
  phoneNumber?: string;
  customerName?: string;
  idNumber?: string;
  address?: string;
  notes?: string;
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
