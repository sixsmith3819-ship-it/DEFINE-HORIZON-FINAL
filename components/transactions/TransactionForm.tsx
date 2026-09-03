'use client';

import { useState, useEffect } from 'react';
import { createTransaction, getCommissionRates } from '@/lib/actions/transactions';
import { getCustomers } from '@/lib/actions/customers';
import { ServiceProvider, TransactionType } from '@/lib/types/transaction';
import { calculateCommission, validateTransactionFormData, hasValidationErrors } from '@/lib/validation/transaction-validation';
import { FieldError, FormErrorBanner } from '@/components/ui';

interface TransactionFormProps {
  onSuccess: (transactionId: string) => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
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

  const handleBlur = (fieldName: string) => {
    setTouched(prev => new Set(prev).add(fieldName));
    const allErrors = validateTransactionFormData(formData);
    setErrors(prev => ({ ...prev, [fieldName]: (allErrors as any)[fieldName] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allErrors = validateTransactionFormData(formData);
    if (hasValidationErrors(allErrors)) {
      setErrors(allErrors as any);
      return;
    }

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
      <FormErrorBanner message={error} />

      {/* Customer Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer *
        </label>
        <select
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          onBlur={() => handleBlur('customerId')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={loadingCustomers}
          aria-describedby={errors.customerId ? 'customerId-error' : undefined}
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
        <FieldError id="customerId-error" message={errors.customerId} />
      </div>

      {/* Service Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Provider *
        </label>
        <select
          value={formData.serviceProvider}
          onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value as ServiceProvider })}
          onBlur={() => handleBlur('serviceProvider')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          aria-describedby={errors.serviceProvider ? 'serviceProvider-error' : undefined}
        >
          <option value="">Select provider...</option>
          <option value={ServiceProvider.EcoCash}>EcoCash</option>
          <option value={ServiceProvider.Mukuru}>Mukuru</option>
          <option value={ServiceProvider.MamaMoney}>Mama Money</option>
          <option value={ServiceProvider.MOOVAR}>MOOVAR</option>
          <option value={ServiceProvider.WorldRemit}>WorldRemit</option>
        </select>
        <FieldError id="serviceProvider-error" message={errors.serviceProvider} />
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
        <FieldError id="transactionType-error" message={errors.transactionType} />
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
          onBlur={() => handleBlur('amount')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
          aria-describedby={errors.amount ? 'amount-error' : undefined}
        />
        <FieldError id="amount-error" message={errors.amount} />
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
          onBlur={() => handleBlur('paymentMethod')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          aria-describedby={errors.paymentMethod ? 'paymentMethod-error' : undefined}
        >
          <option value="cash">Cash</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
        <FieldError id="paymentMethod-error" message={errors.paymentMethod} />
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
