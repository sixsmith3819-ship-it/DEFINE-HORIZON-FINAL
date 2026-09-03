'use client';

import { useState, useCallback } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { getDailyTransactionSummary } from '@/lib/actions/reports';
import { DailyTransactionSummaryData } from '@/lib/types/reports';
import { ReportStatusBanner } from './ReportStatusBanner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Hidden PDF template
// ---------------------------------------------------------------------------

function DailyPdfTemplate({
  data,
  generatedAt,
}: {
  data: DailyTransactionSummaryData;
  generatedAt: string;
}) {
  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
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
            Daily Transaction Summary
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#6b7280' }}>
          <div>Generated: {generatedAt}</div>
          <div>Report Date: {formatDate(data.date)}</div>
        </div>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {[
          { label: 'Total Transactions', value: String(data.totalCount) },
          { label: 'Total Revenue', value: formatCurrency(data.totalRevenue) },
          { label: 'Total Commission', value: formatCurrency(data.totalCommission) },
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

      {/* By Type */}
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>
        Breakdown by Transaction Type
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            {['Type', 'Count', 'Total Amount'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1px solid #e5e7eb',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.byType.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ padding: '10px 12px', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
                No data
              </td>
            </tr>
          ) : (
            data.byType.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{row.type}</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{row.count}</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{formatCurrency(row.totalAmount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* By Status */}
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>
        Breakdown by Status
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            {['Status', 'Count', 'Total Amount'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1px solid #e5e7eb',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.byStatus.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ padding: '10px 12px', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
                No data
              </td>
            </tr>
          ) : (
            data.byStatus.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{row.status}</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{row.count}</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{formatCurrency(row.totalAmount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '40px',
          right: '40px',
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DailyReportSection() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dismissBanner = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const handleGenerate = async () => {
    if (!selectedDate) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await getDailyTransactionSummary(selectedDate);

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

      // Render template into hidden div
      const container = document.getElementById('daily-report-template');
      if (!container) throw new Error('Report template container not found');

      // Dynamically render via React — we use a simpler approach: inject HTML
      const ReactDOM = (await import('react-dom/client')).default;
      const root = ReactDOM.createRoot(container);
      root.render(<DailyPdfTemplate data={result.data} generatedAt={generatedAt} />);

      // Wait for paint
      await new Promise((resolve) => setTimeout(resolve, 300));

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

      pdf.save(`daily-summary-${selectedDate}.pdf`);

      // Cleanup
      root.unmount();
      setSuccess(true);
    } catch (err: any) {
      console.error('[DailyReportSection] PDF generation error:', err);
      setError(err.message ?? 'PDF generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Daily Transaction Summary</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate a PDF summary of all transactions for a selected date.
        </p>
      </div>

      {(error || success) && (
        <div className="mb-4">
          <ReportStatusBanner
            type={error ? 'error' : 'success'}
            message={
              error ?? 'Daily summary PDF generated. Your download should start shortly.'
            }
            onDismiss={dismissBanner}
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="daily-date">
            Select Date
          </label>
          <input
            id="daily-date"
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedDate}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          aria-busy={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileText className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? 'Generating…' : 'Generate PDF'}
        </button>
      </div>

      {/* Hidden PDF template container */}
      <div
        id="daily-report-template"
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
