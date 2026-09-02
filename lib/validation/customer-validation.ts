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
export function validateEmail(email: string): ValidationError {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { valid: false, error: 'Please enter a valid email' };
  }

  return { valid: true };
}

/**
 * Validates phone number format
 * @param phone Phone number to validate
 * @returns Validation result with optional error message
 */
export function validatePhone(phone: string): ValidationError {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone is required' };
  }

  const phonePattern = /^[\d\s\-()]{10,15}$/;
  if (!phonePattern.test(phone)) {
    return { valid: false, error: 'Phone must contain 10-15 characters' };
  }

  return { valid: true };
}

/**
 * Validates name fields (first name, last name, etc.)
 * @param name Name to validate
 * @param fieldName Display name of the field
 * @returns Validation result with optional error message
 */
export function validateName(name: string, fieldName: string): ValidationError {
  if (!name || name.trim() === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (name.length > 100) {
    return { valid: false, error: `${fieldName} cannot exceed 100 characters` };
  }

  return { valid: true };
}

/**
 * Validates business registration number
 * @param registration Business registration number to validate
 * @returns Validation result with optional error message
 */
export function validateBusinessRegistration(registration: string): ValidationError {
  if (!registration || registration.trim() === '') {
    return { valid: false, error: 'Business registration is required' };
  }

  if (registration.length > 100) {
    return { valid: false, error: 'Business registration cannot exceed 100 characters' };
  }

  return { valid: true };
}

/**
 * Validates address
 * @param address Address to validate
 * @returns Validation result with optional error message
 */
export function validateAddress(address: string): ValidationError {
  if (!address || address.trim() === '') {
    return { valid: false, error: 'Address is required' };
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

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }

  // Validate phone
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error;
  }

  // Validate address
  const addressValidation = validateAddress(data.address);
  if (!addressValidation.valid) {
    errors.address = addressValidation.error;
  }

  // Customer type specific validations
  if (data.customerType === CustomerType.Individual) {
    // Validate first name
    if (data.firstName !== undefined) {
      const firstNameValidation = validateName(data.firstName, 'First name');
      if (!firstNameValidation.valid) {
        errors.firstName = firstNameValidation.error;
      }
    } else {
      errors.firstName = 'First name is required';
    }

    // Validate last name
    if (data.lastName !== undefined) {
      const lastNameValidation = validateName(data.lastName, 'Last name');
      if (!lastNameValidation.valid) {
        errors.lastName = lastNameValidation.error;
      }
    } else {
      errors.lastName = 'Last name is required';
    }

    // Date of birth is optional for individuals
    // Could add additional validation if needed (e.g., valid date format, not in future)
  } else if (data.customerType === CustomerType.Business) {
    // Validate business name
    if (data.businessName !== undefined) {
      const businessNameValidation = validateName(data.businessName, 'Business name');
      if (!businessNameValidation.valid) {
        errors.businessName = businessNameValidation.error;
      }
    } else {
      errors.businessName = 'Business name is required';
    }

    // Validate contact person
    if (data.contactPerson !== undefined) {
      const contactPersonValidation = validateName(data.contactPerson, 'Contact person');
      if (!contactPersonValidation.valid) {
        errors.contactPerson = contactPersonValidation.error;
      }
    } else {
      errors.contactPerson = 'Contact person is required';
    }

    // Validate business registration
    if (data.businessRegistrationNumber !== undefined) {
      const regValidation = validateBusinessRegistration(data.businessRegistrationNumber);
      if (!regValidation.valid) {
        errors.businessRegistrationNumber = regValidation.error;
      }
    } else {
      errors.businessRegistrationNumber = 'Business registration is required';
    }

    // Tax ID is optional for businesses
    // Website is optional for businesses
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
