'use client';

import { useState } from 'react';
import { CustomerFormData, CustomerType, ValidationErrors } from '@/lib/types/customer';

interface CustomerFormProps {
  customerType: CustomerType;
  isSubmitting?: boolean;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  initialData?: Partial<CustomerFormData>;
  validationErrors?: ValidationErrors;
  submitButtonText?: string;
  mode?: 'create' | 'edit';
}

export function CustomerForm({
  customerType,
  isSubmitting = false,
  onSubmit,
  initialData,
  validationErrors = {},
  submitButtonText = 'Create Customer',
  mode = 'create',
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    customerType,
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    businessName: initialData?.businessName || '',
    contactPerson: initialData?.contactPerson || '',
    businessRegistrationNumber: initialData?.businessRegistrationNumber || '',
    taxId: initialData?.taxId || '',
    website: initialData?.website || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
  });

  const [localErrors, setLocalErrors] = useState<ValidationErrors>(validationErrors);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (localErrors[name]) {
      setLocalErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouchedFields((prev) => new Set([...prev, name]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const isIndividual = customerType === CustomerType.Individual;
  const isBusiness = customerType === CustomerType.Business;

  // Base input styling with improved visual hierarchy
  const baseInputClass = 'w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ease-in-out';
  const normalInputClass = `${baseInputClass} border border-gray-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed`;
  const errorInputClass = `${baseInputClass} border border-red-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-0 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed`;
  
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';
  const errorMessageClass = 'text-red-600 text-sm font-medium mt-1';
  const optionalClass = 'text-gray-400 font-normal';
  const sectionClass = 'p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4';
  const sectionHeaderClass = 'text-base font-semibold text-gray-900 -mx-6 -mt-6 px-6 py-3 border-b border-gray-200 bg-gray-100';

  const renderField = (
    name: keyof CustomerFormData,
    label: string,
    type: string = 'text',
    isRequired: boolean = false,
    isTextarea: boolean = false,
    placeholder?: string
  ) => {
    const hasError = !!localErrors[name];
    const value = formData[name] as string;

    return (
      <div key={name}>
        <label htmlFor={name} className={labelClass}>
          {label}
          {isRequired ? (
            <span className="text-red-600 font-bold ml-1">*</span>
          ) : (
            <span className={optionalClass}> (Optional)</span>
          )}
        </label>
        {isTextarea ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={hasError ? errorInputClass : normalInputClass}
            disabled={isSubmitting}
            required={isRequired}
            rows={4}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={hasError ? errorInputClass : normalInputClass}
            disabled={isSubmitting}
            required={isRequired}
            placeholder={placeholder}
          />
        )}
        {hasError && <p className={errorMessageClass}>{localErrors[name]}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto w-full space-y-4">
      {/* Type Selector - Only show in create mode for new customers */}
      {mode === 'create' && (
        <div className={sectionClass}>
          <h3 className={sectionHeaderClass}>Customer Type</h3>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="individual"
                checked={isIndividual}
                disabled
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Individual</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="business"
                checked={isBusiness}
                disabled
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Business</span>
            </label>
          </div>
        </div>
      )}

      {/* Individual Fields */}
      {isIndividual && (
        <div className={sectionClass}>
          <h3 className={sectionHeaderClass}>Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {renderField('firstName', 'First Name', 'text', true, false, 'John')}
            {renderField('lastName', 'Last Name', 'text', true, false, 'Doe')}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {renderField('dateOfBirth', 'Date of Birth', 'date', false, false)}
          </div>
        </div>
      )}

      {/* Business Fields */}
      {isBusiness && (
        <div className={sectionClass}>
          <h3 className={sectionHeaderClass}>Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {renderField('businessName', 'Business Name', 'text', true, false, 'ACME Corporation')}
            {renderField('contactPerson', 'Contact Person', 'text', true, false, 'Jane Smith')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField(
              'businessRegistrationNumber',
              'Business Registration Number',
              'text',
              true,
              false,
              'BR-12345678'
            )}
            {renderField('taxId', 'Tax ID', 'text', false, false, 'TAX-12345')}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {renderField('website', 'Website', 'url', false, false, 'https://example.com')}
          </div>
        </div>
      )}

      {/* Contact Information Section */}
      <div className={sectionClass}>
        <h3 className={sectionHeaderClass}>Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {renderField('email', 'Email', 'email', true, false, 'john@example.com')}
          {renderField('phone', 'Phone', 'tel', true, false, '(555) 123-4567')}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderField(
            'address',
            'Address',
            'text',
            true,
            true,
            '123 Main St, Suite 100, City, State 12345'
          )}
        </div>
      </div>

      {/* Submit and Cancel Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2 mt-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 ease-in-out shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md flex items-center justify-center gap-2 min-h-[44px] sm:min-h-auto"
        >
          {isSubmitting && (
            <svg
              className="w-4 h-4 animate-spin flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          <span>{isSubmitting ? 'Submitting...' : submitButtonText}</span>
        </button>
        <a
          href="/customers"
          className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-all duration-200 ease-in-out shadow-md hover:shadow-lg text-center min-h-[44px] sm:min-h-auto flex items-center justify-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
