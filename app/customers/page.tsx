'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { getCustomers } from '@/lib/actions/customers';
import { Customer, CustomerStatus, CustomerType, CustomerFilters, SortField } from '@/lib/types/customer';
import Link from 'next/link';
import { SearchAndFilter } from '@/components/customers/SearchAndFilter';
import { Loader } from 'lucide-react';

// Badge component for status and type
function StatusBadge({ status }: { status: CustomerStatus }) {
  const color = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  const label = status === 'active' ? 'Active' : 'Inactive';
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

function TypeBadge({ type }: { type: CustomerType }) {
  const color = type === 'individual' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  const label = type === 'individual' ? 'Individual' : 'Business';
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
}

function CustomersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse initial search params
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';
  const initialStatus = (searchParams.get('status') as CustomerStatus | null) || undefined;
  const initialType = (searchParams.get('type') as CustomerType | null) || undefined;
  const initialSort = (searchParams.get('sort') as 'name' | 'email' | 'createdAt' | 'status') || 'createdAt';
  const initialSortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc';

  // State management
  const [page, setPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState<CustomerFilters>({
    status: initialStatus,
    customerType: initialType,
  });
  const [sortBy, setSortBy] = useState<SortField>({
    field: initialSort,
    direction: initialSortDir,
  });

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce and search tracking
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncePending, setDebouncePending] = useState(false);

  // Update URL whenever params change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (searchTerm) params.set('search', searchTerm);
    if (filters.status) params.set('status', filters.status);
    if (filters.customerType) params.set('type', filters.customerType);
    params.set('sort', sortBy.field);
    params.set('sortDir', sortBy.direction);

    const queryString = params.toString();
    const newUrl = `/customers?${queryString}`;
    
    // Use shallow routing to avoid page reload
    window.history.replaceState(null, '', newUrl);
  }, [page, searchTerm, filters, sortBy]);

  // Fetch customers when params change
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getCustomers(page, 25, searchTerm, filters, sortBy);

        if ('error' in result) {
          setError(result.error || 'An unknown error occurred');
          setCustomers([]);
          setTotalCount(0);
          setTotalPages(0);
        } else {
          setCustomers(result.customers);
          setTotalCount(result.totalCount);
          setTotalPages(result.totalPages);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch customers');
        setCustomers([]);
        setTotalCount(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    };

    fetchCustomers();
  }, [page, searchTerm, filters, sortBy]);

  // Handle search with debounce
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setDebouncePending(true);
    setIsSearching(true);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 300ms debounce
    debounceTimerRef.current = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search
      setDebouncePending(false);
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
  };

  // Handle sort changes
  const handleSortChange = (newSort: SortField) => {
    setSortBy(newSort);
    setPage(1); // Reset to page 1 on sort change
  };

  // Get customer display name
  const getCustomerName = (customer: Customer) => {
    if (customer.customerType === 'individual') {
      return `${customer.firstName} ${customer.lastName}`;
    }
    return customer.businessName;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers</h1>
          <p className="text-gray-600">Manage and view your customer database</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
            <div className="flex-1 w-full">
              <SearchAndFilter
                onSearch={handleSearch}
                onFilter={handleFilterChange}
                onSort={handleSortChange}
                filters={filters}
                sortBy={sortBy}
                searchTerm={searchTerm}
              />
            </div>
            <Link
              href="/customers/new"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition whitespace-nowrap"
            >
              + New Customer
            </Link>
          </div>

          {/* Search Feedback */}
          {(debouncePending || isSearching) && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error loading customers</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Results Count with Search Feedback */}
        <div className="text-sm text-gray-600 mb-6">
          {isLoading ? (
            <span>Loading...</span>
          ) : totalCount === 0 ? (
            <span>
              {searchTerm
                ? `No results found for "${searchTerm}"`
                : 'No customers found'}
            </span>
          ) : (
            <>
              {searchTerm && <span>Showing {totalCount} results for '{searchTerm}'</span>}
              {!searchTerm && (
                <>
                  Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, totalCount)} of {totalCount} customers
                </>
              )}
            </>
          )}
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Empty State */}
        {!isLoading && customers.length === 0 && !error && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? `No customers match "${searchTerm}"`
                : 'No customers found'}
            </p>
            <div className="flex gap-4 justify-center">
              {searchTerm && (
                <button
                  onClick={() => handleSearch('')}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                  Clear Search
                </button>
              )}
              <Link
                href="/customers/new"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create your first customer
              </Link>
            </div>
          </div>
        )}

        {/* Customer Table / List */}
        {!isLoading && customers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Desktop Table View (≥1200px) - All columns visible */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getCustomerName(customer)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TypeBadge type={customer.customerType} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={customer.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(customer.createdAt)}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet Table View (768-1199px) - Condensed, hide non-essential columns */}
            <div className="hidden md:block xl:hidden overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {getCustomerName(customer)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">{customer.email}</div>
                        <div className="text-xs text-gray-500">{customer.phone}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <TypeBadge type={customer.customerType} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={customer.status} />
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (<768px) - Essential info with 44px touch targets */}
            <div className="md:hidden divide-y divide-gray-200">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="block p-5 hover:bg-blue-50 active:bg-blue-100 transition-colors duration-150 min-h-[120px]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {getCustomerName(customer)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 truncate">{customer.email}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={customer.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span className="truncate">{customer.phone}</span>
                    <span className="text-gray-400">•</span>
                    <TypeBadge type={customer.customerType} />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">Created {formatDate(customer.createdAt)}</p>
                    <span className="text-blue-600 font-medium text-sm inline-flex items-center min-h-[44px] min-w-[44px] justify-center">
                      View →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                ← Previous
              </button>
            )}

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 rounded transition ${
                      pageNum === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {page < totalPages && (
              <button
                onClick={() => setPage(page + 1)}
                className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

}

// Wrap in Suspense to handle useSearchParams
export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-8"><div className="max-w-7xl mx-auto"><LoadingSkeleton /></div></div>}>
      <CustomersPageInner />
    </Suspense>
  );
}