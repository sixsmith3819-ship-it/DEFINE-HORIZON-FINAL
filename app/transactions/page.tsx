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
  // Await searchParams in Next.js 15+
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-600">Manage financial transactions</p>
        </div>
        <Link
          href="/transactions/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Transaction
        </Link>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <SearchAndFilter />
      </Suspense>

      {result.success ? (
        <TransactionList 
          transactions={result.data!.transactions} 
          pagination={result.data!.pagination}
        />
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Error: {result.error}
        </div>
      )}
    </div>
  );
}
