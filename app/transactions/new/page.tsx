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
    <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/transactions" className="inline-flex items-center gap-2 text-sm font-medium mb-4 transition-colors" style={{ color: 'var(--dh-text-2)' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Transactions
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>New Transaction</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--dh-text-2)' }}>Record a new financial transaction</p>
        </div>
        <TransactionForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
