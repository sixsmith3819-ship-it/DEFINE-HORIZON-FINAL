'use server';

import { createServerClient } from '@/lib/supabase-server';
import {
  CsvExportFilters,
  DailyTransactionSummaryData,
  MonthlyFinancialReportData,
  TransactionExportRow,
} from '@/lib/types/reports';

// ---------------------------------------------------------------------------
// Auth guard helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the authenticated user and their profile role.
 * Returns `{ error }` if unauthenticated or if the profile cannot be found.
 */
async function resolveUserRole(supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<
  | { user: { id: string }; role: string; error?: never }
  | { error: string; user?: never; role?: never }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  return { user: { id: user.id }, role: profile.role as string };
}

// ---------------------------------------------------------------------------
// getDailyTransactionSummary
// ---------------------------------------------------------------------------

/**
 * Returns a summary of all transactions on the given date (YYYY-MM-DD).
 * Requires admin or manager role.
 */
export async function getDailyTransactionSummary(date: string): Promise<{
  success: boolean;
  data?: DailyTransactionSummaryData;
  error?: string;
}> {
  const supabase = await createServerClient();
  const auth = await resolveUserRole(supabase);

  if (auth.error) {
    return { success: false, error: auth.error };
  }

  if (auth.role === 'employee') {
    return { success: false, error: 'Forbidden' };
  }

  const { data: rows, error: queryError } = await supabase
    .from('transactions')
    .select(
      'id, transaction_type, amount, commission_amount, status'
    )
    .gte('created_at', `${date}T00:00:00`)
    .lte('created_at', `${date}T23:59:59`);

  if (queryError) {
    return { success: false, error: queryError.message };
  }

  const transactions = rows ?? [];

  // --- totals ---
  const totalCount = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const totalCommission = transactions.reduce(
    (sum, t) => sum + (t.commission_amount ?? 0),
    0
  );

  // --- byType ---
  const typeMap = new Map<string, { count: number; totalAmount: number }>();
  for (const t of transactions) {
    const key = t.transaction_type as string;
    const existing = typeMap.get(key) ?? { count: 0, totalAmount: 0 };
    typeMap.set(key, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + (t.amount ?? 0),
    });
  }
  const byType = Array.from(typeMap.entries()).map(([type, agg]) => ({
    type,
    count: agg.count,
    totalAmount: agg.totalAmount,
  }));

  // --- byStatus ---
  const statusMap = new Map<string, { count: number; totalAmount: number }>();
  for (const t of transactions) {
    const key = t.status as string;
    const existing = statusMap.get(key) ?? { count: 0, totalAmount: 0 };
    statusMap.set(key, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + (t.amount ?? 0),
    });
  }
  const byStatus = Array.from(statusMap.entries()).map(([status, agg]) => ({
    status,
    count: agg.count,
    totalAmount: agg.totalAmount,
  }));

  return {
    success: true,
    data: {
      date,
      totalCount,
      totalRevenue,
      totalCommission,
      byType,
      byStatus,
    },
  };
}

// ---------------------------------------------------------------------------
// getTransactionExportData
// ---------------------------------------------------------------------------

/**
 * Returns transaction rows matching the given filters for CSV export.
 * All authenticated roles are permitted; employees are scoped to their own transactions.
 */
export async function getTransactionExportData(filters: CsvExportFilters): Promise<{
  success: boolean;
  rows?: TransactionExportRow[];
  error?: string;
}> {
  const supabase = await createServerClient();
  const auth = await resolveUserRole(supabase);

  if (auth.error) {
    return { success: false, error: auth.error };
  }

  // Step 1: Fetch transactions with filters applied
  let query = supabase
    .from('transactions')
    .select(
      'id, reference_number, created_at, transaction_type, service_provider, amount, commission_rate, commission_amount, payment_method, status, customer_id, created_by'
    )
    .order('created_at', { ascending: false });

  // Employee scoping: restrict to own transactions
  if (auth.role === 'employee') {
    query = query.eq('created_by', auth.user.id);
  }

  // Apply optional filters (skip when value is 'all' or undefined)
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }
  if (filters.transactionType && filters.transactionType !== 'all') {
    query = query.eq('transaction_type', filters.transactionType);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.serviceProvider && filters.serviceProvider !== 'all') {
    query = query.eq('service_provider', filters.serviceProvider);
  }

  const { data: transactions, error: txError } = await query;

  if (txError) {
    return { success: false, error: txError.message };
  }

  const txRows = transactions ?? [];

  if (txRows.length === 0) {
    return { success: true, rows: [] };
  }

  // Step 2: Fetch related customers using unique customer_ids
  const customerIds = [...new Set(txRows.map((t) => t.customer_id).filter(Boolean))];
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('id, customer_name')
    .in('id', customerIds);

  if (custError) {
    return { success: false, error: custError.message };
  }

  // Step 3: Fetch related profiles using unique created_by ids
  const createdByIds = [...new Set(txRows.map((t) => t.created_by).filter(Boolean))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', createdByIds);

  if (profilesError) {
    return { success: false, error: profilesError.message };
  }

  // Build lookup maps for O(1) access
  const customerMap = new Map<string, string>();
  for (const c of customers ?? []) {
    customerMap.set(c.id, c.customer_name);
  }

  const profileMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, p.full_name ?? p.email ?? 'Unknown');
  }

  // Step 4: Map rows to TransactionExportRow
  const rows: TransactionExportRow[] = txRows.map((t) => ({
    referenceNumber: t.reference_number ?? null,
    createdAt: t.created_at,
    transactionType: t.transaction_type,
    serviceProvider: t.service_provider,
    amount: parseFloat(t.amount),
    commissionRate: t.commission_rate != null ? parseFloat(t.commission_rate) : null,
    commissionAmount: t.commission_amount != null ? parseFloat(t.commission_amount) : null,
    paymentMethod: t.payment_method,
    status: t.status,
    customerName: t.customer_id ? (customerMap.get(t.customer_id) ?? 'Unknown') : 'Unknown',
    employeeName: t.created_by ? (profileMap.get(t.created_by) ?? 'Unknown') : 'Unknown',
  }));

  return { success: true, rows };
}

// ---------------------------------------------------------------------------
// getMonthlyFinancialReport
// ---------------------------------------------------------------------------

/**
 * Returns an aggregated financial report for the given calendar month.
 * Requires admin or manager role.
 */
export async function getMonthlyFinancialReport(
  year: number,
  month: number
): Promise<{
  success: boolean;
  data?: MonthlyFinancialReportData;
  error?: string;
}> {
  const supabase = await createServerClient();
  const auth = await resolveUserRole(supabase);

  if (auth.error) {
    return { success: false, error: auth.error };
  }

  if (auth.role === 'employee') {
    return { success: false, error: 'Forbidden' };
  }

  // --- Compute date range ---
  const firstDate = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0); // day 0 of next month = last day of current month

  const pad = (n: number) => String(n).padStart(2, '0');
  const firstDayStr = `${firstDate.getFullYear()}-${pad(firstDate.getMonth() + 1)}-${pad(firstDate.getDate())}T00:00:00`;
  const lastDayStr = `${lastDate.getFullYear()}-${pad(lastDate.getMonth() + 1)}-${pad(lastDate.getDate())}T23:59:59`;

  // --- Fetch transactions ---
  const { data: rows, error: queryError } = await supabase
    .from('transactions')
    .select('id, transaction_type, customer_id, created_by, amount, commission_amount, status, created_at')
    .gte('created_at', firstDayStr)
    .lte('created_at', lastDayStr);

  if (queryError) {
    return { success: false, error: queryError.message };
  }

  const transactions = rows ?? [];

  // --- Fetch customer names ---
  const customerIds = [...new Set(transactions.map((t) => t.customer_id).filter(Boolean))] as string[];
  const customerMap = new Map<string, string>();
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, customer_name')
      .in('id', customerIds);
    for (const c of customers ?? []) {
      customerMap.set(c.id as string, c.customer_name as string);
    }
  }

  // --- Fetch employee names ---
  const employeeIds = [...new Set(transactions.map((t) => t.created_by).filter(Boolean))] as string[];
  const employeeMap = new Map<string, string>();
  if (employeeIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', employeeIds);
    for (const p of profiles ?? []) {
      employeeMap.set(p.id as string, (p.full_name as string | null) ?? (p.email as string) ?? '');
    }
  }

  // --- Summary totals ---
  const totalCount = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const totalCommission = transactions.reduce((sum, t) => sum + (t.commission_amount ?? 0), 0);
  const averageTransactionValue = totalCount > 0 ? totalRevenue / totalCount : 0;

  // --- byType ---
  const typeMap = new Map<string, { count: number; totalAmount: number }>();
  for (const t of transactions) {
    const key = t.transaction_type as string;
    const existing = typeMap.get(key) ?? { count: 0, totalAmount: 0 };
    typeMap.set(key, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + (t.amount ?? 0),
    });
  }
  const byType = Array.from(typeMap.entries()).map(([type, agg]) => ({
    type,
    count: agg.count,
    totalAmount: agg.totalAmount,
  }));

  // --- byStatus ---
  const statusMap = new Map<string, { count: number; totalAmount: number }>();
  for (const t of transactions) {
    const key = t.status as string;
    const existing = statusMap.get(key) ?? { count: 0, totalAmount: 0 };
    statusMap.set(key, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + (t.amount ?? 0),
    });
  }
  const byStatus = Array.from(statusMap.entries()).map(([status, agg]) => ({
    status,
    count: agg.count,
    totalAmount: agg.totalAmount,
  }));

  // --- dailyTrend ---
  const daysInMonth = new Date(year, month, 0).getDate();
  // Build a lookup: day-of-month (1-based) → { revenue, commission }
  const dayRevMap = new Map<number, { revenue: number; commission: number }>();
  for (const t of transactions) {
    const day = new Date(t.created_at as string).getDate();
    const existing = dayRevMap.get(day) ?? { revenue: 0, commission: 0 };
    dayRevMap.set(day, {
      revenue: existing.revenue + (t.amount ?? 0),
      commission: existing.commission + (t.commission_amount ?? 0),
    });
  }
  const dailyTrend: { date: string; revenue: number; commission: number }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const entry = dayRevMap.get(day) ?? { revenue: 0, commission: 0 };
    dailyTrend.push({
      date: String(day).padStart(2, '0'),
      revenue: entry.revenue,
      commission: entry.commission,
    });
  }

  // --- topCustomers ---
  const customerAmountMap = new Map<string, number>();
  for (const t of transactions) {
    const cid = t.customer_id as string;
    if (!cid) continue;
    customerAmountMap.set(cid, (customerAmountMap.get(cid) ?? 0) + (t.amount ?? 0));
  }
  const topCustomers = Array.from(customerAmountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cid, totalAmount]) => ({
      customerName: customerMap.get(cid) ?? cid,
      totalAmount,
    }));

  // --- topEmployees ---
  const employeeCountMap = new Map<string, number>();
  for (const t of transactions) {
    const eid = t.created_by as string;
    if (!eid) continue;
    employeeCountMap.set(eid, (employeeCountMap.get(eid) ?? 0) + 1);
  }
  const topEmployees = Array.from(employeeCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([eid, count]) => ({
      employeeName: employeeMap.get(eid) ?? eid,
      count,
    }));

  return {
    success: true,
    data: {
      year,
      month,
      totalCount,
      totalRevenue,
      totalCommission,
      averageTransactionValue,
      byType,
      byStatus,
      dailyTrend,
      topCustomers,
      topEmployees,
    },
  };
}
