'use client';

import { useState, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { getTransactionExportData } from '@/lib/actions/reports';
import { CsvExportFilters, TransactionExportRow } from '@/lib/types/reports';
import { ReportStatusBanner } from './ReportStatusBanner';

// ---------------------------------------------------------------------------
// CSV builder
// ---------------------------------------------------------------------------

export function buildCsv(rows: TransactionExportRow[]): string {
  const headers = [
    'Reference Number',
    'Date',
    'Transaction Type',
    'Service Provider',
    'Amount',
    'Commission Rate',
    'Commission Amount',
    'Payment Method',
    'Status',
    'Customer Name',
    'Employee Name',
  ];

  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    lines.push(
      [
        row.referenceNumber ?? '',
        row.createdAt,
        row.transactionType,
        row.serviceProvider,
        row.amount,
        row.commissionRate ?? '',
        row.commissionAmount ?? '',
        row.paymentMethod,
        row.status,
        `"${(row.customerName ?? '').replace(/"/g, '""')}"`,
        `"${(row.employeeName ?? '').replace(/"/g, '""')}"`,
      ].join(',')
    );
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SERVICE_PROVIDERS = [
  'EcoCash',
  'Mukuru',
  'Mama Money',
  'MOOVAR',
  'WorldRemit',
];

export function CsvExportSection() {
  const [filters, setFilters] = useState<CsvExportFilters>({
    dateFrom: '',
    dateTo: '',
    transactionType: 'all',
    status: 'all',
    serviceProvider: 'all',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dismissBanner = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await getTransactionExportData(filters);

      if (!result.success || result.rows === undefined) {
        setError(result.error ?? 'Failed to export data');
        return;
      }

      const csvContent = buildCsv(result.rows);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-export-${today}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Transaction Export</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Export filtered transactions to CSV for accounting and reconciliation.
        </p>
      </div>

      {(error || success) && (
        <div className="mb-4">
          <ReportStatusBanner
            type={error ? 'error' : 'success'}
            message={error ?? 'CSV exported successfully. Your download should start shortly.'}
            onDismiss={dismissBanner}
          />
        </div>
      )}

      {/* Filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {/* Date from */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="csv-date-from">
            From Date
          </label>
          <input
            id="csv-date-from"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Date to */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="csv-date-to">
            To Date
          </label>
          <input
            id="csv-date-to"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Transaction type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="csv-type">
            Transaction Type
          </label>
          <select
            id="csv-type"
            value={filters.transactionType ?? 'all'}
            onChange={(e) => setFilters((f) => ({ ...f, transactionType: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="local">Local</option>
            <option value="international">International</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="csv-status">
            Status
          </label>
          <select
            id="csv-status"
            value={filters.status ?? 'all'}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Service provider */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="csv-provider">
            Service Provider
          </label>
          <select
            id="csv-provider"
            value={filters.serviceProvider ?? 'all'}
            onChange={(e) => setFilters((f) => ({ ...f, serviceProvider: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Providers</option>
            {SERVICE_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        aria-busy={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? 'Exporting…' : 'Export CSV'}
      </button>
    </div>
  );
}
