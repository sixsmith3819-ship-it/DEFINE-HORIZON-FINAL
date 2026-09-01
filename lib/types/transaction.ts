/**
 * Transaction Management Types
 * TypeScript interfaces and types for financial transactions
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
  Cancelled = 'cancelled',
}

// Base Transaction Interface
export interface Transaction {
  id: string;
  transactionNumber: string;
  customerId: string;
  serviceProvider: ServiceProvider;
  transactionType: TransactionType;
  transactionDirection: TransactionDirection;
  amount: number;
  currency: string;
  commissionRate: number;
  commissionAmount: number;
  totalAmount: number;
  status: TransactionStatus;
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

// Transaction with customer and employee details
export interface TransactionWithDetails extends Transaction {
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    customerType: string;
    email: string;
    phone: string;
    nationalId?: string;
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
  serviceProvider: ServiceProvider;
  transactionType: TransactionType;
  transactionDirection: TransactionDirection;
  amount: string;
  currency: string;
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
  serviceProvider?: ServiceProvider | 'all';
  transactionType?: TransactionType | 'all';
  transactionDirection?: TransactionDirection | 'all';
  status?: TransactionStatus | 'all';
  employeeId?: string | 'all';
}

// Transaction Summary (Admin Dashboard)
export interface TransactionSummary {
  totalTransactions: number;
  todayTransactions: number;
  totalAmount: number;
  totalCommission: number;
  inboundCount: number;
  inboundAmount: number;
  outboundCount: number;
  outboundAmount: number;
  localCount: number;
  localAmount: number;
  internationalCount: number;
  internationalAmount: number;
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
}

// Service Provider Statistics
export interface ServiceProviderStats {
  provider: ServiceProvider;
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
  [key: string]: string[];
}
