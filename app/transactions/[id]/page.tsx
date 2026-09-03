import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTransactionDetail } from '@/lib/actions/transactions';

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTransactionDetail(id);
  if (!result.success || !result.transaction) {
    notFound();
  }

  const txn = result.transaction;
  const customer = txn.customer;

  return (
    <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/transactions" className="inline-flex items-center gap-2 text-sm font-medium mb-4" style={{ color: 'var(--dh-text-2)' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Transactions
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>Transaction Details</h1>
              <p className="text-sm font-mono mt-0.5" style={{ color: 'var(--dh-text-3)' }}>#{txn.id.substring(0, 13)}</p>
            </div>
            <span className={`badge text-sm px-3 py-1.5 ${txn.status === 'completed' ? 'badge-success' : txn.status === 'pending' ? 'badge-warning' : txn.status === 'failed' ? 'badge-error' : 'badge-gray'}`}>
              {txn.status}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Customer info */}
          <div className="dh-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--dh-text-3)' }}>Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--dh-text-3)' }}>Name</p>
                <p className="font-semibold" style={{ color: 'var(--dh-text)' }}>{customer.customerName}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--dh-text-3)' }}>Phone</p>
                <p className="font-medium" style={{ color: 'var(--dh-text)' }}>{customer.phone}</p>
              </div>
              {customer.email && (
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--dh-text-3)' }}>Email</p>
                  <p className="font-medium" style={{ color: 'var(--dh-text)' }}>{customer.email}</p>
                </div>
              )}
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--dh-text-3)' }}>Date</p>
                <p className="font-medium" style={{ color: 'var(--dh-text)' }}>{new Date(txn.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Transaction details */}
          <div className="dh-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--dh-text-3)' }}>Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--dh-text-3)' }}>Service Provider</p>
                <p className="font-semibold" style={{ color: 'var(--dh-text)' }}>{txn.serviceProvider}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--dh-text-3)' }}>Type</p>
                <span className={`badge ${txn.transactionType === 'local' ? 'badge-info' : 'badge-cyan'}`}>{txn.transactionType}</span>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--dh-text-3)' }}>Payment Method</p>
                <p className="font-medium capitalize" style={{ color: 'var(--dh-text)' }}>{txn.paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--dh-text-3)' }}>Processed By</p>
                <p className="font-medium" style={{ color: 'var(--dh-text)' }}>{txn.createdByEmployee.fullName}</p>
              </div>
              {txn.referenceNumber && (
                <div className="col-span-2">
                  <p className="text-xs mb-1" style={{ color: 'var(--dh-text-3)' }}>Reference</p>
                  <p className="font-mono text-sm" style={{ color: 'var(--dh-text)' }}>{txn.referenceNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial summary */}
          <div className="dh-card p-6" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--dh-text-3)' }}>Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--dh-text-2)' }}>Transaction Amount</span>
                <span className="font-semibold text-lg" style={{ color: 'var(--dh-text)' }}>${txn.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--dh-text-2)' }}>Commission ({txn.commissionRate ?? 0}%)</span>
                <span className="font-medium" style={{ color: '#10b981' }}>${(txn.commissionAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3" style={{ borderTop: '2px solid var(--dh-border)' }}>
                <span className="font-bold text-lg" style={{ color: 'var(--dh-text)' }}>Total</span>
                <span className="font-bold text-2xl gradient-text">${(txn.amount + (txn.commissionAmount || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
