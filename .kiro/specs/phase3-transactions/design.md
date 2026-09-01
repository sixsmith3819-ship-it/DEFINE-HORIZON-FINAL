# Design Document: Financial Transaction Management Module

## 1. Architecture Overview

The Financial Transaction Management Module follows the established Horizon BMS architecture:

- **Frontend**: Next.js 16 App Router with TypeScript + Tailwind CSS
- **Backend**: Supabase PostgreSQL with Row Level Security (RLS)
- **State Management**: Server Actions for mutations, React hooks for client state
- **Authentication**: Supabase Auth with role-based access (admin/employee)
- **Data Flow**: Server Components → Server Actions → Supabase → RLS Policies

### Integration Points

`
Phase 1 (Auth/Roles) ←─────┐
                            │
Phase 2 (Customers) ←───────┼──→ Phase 3 (Transactions)
                            │
                            └──→ Future Phases
`

---

## 2. Database Schema

### 2.1 Tables

#### 	ransactions Table

`sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Customer Information
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  
  -- Transaction Details
  service_provider VARCHAR(50) NOT NULL CHECK (service_provider IN ('EcoCash', 'Mukuru', 'Mama Money', 'MOOVAR', 'WorldRemit')),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('local', 'international')),
  transaction_direction VARCHAR(10) NOT NULL CHECK (transaction_direction IN ('inbound', 'outbound')),
  
  -- Financial Information
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  
  -- Status and Metadata
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Status Change Tracking
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT
);

-- Indexes
CREATE INDEX idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_service_provider ON public.transactions(service_provider);
CREATE INDEX idx_transactions_transaction_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_transaction_direction ON public.transactions(transaction_direction);
CREATE INDEX idx_transactions_number ON public.transactions(transaction_number);

-- Auto-generate transaction number
CREATE SEQUENCE transaction_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.transaction_number := 'TXN-' || LPAD(nextval('transaction_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_number
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.transaction_number IS NULL)
  EXECUTE FUNCTION generate_transaction_number();

-- Auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
`

#### commission_rates Table

`sql
CREATE TABLE public.commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(20) UNIQUE NOT NULL CHECK (transaction_type IN ('local', 'international')),
  rate DECIMAL(5, 2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT
);

-- Seed default rates
INSERT INTO public.commission_rates (transaction_type, rate, notes)
VALUES 
  ('local', 8.00, 'Default local transaction commission rate'),
  ('international', 10.00, 'Default international transaction commission rate');
`

#### 	ransaction_audit_log Table

`sql
CREATE TABLE public.transaction_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_transaction_audit_log_transaction ON public.transaction_audit_log(transaction_id);
CREATE INDEX idx_transaction_audit_log_created_at ON public.transaction_audit_log(created_at DESC);
`

### 2.2 Row Level Security (RLS) Policies

`sql
-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_audit_log ENABLE ROW LEVEL SECURITY;

-- Transactions Policies

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Employees can view their own transactions
CREATE POLICY "Employees can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'employee'
    )
    AND created_by = auth.uid()
  );

-- Employees and admins can create transactions
CREATE POLICY "Users can create transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Only admins can update transaction status
CREATE POLICY "Admins can update transactions"
  ON public.transactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Commission Rates Policies
CREATE POLICY "All authenticated users can view commission rates"
  ON public.commission_rates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify commission rates"
  ON public.commission_rates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit Log Policies
CREATE POLICY "Admins can view all audit logs"
  ON public.transaction_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.transaction_audit_log
  FOR INSERT
  WITH CHECK (true);
`

---

## 3. TypeScript Types

### 3.1 Enums

`	ypescript
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
`

### 3.2 Interfaces

`	ypescript
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

export interface TransactionWithDetails extends Transaction {
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
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

export interface TransactionFormData {
  customerId: string;
  serviceProvider: ServiceProvider;
  transactionType: TransactionType;
  transactionDirection: TransactionDirection;
  amount: string;
  currency: string;
  notes?: string;
}

export interface CommissionRate {
  id: string;
  transactionType: TransactionType;
  rate: number;
  effectiveFrom: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

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

export interface ServiceProviderStats {
  provider: ServiceProvider;
  count: number;
  totalAmount: number;
  commission: number;
}
`

---

## 4. Server Actions

### 4.1 Transaction CRUD Actions

**File**: lib/actions/transactions.ts

`	ypescript
'use server';

export async function createTransaction(
  data: TransactionFormData
): Promise<{ success: boolean; transactionId?: string; transactionNumber?: string; error?: string; validationErrors?: ValidationErrors }> {
  // 1. Authenticate user
  // 2. Get commission rate based on transaction type
  // 3. Calculate commission and total
  // 4. Validate form data
  // 5. Insert transaction with Supabase service role
  // 6. Create audit log entry
  // 7. Return success with transaction ID and number
}

export async function getTransactions(
  page: number = 1,
  pageSize: number = 25,
  filters?: TransactionFilters
): Promise<PaginatedTransactions & { success?: boolean; error?: string }> {
  // 1. Authenticate user and get role
  // 2. Build query with role-based filtering (admin sees all, employee sees own)
  // 3. Apply search and filters
  // 4. Join with customers and profiles for display
  // 5. Paginate results
  // 6. Return paginated transaction list
}

export async function getTransactionDetail(
  transactionId: string
): Promise<{ success: boolean; transaction?: TransactionWithDetails; error?: string; statusCode?: number }> {
  // 1. Authenticate user
  // 2. Fetch transaction with customer and employee details
  // 3. Check permissions (admin or creator)
  // 4. Return transaction details
}

export async function updateTransactionStatus(
  transactionId: string,
  newStatus: TransactionStatus,
  cancellationReason?: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Authenticate user and verify admin role
  // 2. Fetch current transaction
  // 3. Validate status transition (pending→completed/cancelled only)
  // 4. Update status with timestamp and user
  // 5. Create audit log entry
  // 6. Return success
}

export async function getTransactionSummary(
  dateFrom?: string,
  dateTo?: string
): Promise<{ success: boolean; summary?: TransactionSummary; error?: string }> {
  // 1. Authenticate user and verify admin role
  // 2. Query transactions within date range
  // 3. Calculate aggregate statistics
  // 4. Return summary data
}

export async function getServiceProviderStats(
  dateFrom?: string,
  dateTo?: string
): Promise<{ success: boolean; stats?: ServiceProviderStats[]; error?: string }> {
  // 1. Authenticate user and verify admin role
  // 2. Group transactions by service provider
  // 3. Calculate counts, amounts, and commissions
  // 4. Return provider statistics
}

export async function getCommissionRates(): Promise<{ success: boolean; rates?: CommissionRate[]; error?: string }> {
  // 1. Fetch current commission rates
  // 2. Return rates array
}

export async function updateCommissionRate(
  transactionType: TransactionType,
  rate: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Authenticate user and verify admin role
  // 2. Validate rate (0-100%)
  // 3. Update commission_rates table
  // 4. Create audit log entry
  // 5. Return success
}
`

---

## 5. UI Components

### 5.1 Pages

#### /transactions (List Page)
- **Role**: Admin (all transactions), Employee (own transactions)
- **Components**: TransactionList, SearchAndFilter
- **Features**: Pagination, search, multi-filter, sort

#### /transactions/new (Create Page)
- **Role**: Admin, Employee
- **Components**: TransactionForm
- **Features**: Customer selection, auto-commission calculation, validation

#### /transactions/[id] (Detail Page)
- **Role**: Admin (all), Employee (own only)
- **Components**: TransactionDetail, StatusBadge
- **Features**: View full details, print, status management (admin)

#### /transactions/[id]/receipt (Receipt Page)
- **Role**: Admin, Employee (creator)
- **Components**: TransactionReceipt
- **Features**: Professional receipt layout, print button

### 5.2 Reusable Components

#### TransactionForm.tsx
`	ypescript
interface TransactionFormProps {
  onSuccess: (transactionId: string, transactionNumber: string) => void;
}
`
- Customer search/select dropdown
- Service provider dropdown (5 options)
- Transaction type radio (Local/International)
- Transaction direction radio (Inbound/Outbound)
- Amount input with currency selector
- Real-time commission calculation display
- Notes textarea
- Submit button with loading state

#### TransactionList.tsx
`	ypescript
interface TransactionListProps {
  transactions: TransactionWithDetails[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}
`
- Responsive table/card layout
- Click row to view details
- Status badges with colors
- Pagination controls

#### SearchAndFilter.tsx
`	ypescript
interface SearchAndFilterProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  showEmployeeFilter?: boolean; // Admin only
}
`
- Search input (Transaction ID, customer name)
- Date range picker
- Service provider dropdown
- Transaction type dropdown
- Direction dropdown
- Status dropdown
- Employee dropdown (admin only)
- Clear filters button

#### TransactionReceipt.tsx
`	ypescript
interface TransactionReceiptProps {
  transaction: TransactionWithDetails;
}
`
- Professional receipt layout
- Company branding (Define Horizon / DHS)
- Transaction details in clear format
- Print button
- Return to dashboard button

#### TransactionSummaryCards.tsx
`	ypescript
interface TransactionSummaryCardsProps {
  summary: TransactionSummary;
}
`
- Grid of summary cards
- Total transactions, amount, commission
- Inbound vs Outbound
- Local vs International
- Status breakdown

#### ServiceProviderChart.tsx
`	ypescript
interface ServiceProviderChartProps {
  stats: ServiceProviderStats[];
}
`
- Bar/pie chart showing provider usage
- Uses Recharts library
- Responsive design

---

## 6. Validation Rules

### 6.1 Transaction Form Validation

**File**: lib/validation/transaction-validation.ts

`	ypescript
export function validateTransactionFormData(data: TransactionFormData): ValidationErrors {
  const errors: ValidationErrors = {};
  
  // Required fields
  if (!data.customerId) errors.customerId = ['Customer is required'];
  if (!data.serviceProvider) errors.serviceProvider = ['Service provider is required'];
  if (!data.transactionType) errors.transactionType = ['Transaction type is required'];
  if (!data.transactionDirection) errors.transactionDirection = ['Transaction direction is required'];
  
  // Amount validation
  if (!data.amount) {
    errors.amount = ['Amount is required'];
  } else {
    const amount = parseFloat(data.amount);
    if (isNaN(amount)) {
      errors.amount = ['Amount must be a valid number'];
    } else if (amount <= 0) {
      errors.amount = ['Amount must be greater than zero'];
    } else if (!/^\d+(\.\d{1,2})?$/.test(data.amount)) {
      errors.amount = ['Amount can have maximum 2 decimal places'];
    }
  }
  
  // Currency validation
  if (!data.currency) errors.currency = ['Currency is required'];
  
  return errors;
}

export function calculateCommission(
  amount: number,
  transactionType: TransactionType,
  rates: CommissionRate[]
): { commissionRate: number; commissionAmount: number; totalAmount: number } {
  const rateConfig = rates.find(r => r.transactionType === transactionType);
  const commissionRate = rateConfig?.rate || (transactionType === TransactionType.International ? 10 : 8);
  const commissionAmount = (amount * commissionRate) / 100;
  const totalAmount = amount + commissionAmount;
  
  return {
    commissionRate,
    commissionAmount: parseFloat(commissionAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
}
`

---

## 7. Dashboard Integration

### 7.1 Admin Dashboard Updates

**File**: pp/dashboard/admin/page.tsx

Add new cards:
- Total Transactions
- Today's Transactions
- Total Amount Processed
- Total Commissions
- Inbound vs Outbound chart
- Local vs International chart
- Service Provider Usage chart
- Transaction Trends (last 7 days)

### 7.2 Employee Dashboard Updates

**File**: pp/dashboard/employee/page.tsx

Add new cards:
- Transactions Recorded Today
- Amount Processed Today
- Commissions Generated Today
- Recent Transactions (last 10)

---

## 8. Commission Calculation Logic

### Fixed Rates
- **Local**: 8%
- **International**: 10%

### Calculation Formula
`
Commission = Amount × Commission Rate
Total = Amount + Commission
`

### Example: International Transaction
`
Amount = 
Commission Rate = 10%
Commission =  × 0.10 = 
Total =  +  = 
`

### Example: Local Transaction
`
Amount = 
Commission Rate = 8%
Commission =  × 0.08 = 
Total =  +  = 
`

### Configuration
- Rates stored in commission_rates table
- Admin can update rates via settings page
- New rates apply to future transactions only
- Historical transactions preserve original rate

---

## 9. Security Considerations

### 9.1 Authentication & Authorization
- All transaction routes protected by middleware
- RLS policies enforce database-level security
- Admin: view all, update status, manage rates
- Employee: create, view own transactions only

### 9.2 Data Validation
- Server-side validation for all inputs
- Commission calculated server-side (not trusted from client)
- Amount validation (positive, max 2 decimals)
- Status transition validation (one-way: pending→completed/cancelled)

### 9.3 Audit Trail
- All transactions logged with creator
- Status changes tracked with timestamp and user
- Audit log table for complete history
- No transaction deletion (preserve records)

### 9.4 Duplicate Prevention
- Client-side: disable submit button after click
- Server-side: check for duplicates within 5-minute window
- Unique transaction number generation

---

## 10. Error Handling

### 10.1 User-Facing Errors
- "Amount must be greater than zero"
- "Please select a customer"
- "Invalid amount format"
- "Transaction could not be saved. Please try again."

### 10.2 System Errors
- Log detailed errors for admin review
- Never expose database errors to users
- Display generic "Something went wrong" with retry option

### 10.3 Network Errors
- Loading states during async operations
- Retry mechanism for failed saves
- Offline detection and user notification

---

## 11. Performance Optimizations

### 11.1 Database
- Indexes on frequently queried columns
- Pagination (25 records per page)
- Aggregate queries for dashboard stats
- Connection pooling via Supabase

### 11.2 Frontend
- Server Components for initial data load
- Client Components for interactive forms
- Debounced search (300ms)
- Optimistic UI updates where safe

### 11.3 Caching
- Dashboard stats cached for 5 minutes
- Commission rates cached client-side
- Service provider list static (no API call)

---

## 12. Testing Strategy

### 12.1 Unit Tests
- Validation functions (amount, required fields)
- Commission calculation logic
- Date range filtering logic

### 12.2 Integration Tests
- Create transaction flow
- Update status flow
- Role-based access control
- RLS policy enforcement

### 12.3 E2E Tests
- Employee: Record transaction workflow
- Admin: View all transactions
- Admin: Update transaction status
- Search and filter functionality
- Commission calculation accuracy
- Receipt generation

---

## 13. Migration Path

### Phase 3 Implementation Order

1. **Database Setup** (Wave 1)
   - Create tables
   - RLS policies
   - Seed commission rates

2. **Types & Validation** (Wave 2)
   - TypeScript interfaces
   - Validation functions
   - Commission calculation

3. **Server Actions** (Wave 3)
   - Create transaction
   - Get transactions (with role filtering)
   - Update status
   - Get summaries

4. **Pages** (Wave 4)
   - Transaction list page
   - Create transaction page
   - Detail page
   - Receipt page

5. **UI Components** (Wave 5)
   - TransactionForm
   - TransactionList
   - SearchAndFilter
   - TransactionReceipt
   - Summary cards

6. **Dashboard Integration** (Wave 6)
   - Admin dashboard updates
   - Employee dashboard updates
   - Analytics charts

7. **Testing** (Wave 7)
   - Manual E2E verification
   - Commission calculation tests
   - Role-based access tests

---

## 14. Design Decisions

### 14.1 Why Server Actions?
- Type-safe mutations
- Automatic request deduplication
- Server-side security enforcement
- Simpler than REST API

### 14.2 Why RLS Policies?
- Database-level security (can't be bypassed)
- Automatically filters queries
- Single source of truth
- Protects against API manipulation

### 14.3 Why Auto-Commission Calculation?
- Prevents human error
- Ensures consistency
- Simplifies employee workflow
- Maintains audit trail

### 14.4 Why No Transaction Deletion?
- Financial audit requirements
- Maintain complete history
- Cancellation preserves records
- Regulatory compliance

### 14.5 Why Fixed Service Providers?
- Business requirement (5 specific providers)
- Simplifies UI (dropdown, not free text)
- Ensures data consistency
- Easy to add more via enum update

---

## 15. Future Enhancements

### Phase 3 Future Improvements (Out of Scope)
- Multi-currency support with exchange rates
- Automated provider API integration
- Bulk transaction import
- Advanced analytics (predictive trends)
- Customer transaction statements
- SMS/Email receipt delivery
- Transaction refunds/reversals
- Commission split (multiple employees)

---

## Conclusion

This design document provides a complete technical specification for the Financial Transaction Management Module. The design prioritizes simplicity, security, and ease of use while maintaining data integrity and comprehensive audit trails. The implementation follows established patterns from Phases 1 and 2, ensuring consistency across the Horizon BMS platform.