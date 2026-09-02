'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TransactionForm from '@/components/transactions/TransactionForm';

export default function NewTransactionPage() {
  const router = useRouter();

  const handleSuccess = (transactionId: string) => {
    router.push(`/transactions/${transactionId}?new=true`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/transactions" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Transactions
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Transaction</h1>
        <p className="text-sm text-gray-600">Record a new financial transaction</p>
      </div>

      <div className="max-w-2xl">
        <TransactionForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
