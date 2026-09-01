'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerType, ValidationErrors } from '@/lib/types/customer';
import { createCustomer } from '@/lib/actions/customers';
import { CustomerForm } from '@/components/customers/CustomerForm';

export default function NewCustomerPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<CustomerType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleTypeSelect = (type: CustomerType) => {
    setSelectedType(type);
    setSubmitError(null);
    setValidationErrors({});
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setValidationErrors({});

    try {
      const result = await createCustomer(formData);

      if (!result.success) {
        // Handle validation errors
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
        } else {
          setSubmitError(result.error || 'Failed to create customer');
        }
      } else {
        // Redirect to customer detail page
        router.push(`/customers/${result.customerId}`);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no customer type is selected, show type selector
  if (!selectedType) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Customer</h1>
            <p className="text-gray-600">Select the type of customer you want to create</p>
          </div>

          {/* Customer Type Selection */}
          <div className="bg-white rounded-lg shadow p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Individual Customer Option */}
              <button
                onClick={() => handleTypeSelect(CustomerType.Individual)}
                className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Individual</h3>
                  <p className="text-sm text-gray-600">Create a customer record for a person</p>
                </div>
              </button>

              {/* Business Customer Option */}
              <button
                onClick={() => handleTypeSelect(CustomerType.Business)}
                className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Business</h3>
                  <p className="text-sm text-gray-600">Create a customer record for a company</p>
                </div>
              </button>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <a
              href="/customers"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7 7l-7-7 7-7" />
              </svg>
              Back to Customers
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If customer type is selected, show the form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setSelectedType(null)}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
            Back to Type Selection
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New {selectedType === CustomerType.Individual ? 'Individual' : 'Business'} Customer
          </h1>
          <p className="text-gray-600">Fill in the customer details below</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow p-8">
          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{submitError}</p>
            </div>
          )}

          {/* Customer Form */}
          <CustomerForm
            customerType={selectedType}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            validationErrors={validationErrors}
          />
        </div>
      </div>
    </div>
  );
}
