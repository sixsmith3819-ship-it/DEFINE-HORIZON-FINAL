/**
 * Transaction Management Types
 * TypeScript interfaces and types for financial transactions
 * ALIGNED WITH ACTUAL DATABASE SCHEMA
 */

// Enums
export enum ServiceProvider {
  EcoCash = 'EcoCash',
  Mukuru = 'Mukuru',
  MamaMoney = 'Mama Money',
  MOOVAR = 'MOOVAR',
  WorldRemit = 'WorldRemit',
}

export enum TransactionType {
  Local = 'local',
  International = 'international',
}
export enum TransactionDirection {
  Inbound = 'inbound',
  Outbound = 'outbound',
}


export enum TransactionStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

// Base Transaction Interface (matches actual DB columns)
export interface Transaction {
  id: string;
  customerId: string;
  serviceProvider: string;
  transactionType: TransactionType;
  amount: number;
  commissionRate: number | null;
  commissionAmount: number | null;
  paymentMethod: string;
  referenceNumber: string | null;
  status: TransactionStatus;
  notes: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

// Transaction with customer and employee details
export interface TransactionWithDetails extends Transaction {
  customer: {
    id: string;
    customerName: string;
    customerType: string;
    email: string | null;
    phone: string;
  };
  createdByEmployee: {
    id: string;
    fullName: string;
    email: string;
  };
}

// Transaction Form Data
export interface TransactionFormData {
  customerId: string;
  serviceProvider: string;
  transactionType: TransactionType;
  amount: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

// Commission Rate
export interface CommissionRate {
  transactionType: TransactionType;
  rate: number;
}

// Transaction Filters
export interface TransactionFilters {
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  serviceProvider?: string | 'all';
  transactionType?: TransactionType | 'all';
  status?: TransactionStatus | 'all';
  employeeId?: string | 'all';
}

// Transaction Summary (Admin Dashboard)
export interface TransactionSummary {
  totalTransactions: number;
  todayTransactions: number;
  totalAmount: number;
  totalCommission: number;
  localCount: number;
  localAmount: number;
  internationalCount: number;
  internationalAmount: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
}

// Service Provider Statistics
export interface ServiceProviderStats {
  provider: string;
  count: number;
  totalAmount: number;
  commission: number;
}

// Paginated Transactions
export interface PaginatedTransactions {
  transactions: TransactionWithDetails[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

// Validation Errors
export interface ValidationErrors {
  [key: string]: string;
}

