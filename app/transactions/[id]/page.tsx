import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { getTransactionDetail } from '@/lib/actions/transactions';
import { TransactionStatus } from '@/lib/types/transaction';

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTransactionDetail(id);
  if (!result.success || !result.transaction) {
    notFound();
  }

  const txn = result.transaction;
  const customer = txn.customer;

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.Pending: return 'bg-yellow-100 text-yellow-800';
      case TransactionStatus.Completed: return 'bg-green-100 text-green-800';
      case TransactionStatus.Cancelled: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/transactions" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Transactions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
            <p className="text-sm text-gray-600">#{txn.id.substring(0, 8)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(txn.status)}`}>
                {txn.status}
              </span>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
              <p className="text-base font-medium text-gray-900">
                {new Date(txn.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-base font-medium text-gray-900">
                {customer.customerName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-base font-medium text-gray-900">{customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-base font-medium text-gray-900">{customer.phone}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Service Provider</p>
              <p className="text-base font-medium text-gray-900">{txn.serviceProvider}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-base font-medium text-gray-900 capitalize">{txn.transactionType}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Processed By</p>
              <p className="text-base font-medium text-gray-900">{txn.createdByEmployee.fullName}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Amount</span>
              <span className="font-medium">${txn.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Commission ({txn.commissionRate}%)</span>
              <span className="font-medium">${(txn.commissionAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total</span>
              <span>${(txn.amount + (txn.commissionAmount || 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
