'use client';

import { useRouter } from 'next/navigation';
import { Customer, CustomerType, CustomerStatus } from '@/lib/types/customer';

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
  showAssignedTo?: boolean;
  assignedEmployeeName?: string;
}

/**
 * CustomerCard Component
 * 
 * Displays a customer summary card with interactive clickability.
 * Shows customer info, contact details, type/status badges, and optionally assigned employee.
 * Responsive design suitable for mobile list views.
 */
export function CustomerCard({
  customer,
  onClick,
  showAssignedTo = false,
  assignedEmployeeName,
}: CustomerCardProps) {
  const router = useRouter();

  /**
   * Calculate age from date of birth
   */
  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /**
   * Format date to readable string
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Get customer name display based on type
   */
  const getCustomerName = (): { primary: string; secondary?: string } => {
    if (customer.customerType === CustomerType.Individual) {
      const individual = customer as any;
      const age = calculateAge(individual.dateOfBirth);
      const ageText = individual.dateOfBirth && age !== null ? ` (${formatDate(individual.dateOfBirth)} age ${age})` : '';
      return {
        primary: `${individual.firstName} ${individual.lastName}${ageText}`,
      };
    } else {
      const business = customer as any;
      return {
        primary: business.businessName,
        secondary: `Contact: ${business.contactPerson}`,
      };
    }
  };

  /**
   * Get type badge styling and label
   */
  const getTypeBadge = (): { label: string; bgColor: string; textColor: string } => {
    if (customer.customerType === CustomerType.Individual) {
      return {
        label: 'Individual',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
      };
    } else {
      return {
        label: 'Business',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
      };
    }
  };

  /**
   * Get status badge styling and label
   */
  const getStatusBadge = (): { label: string; bgColor: string; textColor: string } => {
    if (customer.status === CustomerStatus.Active) {
      return {
        label: 'Active',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
      };
    } else {
      return {
        label: 'Inactive',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
      };
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/customers/${customer.id}`);
    }
  };

  const customerName = getCustomerName();
  const typeBadge = getTypeBadge();
  const statusBadge = getStatusBadge();
  const createdDate = formatDate(customer.createdAt);

  return (
    <article
      onClick={handleCardClick}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
    >
      {/* Header: Name and Badges */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {customerName.primary}
          </h3>
          {customerName.secondary && (
            <p className="mt-1 text-sm text-gray-600 truncate">
              {customerName.secondary}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${typeBadge.bgColor} ${typeBadge.textColor} whitespace-nowrap`}
          >
            {typeBadge.label}
          </span>
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.bgColor} ${statusBadge.textColor} whitespace-nowrap`}
          >
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-3 space-y-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Email:</span>
          <a
            href={`mailto:${customer.email}`}
            className="text-blue-600 hover:text-blue-800 hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {customer.email}
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Phone:</span>
          <a
            href={`tel:${customer.phone}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {customer.phone}
          </a>
        </div>
      </div>

      {/* Assigned Employee (if applicable) */}
      {showAssignedTo && (
        <div className="mb-3 border-b border-gray-100 pb-3">
          <div className="text-sm">
            <span className="text-gray-600">Assigned to:</span>
            <span className="ml-2 font-medium text-gray-900">
              {assignedEmployeeName || 'Unassigned'}
            </span>
          </div>
        </div>
      )}

      {/* Created Date */}
      <div className="text-xs text-gray-500">
        Created {createdDate}
      </div>
    </article>
  );
}
