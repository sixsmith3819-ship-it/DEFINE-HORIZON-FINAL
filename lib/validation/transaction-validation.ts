/**
 * Transaction Validation Functions
 * Validates transaction form data and calculates commissions
 */

import { TransactionFormData, ValidationErrors, CommissionRate, TransactionType } from '@/lib/types/transaction';

/**
 * Validate transaction form data
 */
export function validateTransactionFormData(data: TransactionFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required fields
  if (!data.customerId) {
    errors.customerId = ['Customer is required'];
  }

  if (!data.serviceProvider) {
    errors.serviceProvider = ['Service provider is required'];
  }

  if (!data.transactionType) {
    errors.transactionType = ['Transaction type is required'];
  }

  if (!data.transactionDirection) {
    errors.transactionDirection = ['Transaction direction is required'];
  }

  // Amount validation
  if (!data.amount) {
    errors.amount = ['Amount is required'];
  } else {
    const amount = parseFloat(data.amount);
    if (isNaN(amount)) {
      errors.amount = ['Amount must be a valid number'];
    } else if (amount <= 0) {
      errors.amount = ['Amount must be greater than zero'];
    } else if (!/^\d+(\.\d{1,2})?$/.test(data.amount)) {
      errors.amount = ['Amount can have maximum 2 decimal places'];
    }
  }

  // Currency validation
  if (!data.currency) {
    errors.currency = ['Currency is required'];
  }

  return errors;
}

/**
 * Check if validation errors exist
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Get error messages as array
 */
export function getErrorMessages(errors: ValidationErrors): string[] {
  return Object.values(errors).flat();
}

/**
 * Calculate commission based on transaction type
 */
export function calculateCommission(
  amount: number,
  transactionType: TransactionType,
  rates: CommissionRate[]
): { commissionRate: number; commissionAmount: number; totalAmount: number } {
  // Find rate for transaction type
  const rateConfig = rates.find((r) => r.transactionType === transactionType);
  
  // Default rates if not found in database
  const commissionRate = rateConfig?.rate || (transactionType === TransactionType.International ? 10 : 8);
  
  // Calculate commission
  const commissionAmount = (amount * commissionRate) / 100;
  const totalAmount = amount + commissionAmount;

  return {
    commissionRate,
    commissionAmount: parseFloat(commissionAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
}
