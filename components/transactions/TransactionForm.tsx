'use client';

import { useState, useEffect } from 'react';
import { createTransaction, getCommissionRates } from '@/lib/actions/transactions';
import { ServiceProvider, TransactionType, TransactionDirection } from '@/lib/types/transaction';
import { calculateCommission } from '@/lib/validation/transaction-validation';

interface TransactionFormProps {
  onSuccess: (transactionId: string, transactionNumber: string) => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  const [formData, setFormData] = useState({
    customerId: '',
    serviceProvider: '' as ServiceProvider,
    transactionType: '' as TransactionType,
    transactionDirection: '' as TransactionDirection,
    amount: '',
    currency: 'USD',
    notes: '',
  });

  const [commission, setCommission] = useState({ rate: 0, amount: 0, total: 0 });
  const [rates, setRates] = useState<any[]>([]);

  useEffect(() => {
    getCommissionRates().then((result) => {
      if (result.success && result.rates) {
        setRates(result.rates);
      }
    });
  }, []);

  useEffect(() => {
    if (formData.amount && formData.transactionType && rates.length > 0) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount) && amount > 0) {
        const calc = calculateCommission(amount, formData.transactionType, rates);
        setCommission({
          rate: calc.commissionRate,
          amount: calc.commissionAmount,
          total: calc.totalAmount,
        });
      }
    }
  }, [formData.amount, formData.transactionType, rates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors({});

    const result = await createTransaction(formData);

    if (result.success && result.transactionId && result.transactionNumber) {
      onSuccess(result.transactionId, result.transactionNumber);
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer *
        </label>
        <input
          type="text"
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Select customer..."
        />
        {errors.customerId && (
          <p className="text-sm text-red-600 mt-1">{errors.customerId[0]}</p>
        )}
      </div>

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
          <p className="text-sm text-red-600 mt-1">{errors.serviceProvider[0]}</p>
        )}
      </div>

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
            <span>Local (8%)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value={TransactionType.International}
              checked={formData.transactionType === TransactionType.International}
              onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as TransactionType })}
              className="w-4 h-4 text-blue-600"
            />
            <span>International (10%)</span>
          </label>
        </div>
        {errors.transactionType && (
          <p className="text-sm text-red-600 mt-1">{errors.transactionType[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Direction *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value={TransactionDirection.Inbound}
              checked={formData.transactionDirection === TransactionDirection.Inbound}
              onChange={(e) => setFormData({ ...formData, transactionDirection: e.target.value as TransactionDirection })}
              className="w-4 h-4 text-blue-600"
            />
            <span>Inbound (Money In)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value={TransactionDirection.Outbound}
              checked={formData.transactionDirection === TransactionDirection.Outbound}
              onChange={(e) => setFormData({ ...formData, transactionDirection: e.target.value as TransactionDirection })}
              className="w-4 h-4 text-blue-600"
            />
            <span>Outbound (Money Out)</span>
          </label>
        </div>
        {errors.transactionDirection && (
          <p className="text-sm text-red-600 mt-1">{errors.transactionDirection[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD</option>
            <option value="ZWL">ZWL</option>
          </select>
        </div>
        {errors.amount && (
          <p className="text-sm text-red-600 mt-1">{errors.amount[0]}</p>
        )}
      </div>

      {formData.amount && formData.transactionType && commission.total > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Amount:</span>
            <span className="font-medium">{formData.currency} {formData.amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Commission ({commission.rate}%):</span>
            <span className="font-medium">{formData.currency} {commission.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t border-blue-200 pt-2">
            <span>Total:</span>
            <span>{formData.currency} {commission.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Add any additional notes..."
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Creating...' : 'Create Transaction'}
        </button>
      </div>
    </form>
  );
}
