'use server';

import { createServerClient } from '@/lib/supabase-server';
import {
  TransactionFormData,
  TransactionWithDetails,
  TransactionFilters,
  PaginatedTransactions,
  TransactionSummary,
  ServiceProviderStats,
  CommissionRate,
  TransactionStatus,
  TransactionType,
  ValidationErrors,
} from '@/lib/types/transaction';
import {
  validateTransactionFormData,
  hasValidationErrors,
  calculateCommission,
} from '@/lib/validation/transaction-validation';

/**
 * Get commission rates from database
 */
export async function getCommissionRates(): Promise<{
  success: boolean;
  rates?: CommissionRate[];
  error?: string;
}> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('commission_rates')
      .select('transaction_type, rate');

    if (error) throw error;

    const rates = data.map((r: any) => ({
      transactionType: r.transaction_type,
      rate: parseFloat(r.rate),
    }));

    return { success: true, rates };
  } catch (error: any) {
    console.error('Get commission rates error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  data: TransactionFormData
): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
  validationErrors?: ValidationErrors;
}> {
  try {
    console.log('[createTransaction] Starting with data:', { 
      customerId: data.customerId, 
      transactionType: data.transactionType,
      amount: data.amount 
    });

    const supabase = await createServerClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[createTransaction] No user found');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('[createTransaction] User authenticated:', user.id);

    // Validate form data
    const validationErrors = validateTransactionFormData(data);
    if (hasValidationErrors(validationErrors)) {
      console.log('[createTransaction] Validation errors:', validationErrors);
      return { success: false, validationErrors };
    }

    // Get commission rates
    const ratesResult = await getCommissionRates();
    if (!ratesResult.success || !ratesResult.rates) {
      console.log('[createTransaction] Failed to fetch commission rates');
      return { success: false, error: 'Failed to fetch commission rates' };
    }

    // Calculate commission
    const amount = parseFloat(data.amount);
    const { commissionRate, commissionAmount } = calculateCommission(
      amount,
      data.transactionType,
      ratesResult.rates
    );

    console.log('[createTransaction] Commission calculated:', { commissionRate, commissionAmount });

    // Build transaction data with ONLY columns that exist in database
    const transactionData = {
      customer_id: data.customerId,
      service_provider: data.serviceProvider,
      transaction_type: data.transactionType,
      amount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      payment_method: data.paymentMethod,
      reference_number: data.referenceNumber || null,
      status: 'completed',
      notes: data.notes || null,
      created_by: user.id,
    };

    console.log('[createTransaction] Inserting transaction:', transactionData);

    // Insert transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select('id')
      .single();

    console.log('[createTransaction] Insert result:', { success: !!transaction, error: error?.message });

    if (error) {
      console.error('[createTransaction] Insert failed:', error);
      throw error;
    }

    console.log('[createTransaction] Transaction created successfully:', transaction.id);

    return {
      success: true,
      transactionId: transaction.id,
    };
  } catch (error: any) {
    console.error('[createTransaction] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get paginated transactions with filters (role-based access)
 */
export async function getTransactions(
  page: number = 1,
  pageSize: number = 25,
  filters?: TransactionFilters
): Promise<PaginatedTransactions & { success?: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        transactions: [],
        totalCount: 0,
        pageSize,
        currentPage: page,
        totalPages: 0,
        success: false,
        error: 'Unauthorized',
      };
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return {
        transactions: [],
        totalCount: 0,
        pageSize,
        currentPage: page,
        totalPages: 0,
        success: false,
        error: 'Profile not found',
      };
    }

    // Build query
    let query = supabase
      .from('transactions')
      .select('*, customers(*), profiles!transactions_created_by_fkey(id, full_name, email)', { count: 'exact' });

    // Role-based filtering
    if (profile.role === 'employee') {
      query = query.eq('created_by', user.id);
    }

    // Apply filters
    if (filters?.searchTerm) {
      // Search in transaction_number or customer fields
      query = query.or(`transaction_number.ilike.%${filters.searchTerm}%`);
    }

    if (filters?.serviceProvider && filters.serviceProvider !== 'all') {
      query = query.eq('service_provider', filters.serviceProvider);
    }

    if (filters?.transactionType && filters.transactionType !== 'all') {
      query = query.eq('transaction_type', filters.transactionType);
    }

    // Transaction direction filter removed - column doesn't exist in DB
    // if (filters?.transactionDirection && filters.transactionDirection !== 'all') {
    //   query = query.eq('transaction_direction', filters.transactionDirection);
    // }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Count total
    const { count } = await query;

    // Paginate
    const offset = (page - 1) * pageSize;
    query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, error } = await query;

    if (error) throw error;

    const transactions: TransactionWithDetails[] = (data || []).map(transformTransactionData);

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      transactions,
      totalCount: count || 0,
      pageSize,
      currentPage: page,
      totalPages,
      success: true,
    };
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return {
      transactions: [],
      totalCount: 0,
      pageSize,
      currentPage: page,
      totalPages: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
/**
 * Transform database transaction to camelCase (matches actual DB schema)
 */
function transformTransactionData(raw: any): TransactionWithDetails {
  return {
    id: raw.id,
    customerId: raw.customer_id,
    serviceProvider: raw.service_provider,
    transactionType: raw.transaction_type,
    amount: parseFloat(raw.amount),
    commissionRate: raw.commission_rate ? parseFloat(raw.commission_rate) : null,
    commissionAmount: raw.commission_amount ? parseFloat(raw.commission_amount) : null,
    paymentMethod: raw.payment_method,
    referenceNumber: raw.reference_number,
    status: raw.status,
    notes: raw.notes,
    createdAt: raw.created_at,
    createdBy: raw.created_by,
    updatedAt: raw.updated_at,
    customer: {
      id: raw.customers.id,
      customerName: raw.customers.customer_name,
      customerType: raw.customers.customer_type,
      email: raw.customers.email,
      phone: raw.customers.phone,
    },
    createdByEmployee: {
      id: raw.profiles.id,
      fullName: raw.profiles.full_name || raw.profiles.email,
      email: raw.profiles.email,
    },
  };
}
export async function getTransactionDetail(
  transactionId: string
): Promise<{
  success: boolean;
  transaction?: TransactionWithDetails;
  error?: string;
  statusCode?: number;
}> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized', statusCode: 401 };
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'Profile not found', statusCode: 404 };
    }

    // Fetch transaction
    const { data, error } = await supabase
      .from('transactions')
      .select('*, customers(*), profiles!transactions_created_by_fkey(id, full_name, email)')
      .eq('id', transactionId)
      .single();

    if (error) throw error;

    if (!data) {
      return { success: false, error: 'Transaction not found', statusCode: 404 };
    }

    // Check permissions: admin can view all, employee can view own only
    if (profile.role === 'employee' && data.created_by !== user.id) {
      return { success: false, error: 'Access denied', statusCode: 403 };
    }

    const transaction = transformTransactionData(data);

    return { success: true, transaction };
  } catch (error: any) {
    console.error('Get transaction detail error:', error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Update transaction status (admin only)
 */
export async function updateTransactionStatus(
  transactionId: string,
  newStatus: TransactionStatus,
  cancellationReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Access denied - Admin only' };
    }

    // Fetch current transaction
    const { data: current } = await supabase
      .from('transactions')
      .select('status')
      .eq('id', transactionId)
      .single();

    if (!current) {
      return { success: false, error: 'Transaction not found' };
    }

    // Validate status transition (only pending can be changed)
    if (current.status !== 'pending') {
      return { success: false, error: 'Only pending transactions can be updated' };
    }

    // Build update object
    const updateData: any = {
      status: newStatus,
      updated_by: user.id,
    };

    if (newStatus === TransactionStatus.Completed) {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user.id;
    } else if (newStatus === TransactionStatus.Cancelled) {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = user.id;
      updateData.cancellation_reason = cancellationReason || null;
    }

    // Update transaction
    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Update transaction status error:', error);
    return { success: false, error: error.message };
  }
}
