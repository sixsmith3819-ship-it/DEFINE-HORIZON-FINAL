import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getTransactions } from '@/lib/actions/transactions';
import TransactionList from '@/components/transactions/TransactionList';
import SearchAndFilter from '@/components/transactions/SearchAndFilter';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; provider?: string; type?: string; direction?: string; status?: string }>;
}) {
  const params = await searchParams;
  
  const page = parseInt(params.page || '1');
  const filters = {
    searchTerm: params.search,
    serviceProvider: params.provider as any,
    transactionType: params.type as any,
    transactionDirection: params.direction as any,
    status: params.status as any,
  };

  const result = await getTransactions(page, 25, filters);

  if (!result.success || result.error) {
    return (
      <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>Transactions</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--dh-text-2)' }}>Financial transaction records</p>
            </div>
            <Link href="/transactions/new" className="dh-btn-primary">
              <Plus className="w-4 h-4" />
              New Transaction
            </Link>
          </div>
          <div className="dh-card p-4" style={{ borderLeft: '4px solid var(--dh-error)', color: '#991b1b' }}>
            Error: {result.error || 'Failed to load transactions'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>Transactions</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--dh-text-2)' }}>Financial transaction records</p>
          </div>
          <Link href="/transactions/new" className="dh-btn-primary">
            <Plus className="w-4 h-4" />
            New Transaction
          </Link>
        </div>

        <Suspense fallback={<div className="dh-card p-4 mb-4"><div className="skeleton h-10" /></div>}>
          <SearchAndFilter />
        </Suspense>

        <TransactionList
          transactions={result.transactions}
          pagination={{
            totalCount: result.totalCount,
            pageSize: result.pageSize,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
          }}
        />
      </div>
    </div>
  );
}
