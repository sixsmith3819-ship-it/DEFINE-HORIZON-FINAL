import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getTransactions } from '@/lib/actions/transactions';
import TransactionList from '@/components/transactions/TransactionList';
import SearchAndFilter from '@/components/transactions/SearchAndFilter';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; provider?: string; type?: string; direction?: string; status?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const filters = {
    searchTerm: searchParams.search,
    serviceProvider: searchParams.provider as any,
    transactionType: searchParams.type as any,
    transactionDirection: searchParams.direction as any,
    status: searchParams.status as any,
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Transaction
        </Link>
      </div>

      <SearchAndFilter />

      <Suspense fallback={<div>Loading transactions...</div>}>
        <TransactionList
          transactions={result.transactions}
          totalCount={result.totalCount}
          currentPage={result.currentPage}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
