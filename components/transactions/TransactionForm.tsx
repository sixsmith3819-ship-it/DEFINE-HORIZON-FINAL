'use client';

import { useState, useEffect } from 'react';
import { createTransaction, getCommissionRates } from '@/lib/actions/transactions';
import { getCustomers } from '@/lib/actions/customers';
import { ServiceProvider, TransactionType } from '@/lib/types/transaction';
import { calculateCommission } from '@/lib/validation/transaction-validation';

interface TransactionFormProps {
  onSuccess: (transactionId: string) => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  
  const [formData, setFormData] = useState({
    customerId: '',
    serviceProvider: '' as ServiceProvider,
    transactionType: '' as TransactionType,
    amount: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
  });

  const [commission, setCommission] = useState({ rate: 0, amount: 0 });
  const [rates, setRates] = useState<any[]>([]);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      const result = await getCustomers(1, 100); // Get first 100 customers
      if (result.customers) {
        setCustomers(result.customers);
      }
      setLoadingCustomers(false);
    };
    fetchCustomers();
  }, []);

  // Fetch commission rates
  useEffect(() => {
    getCommissionRates().then((result) => {
      if (result.success && result.rates) {
        setRates(result.rates);
      }
    });
  }, []);

  // Calculate commission when amount or type changes
  useEffect(() => {
    if (formData.amount && formData.transactionType && rates.length > 0) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount) && amount > 0) {
        const calc = calculateCommission(amount, formData.transactionType, rates);
        setCommission({
          rate: calc.commissionRate,
          amount: calc.commissionAmount,
        });
      }
    }
  }, [formData.amount, formData.transactionType, rates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors({});

    console.log('[TransactionForm] Submitting:', formData);

    const result = await createTransaction(formData);

    if (result.success && result.transactionId) {
      onSuccess(result.transactionId);
    } else if (result.validationErrors) {
      setErrors(result.validationErrors);
    } else {
      setError(result.error || 'Failed to create transaction');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">{error}</div>
      )}

      {/* Customer Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer *
        </label>
        <select
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={loadingCustomers}
        >
          <option value="">
            {loadingCustomers ? 'Loading customers...' : 'Select customer...'}
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.customerName} - {customer.phone}
            </option>
          ))}
        </select>
        {errors.customerId && (
          <p className="text-sm text-red-600 mt-1">{errors.customerId}</p>
        )}
      </div>

      {/* Service Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Provider *
        </label>
        <select
          value={formData.serviceProvider}
          onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value as ServiceProvider })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select provider...</option>
          <option value={ServiceProvider.EcoCash}>EcoCash</option>
          <option value={ServiceProvider.Mukuru}>Mukuru</option>
          <option value={ServiceProvider.MamaMoney}>Mama Money</option>
          <option value={ServiceProvider.MOOVAR}>MOOVAR</option>
          <option value={ServiceProvider.WorldRemit}>WorldRemit</option>
        </select>
        {errors.serviceProvider && (
          <p className="text-sm text-red-600 mt-1">{errors.serviceProvider}</p>
        )}
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction Type *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value={TransactionType.Local}
              checked={formData.transactionType === TransactionType.Local}
              onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as TransactionType })}
              className="w-4 h-4 text-blue-600"
            />
            <span>Local</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value={TransactionType.International}
              checked={formData.transactionType === TransactionType.International}
              onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as TransactionType })}
              className="w-4 h-4 text-blue-600"
            />
            <span>International</span>
          </label>
        </div>
        {errors.transactionType && (
          <p className="text-sm text-red-600 mt-1">{errors.transactionType}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount *
        </label>
        <input
          type="text"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
        {errors.amount && (
          <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
        )}
        {commission.amount > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            Commission ({commission.rate}%): ${commission.amount.toFixed(2)}
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method *
        </label>
        <select
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="cash">Cash</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
        {errors.paymentMethod && (
          <p className="text-sm text-red-600 mt-1">{errors.paymentMethod}</p>
        )}
      </div>

      {/* Reference Number (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reference Number (optional)
        </label>
        <input
          type="text"
          value={formData.referenceNumber}
          onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Transaction reference..."
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Additional notes..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || loadingCustomers}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Creating...' : 'Create Transaction'}
      </button>
    </form>
  );
}
