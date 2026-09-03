'use client';

import Link from 'next/link';
import { TransactionWithDetails, TransactionStatus } from '@/lib/types/transaction';
import { useRouter } from 'next/navigation';

interface TransactionListProps {
  transactions: TransactionWithDetails[];
  pagination: {
    totalCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
}

export default function TransactionList({ transactions, pagination }: TransactionListProps) {
  const router = useRouter();

  const getStatusBadge = (status: TransactionStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (transactions.length === 0) {
    return (
      <div className="dh-card p-12 text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <span className="text-white text-2xl">$</span>
        </div>
        <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--dh-text)' }}>No Transactions Found</h3>
        <p className="text-sm" style={{ color: 'var(--dh-text-2)' }}>Transactions recorded here will appear in this list.</p>
      </div>
    );
  }

  return (
    <div className="dh-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="dh-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Provider</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} onClick={() => router.push(`/transactions/${txn.id}`)} className="cursor-pointer">
                <td>
                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--dh-primary)' }}>
                    #{txn.id.substring(0, 8)}
                  </span>
                </td>
                <td>{new Date(txn.createdAt).toLocaleDateString()}</td>
                <td className="font-medium">{txn.customer.customerName || 'Unknown Customer'}</td>
                <td>{txn.serviceProvider}</td>
                <td className="font-semibold">${txn.amount.toFixed(2)}</td>
                <td>
                  <span className={`badge ${txn.transactionType === 'local' ? 'badge-info' : 'badge-cyan'}`}>
                    {txn.transactionType}
                  </span>
                </td>
                <td>
                  <span className={`badge ${txn.status === 'completed' ? 'badge-success' : txn.status === 'pending' ? 'badge-warning' : txn.status === 'failed' ? 'badge-error' : 'badge-gray'}`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--dh-border)', background: 'var(--dh-surface-2)' }}>
          <div className="text-sm" style={{ color: 'var(--dh-text-2)' }}>
            Showing {transactions.length} of {pagination.totalCount} transactions
          </div>
          <div className="flex gap-2">
            {pagination.currentPage > 1 && (
              <Link href={`?page=${pagination.currentPage - 1}`} className="px-4 py-2 rounded-lg text-sm font-medium transition" style={{ border: '1px solid var(--dh-border)', color: 'var(--dh-text-2)' }}>
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-sm rounded-lg font-semibold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            {pagination.currentPage < pagination.totalPages && (
              <Link href={`?page=${pagination.currentPage + 1}`} className="px-4 py-2 rounded-lg text-sm font-medium transition" style={{ border: '1px solid var(--dh-border)', color: 'var(--dh-text-2)' }}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
