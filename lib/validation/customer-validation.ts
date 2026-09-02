/**
 * Customer Validation Utilities
 * Validation functions for customer data with typed error responses
 */

import { CustomerFormData, CustomerType, ValidationError, ValidationErrors } from '@/lib/types/customer';

/**
 * Validates email format
 * @param email Email address to validate
 * @returns Validation result with optional error message
 */
export function validateEmail(email?: string): ValidationError {
  if (!email || email.trim() === '') {
    return { valid: true }; // Email is optional
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { valid: false, error: 'Please enter a valid email' };
  }

  return { valid: true };
}

/**
 * Validates phone number format
 * @param phoneNumber Phone number to validate
 * @returns Validation result with optional error message
 */
export function validatePhoneNumber(phoneNumber: string): ValidationError {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { valid: false, error: 'Phone number is required' };
  }

  const phonePattern = /^[\d\s\-()]{10,15}$/;
  if (!phonePattern.test(phoneNumber)) {
    return { valid: false, error: 'Phone must contain 10-15 characters' };
  }

  return { valid: true };
}

/**
 * Validates customer name
 * @param customerName Name to validate
 * @returns Validation result with optional error message
 */
export function validateCustomerName(customerName: string): ValidationError {
  if (!customerName || customerName.trim() === '') {
    return { valid: false, error: 'Customer name is required' };
  }

  if (customerName.length > 200) {
    return { valid: false, error: 'Customer name cannot exceed 200 characters' };
  }

  return { valid: true };
}

/**
 * Validates ID number
 * @param idNumber ID number to validate
 * @returns Validation result with optional error message
 */
export function validateIdNumber(idNumber?: string): ValidationError {
  if (!idNumber || idNumber.trim() === '') {
    return { valid: true }; // ID number is optional
  }

  if (idNumber.length > 50) {
    return { valid: false, error: 'ID number cannot exceed 50 characters' };
  }

  return { valid: true };
}

/**
 * Validates address
 * @param address Address to validate
 * @returns Validation result with optional error message
 */
export function validateAddress(address?: string): ValidationError {
  if (!address || address.trim() === '') {
    return { valid: true }; // Address is optional
  }

  if (address.length > 500) {
    return { valid: false, error: 'Address cannot exceed 500 characters' };
  }

  return { valid: true };
}

/**
 * Validates entire customer form data
 * Performs all necessary validations based on customer type
 * @param data Customer form data to validate
 * @returns Object with all validation errors (empty if valid)
 */
export function validateCustomerFormData(data: CustomerFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate customer name (required)
  const customerNameValidation = validateCustomerName(data.customerName);
  if (!customerNameValidation.valid) {
    errors.customerName = customerNameValidation.error;
  }

  // Validate phone number (required)
  const phoneValidation = validatePhoneNumber(data.phoneNumber);
  if (!phoneValidation.valid) {
    errors.phoneNumber = phoneValidation.error;
  }

  // Validate email (optional)
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }

  // Validate ID number (optional)
  const idNumberValidation = validateIdNumber(data.idNumber);
  if (!idNumberValidation.valid) {
    errors.idNumber = idNumberValidation.error;
  }

  // Validate address (optional)
  const addressValidation = validateAddress(data.address);
  if (!addressValidation.valid) {
    errors.address = addressValidation.error;
  }

  return errors;
}

/**
 * Check if validation errors exist
 * @param errors Validation errors object
 * @returns True if there are any errors
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}

/**
 * Get all error messages as an array
 * @param errors Validation errors object
 * @returns Array of error messages
 */
export function getErrorMessages(errors: ValidationErrors): string[] {
  return Object.values(errors).filter((error): error is string => error !== undefined);
}
