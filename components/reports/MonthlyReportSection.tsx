'use client';

import { useState, useCallback } from 'react';
import { BarChart2, Loader2 } from 'lucide-react';
import { getMonthlyFinancialReport } from '@/lib/actions/reports';
import { MonthlyFinancialReportData, DailyTrendPoint } from '@/lib/types/reports';
import { ReportStatusBanner } from './ReportStatusBanner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ---------------------------------------------------------------------------
// Hidden PDF template (no Recharts here — we render the chart separately in DOM)
// ---------------------------------------------------------------------------

function MonthlyPdfTemplate({ data, generatedAt }: { data: MonthlyFinancialReportData; generatedAt: string }) {
  return (
    <div
      style={{
        width: '794px',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: '40px',
        color: '#111827',
        fontSize: '13px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #4f46e5',
          paddingBottom: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#4f46e5' }}>
            Define Horizon BMS
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '12px' }}>
            Monthly Financial Report — {MONTH_NAMES[data.month - 1]} {data.year}
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#6b7280' }}>
          <div>Generated: {generatedAt}</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total Transactions', value: String(data.totalCount) },
          { label: 'Total Revenue', value: formatCurrency(data.totalRevenue) },
          { label: 'Total Commission', value: formatCurrency(data.totalCommission) },
          { label: 'Avg. Transaction Value', value: formatCurrency(data.averageTransactionValue) },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Chart placeholder — will be replaced by chart image */}
      <div id="monthly-chart-slot" style={{ marginBottom: '28px' }} />

      {/* By Type */}
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>
        Breakdown by Transaction Type
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            {['Type', 'Count', 'Total Amount'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.byType.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: '10px 12px', color: '#9ca3af', border: '1px solid #e5e7eb' }}>No data</td></tr>
          ) : (
            data.byType.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={tdStyle}>{row.type}</td>
                <td style={tdStyle}>{row.count}</td>
                <td style={tdStyle}>{formatCurrency(row.totalAmount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* By Status */}
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>
        Breakdown by Status
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            {['Status', 'Count', 'Total Amount'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.byStatus.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: '10px 12px', color: '#9ca3af', border: '1px solid #e5e7eb' }}>No data</td></tr>
          ) : (
            data.byStatus.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={tdStyle}>{row.status}</td>
                <td style={tdStyle}>{row.count}</td>
                <td style={tdStyle}>{formatCurrency(row.totalAmount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Top Customers */}
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>
        Top 5 Customers
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.topCustomers.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: '10px 12px', color: '#9ca3af', border: '1px solid #e5e7eb' }}>No data</td></tr>
          ) : (
            data.topCustomers.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={tdStyle}>{i + 1}</td>
                <td style={tdStyle}>{row.customerName}</td>
                <td style={tdStyle}>{formatCurrency(row.totalAmount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Top Employees */}
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>
        Top 5 Employees
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Employee</th>
            <th style={thStyle}>Transactions</th>
          </tr>
        </thead>
        <tbody>
          {data.topEmployees.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: '10px 12px', color: '#9ca3af', border: '1px solid #e5e7eb' }}>No data</td></tr>
          ) : (
            data.topEmployees.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={tdStyle}>{i + 1}</td>
                <td style={tdStyle}>{row.employeeName}</td>
                <td style={tdStyle}>{row.count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '10px',
          fontSize: '10px',
          color: '#9ca3af',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Define Horizon BMS — Confidential</span>
        <span>{generatedAt}</span>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  border: '1px solid #e5e7eb',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #e5e7eb',
  textTransform: 'capitalize',
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MonthlyReportSection() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dismissBanner = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  // Build year options: current year back to 5 years
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await getMonthlyFinancialReport(selectedYear, selectedMonth);

      if (!result.success || !result.data) {
        setError(result.error ?? 'Failed to fetch report data');
        return;
      }

      const generatedAt = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const container = document.getElementById('monthly-report-template');
      if (!container) throw new Error('Report template container not found');

      // Render the main template
      const ReactDOM = (await import('react-dom/client')).default;
      const root = ReactDOM.createRoot(container);
      root.render(<MonthlyPdfTemplate data={result.data} generatedAt={generatedAt} />);

      // Wait for template paint
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now render the chart into the chart slot
      const chartSlot = document.getElementById('monthly-chart-slot');
      if (chartSlot) {
        const { TrendChart } = await import('./TrendChart');
        const chartRoot = ReactDOM.createRoot(chartSlot);
        chartRoot.render(
          <div style={{ width: '714px', height: '220px' }}>
            <TrendChart data={result.data.dailyTrend} />
          </div>
        );
      }

      // Wait for Recharts SVG to paint
      await new Promise((resolve) => setTimeout(resolve, 400));

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let y = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        y = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const monthStr = String(selectedMonth).padStart(2, '0');
      pdf.save(`monthly-report-${selectedYear}-${monthStr}.pdf`);

      root.unmount();
      setSuccess(true);
    } catch (err: any) {
      console.error('[MonthlyReportSection] PDF generation error:', err);
      setError(err.message ?? 'PDF generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Monthly Financial Report</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate a comprehensive PDF with trends, top customers, and employee performance.
        </p>
      </div>

      {(error || success) && (
        <div className="mb-4">
          <ReportStatusBanner
            type={error ? 'error' : 'success'}
            message={
              error ?? 'Monthly report PDF generated. Your download should start shortly.'
            }
            onDismiss={dismissBanner}
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        {/* Month select */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="monthly-month">
            Month
          </label>
          <select
            id="monthly-month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Year select */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="monthly-year">
            Year
          </label>
          <select
            id="monthly-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          aria-busy={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <BarChart2 className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? 'Generating…' : 'Generate PDF'}
        </button>
      </div>

      {/* Hidden PDF template container */}
      <div
        id="monthly-report-template"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
