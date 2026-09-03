export interface DailyTransactionSummaryData {
  date: string; // YYYY-MM-DD
  totalCount: number;
  totalRevenue: number;
  totalCommission: number;
  byType: { type: string; count: number; totalAmount: number }[];
  byStatus: { status: string; count: number; totalAmount: number }[];
}

export interface CsvExportFilters {
  dateFrom?: string;
  dateTo?: string;
  transactionType?: string; // 'local' | 'international' | 'all'
  status?: string;          // 'completed' | 'pending' | 'failed' | 'cancelled' | 'all'
  serviceProvider?: string; // provider name | 'all'
}

export interface TransactionExportRow {
  referenceNumber: string | null;
  createdAt: string;
  transactionType: string;
  serviceProvider: string;
  amount: number;
  commissionRate: number | null;
  commissionAmount: number | null;
  paymentMethod: string;
  status: string;
  customerName: string;
  employeeName: string;
}

export interface DailyTrendPoint {
  date: string; // 'DD' (day of month)
  revenue: number;
  commission: number;
}

export interface MonthlyFinancialReportData {
  year: number;
  month: number;
  totalCount: number;
  totalRevenue: number;
  totalCommission: number;
  averageTransactionValue: number;
  byType: { type: string; count: number; totalAmount: number }[];
  byStatus: { status: string; count: number; totalAmount: number }[];
  dailyTrend: DailyTrendPoint[];
  topCustomers: { customerName: string; totalAmount: number }[];
  topEmployees: { employeeName: string; count: number }[];
}
