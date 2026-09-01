'use client';

import { useRouter } from 'next/navigation';
import { Customer, SortField } from '@/lib/types/customer';
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort: (field: SortField) => void;
  sortBy?: SortField;
  isLoading?: boolean;
}

export function CustomerList({
  customers,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSort,
  sortBy,
  isLoading = false,
}: CustomerListProps) {
  const router = useRouter();
  const totalPages = Math.ceil(totalCount / pageSize);
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages;

  const handleRowClick = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  const handleSort = (field: 'name' | 'email' | 'createdAt' | 'status') => {
    if (sortBy?.field === field) {
      // Toggle direction if same field
      onSort({
        field,
        direction: sortBy.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      // New field, default to ascending
      onSort({ field, direction: 'asc' });
    }
  };

  const getSortIcon = (field: 'name' | 'email' | 'createdAt' | 'status') => {
    if (sortBy?.field !== field) return null;
    return sortBy.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const getCustomerName = (customer: Customer): string => {
    if (customer.customerType === 'individual') {
      return `${customer.firstName} ${customer.lastName}`;
    }
    return customer.businessName;
  };

  const getCustomerTypeLabel = (type: string): string => {
    return type === 'individual' ? 'Individual' : 'Business';
  };

  const getStatusColor = (status: string): string => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getAssignedEmployeeName = (customer: Customer): string => {
    // In a real app, this would be fetched or passed in
    // For now, just show the ID or a placeholder
    return customer.assignedEmployeeId ? 'Employee' : 'Unassigned';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Phone
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Assigned To
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500 text-lg">No customers found</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="text-sm text-gray-600 bg-white rounded-lg shadow px-6 py-3">
        Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of{' '}
        <strong>{totalCount}</strong> customers
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-16">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Name
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Email
                  {getSortIcon('email')}
                </button>
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Status
                  {getSortIcon('status')}
                </button>
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Assigned To
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Created At
                  {getSortIcon('createdAt')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => handleRowClick(customer.id)}
                className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                  {customer.id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{getCustomerName(customer)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-600">{customer.phone}</td>
                <td className="hidden md:table-cell px-6 py-4 text-sm">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {getCustomerTypeLabel(customer.customerType)}
                  </span>
                </td>
                <td className="hidden md:table-cell px-6 py-4 text-sm">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  </span>
                </td>
                <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                  {getAssignedEmployeeName(customer)}
                </td>
                <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                  {formatDate(customer.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="text-sm text-gray-600">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </div>

        <div className="flex items-center gap-2">
          {/* First Page Button */}
          <button
            onClick={() => onPageChange(1)}
            disabled={isFirstPage}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="First page"
            aria-label="First page"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>

          {/* Previous Page Button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={isFirstPage}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page Number Input */}
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
              onPageChange(page);
            }}
            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Next Page Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={isLastPage}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Last Page Button */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={isLastPage}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Last page"
            aria-label="Last page"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
