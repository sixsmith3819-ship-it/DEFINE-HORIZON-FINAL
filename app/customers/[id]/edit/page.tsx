'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CustomerType, ValidationErrors, CustomerDetail } from '@/lib/types/customer';
import { updateCustomer, getCustomerDetail } from '@/lib/actions/customers';
import { CustomerForm } from '@/components/customers/CustomerForm';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch customer data on component mount
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const result = await getCustomerDetail(customerId);

        if (!result.success) {
          setSubmitError(result.error || 'Failed to load customer');
          setLoading(false);
          return;
        }

        if (!result.customer) {
          setSubmitError('Customer not found');
          setLoading(false);
          return;
        }

        setCustomer(result.customer);
      } catch (error) {
        console.error('Error fetching customer:', error);
        setSubmitError('An unexpected error occurred while loading the customer.');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setValidationErrors({});
    setSuccessMessage(null);

    try {
      const result = await updateCustomer(customerId, formData);

      if (!result.success) {
        // Handle validation errors
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
        } else {
          setSubmitError(result.error || 'Failed to update customer');
        }
      } else {
        // Show success message and redirect
        setSuccessMessage('Customer updated successfully!');
        setTimeout(() => {
          router.push(`/customers/${customerId}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading customer...</p>
        </div>
      </div>
    );
  }

  // Error state - customer not found or permission denied
  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{submitError || 'Customer not found'}</p>
            <a href="/customers" className="text-blue-600 hover:text-blue-700 font-medium">
              Back to Customers
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Prepare initial data for the form
  const initialData = {
    firstName: customer.firstName,
    lastName: customer.lastName,
    dateOfBirth: customer.dateOfBirth,
    businessName: customer.businessName,
    contactPerson: customer.contactPerson,
    businessRegistrationNumber: customer.businessRegistrationNumber,
    taxId: customer.taxId,
    website: customer.website,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
  };

  // Render edit form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href={`/customers/${customerId}`}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
            Back to Customer Detail
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit {customer.customerType === CustomerType.Individual ? 'Individual' : 'Business'} Customer
          </h1>
          <p className="text-gray-600">Update the customer details below</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow p-8">
          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{submitError}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Read-only fields info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> The following fields cannot be edited: Customer ID, Type, Created Date, and Created By.
              These fields are locked to maintain data integrity.
            </p>
          </div>

          {/* Customer Form */}
          <CustomerForm
            customerType={customer.customerType}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            initialData={initialData}
            validationErrors={validationErrors}
            submitButtonText="Update Customer"
          />
        </div>

        {/* Non-editable field information */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information (Read-only)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
              <p className="text-gray-900 bg-white border border-gray-200 rounded p-3 font-mono text-sm">{customer.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
              <p className="text-gray-900 bg-white border border-gray-200 rounded p-3 capitalize">
                {customer.customerType === CustomerType.Individual ? 'Individual' : 'Business'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
              <p className="text-gray-900 bg-white border border-gray-200 rounded p-3 font-mono text-sm">{customer.createdBy}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
              <p className="text-gray-900 bg-white border border-gray-200 rounded p-3">
                {new Date(customer.createdAt).toLocaleString()}
              </p>
            </div>
            {customer.updatedAt !== customer.createdAt && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated By</label>
                  <p className="text-gray-900 bg-white border border-gray-200 rounded p-3 font-mono text-sm">{customer.updatedBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated Date</label>
                  <p className="text-gray-900 bg-white border border-gray-200 rounded p-3">
                    {new Date(customer.updatedAt).toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
