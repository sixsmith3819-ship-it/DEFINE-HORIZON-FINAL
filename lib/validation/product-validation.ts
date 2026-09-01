/**
 * Product Validation Functions
 */

import { ProductFormData, ValidationErrors } from '@/lib/types/product';

export function validateProductFormData(data: ProductFormData): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (!data.productName?.trim()) {
    errors.productName = ['Product name is required'];
  }

  if (!data.category) {
    errors.category = ['Category is required'];
  }

  if (!data.sellingPrice) {
    errors.sellingPrice = ['Selling price is required'];
  } else {
    const price = parseFloat(data.sellingPrice);
    if (isNaN(price) || price < 0) {
      errors.sellingPrice = ['Selling price must be a positive number'];
    }
  }

  if (data.costPrice) {
    const cost = parseFloat(data.costPrice);
    if (isNaN(cost) || cost < 0) {
      errors.costPrice = ['Cost price must be a positive number'];
    }
  }

  if (!data.quantity) {
    errors.quantity = ['Quantity is required'];
  } else {
    const qty = parseInt(data.quantity);
    if (isNaN(qty) || qty < 0) {
      errors.quantity = ['Quantity must be a positive number'];
    }
  }

  if (!data.lowStockThreshold) {
    errors.lowStockThreshold = ['Low stock threshold is required'];
  } else {
    const threshold = parseInt(data.lowStockThreshold);
    if (isNaN(threshold) || threshold < 0) {
      errors.lowStockThreshold = ['Threshold must be a positive number'];
    }
  }

  return errors;
}

export function hasValidationErrors(errors: Record<string, string[]>): boolean {
  return Object.keys(errors).length > 0;
}

export function isLowStock(quantity: number, threshold: number): boolean {
  return quantity > 0 && quantity <= threshold;
}

export function isOutOfStock(quantity: number): boolean {
  return quantity === 0;
}
