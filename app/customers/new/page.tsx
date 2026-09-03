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
      <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <a href="/customers" className="inline-flex items-center gap-2 text-sm font-medium mb-4" style={{ color: 'var(--dh-text-2)' }}>
              ← Back to Customers
            </a>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>Create New Customer</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--dh-text-2)' }}>Select the type of customer to create</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleTypeSelect(CustomerType.Individual)}
              className="dh-card p-8 text-left cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: 'white' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--dh-text)' }}>Individual</h3>
              <p className="text-sm" style={{ color: 'var(--dh-text-2)' }}>Create a customer record for a person</p>
            </button>

            <button
              onClick={() => handleTypeSelect(CustomerType.Business)}
              className="dh-card p-8 text-left cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: 'white' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--dh-text)' }}>Business</h3>
              <p className="text-sm" style={{ color: 'var(--dh-text-2)' }}>Create a customer record for a company</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If customer type is selected, show the form
  return (
    <div className="p-6" style={{ background: 'var(--dh-bg)', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button onClick={() => setSelectedType(null)} className="inline-flex items-center gap-2 text-sm font-medium mb-4" style={{ color: 'var(--dh-text-2)' }}>
            ← Back to Type Selection
          </button>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--dh-text)' }}>
            New {selectedType === CustomerType.Individual ? 'Individual' : 'Business'} Customer
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--dh-text-2)' }}>Fill in the customer details below</p>
        </div>

        <div className="dh-card p-6">
          {submitError && (
            <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
              {submitError}
            </div>
          )}
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
