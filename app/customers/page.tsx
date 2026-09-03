'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { getCustomers } from '@/lib/actions/customers';
import { Customer, CustomerStatus, CustomerType, CustomerFilters, SortField } from '@/lib/types/customer';
import Link from 'next/link';
import { SearchAndFilter } from '@/components/customers/SearchAndFilter';
import { Loader } from 'lucide-react';

// Badge components
function StatusBadge({ status }: { status: CustomerStatus }) {
  return <span className={`badge ${status === 'active' ? 'badge-success' : 'badge-gray'}`}>{status === 'active' ? 'Active' : 'Inactive'}</span>
}

function TypeBadge({ type }: { type: CustomerType }) {
  return <span className={`badge ${type === 'individual' ? 'badge-info' : 'badge-purple'}`}>{type === 'individual' ? 'Individual' : 'Business'}</span>
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 skeleton" />
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

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncePending(false);
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Handle sort changes
  const handleSortChange = (newSort: SortField) => {
    setSortBy(newSort);
    setPage(1);
  };

  // Get customer display name
  const getCustomerName = (customer: Customer) => {
    return (customer as any).customerName || (customer as any).customer_name || (customer.customerType === 'individual' ? `${(customer as any).firstName || ''} ${(customer as any).lastName || ''}`.trim() : (customer as any).businessName) || 'Unknown'
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
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--dh-text)' }}>Customers</h1>
          <p style={{ color: 'var(--dh-text-2)' }}>Manage and view your customer database</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="dh-card p-4 mb-6">
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
              className="dh-btn-primary whitespace-nowrap"
            >
              + New Customer
            </Link>
          </div>

          {/* Search Feedback */}
          {(debouncePending || isSearching) && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dh-primary)' }}>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-xl px-4 py-3 mb-6" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
            <h3 className="font-semibold text-sm">Error loading customers</h3>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm mb-4" style={{ color: 'var(--dh-text-2)' }}>
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
              {searchTerm && <span>Showing {totalCount} results for &lsquo;{searchTerm}&rsquo;</span>}
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
          <div className="dh-card p-12 text-center">
            <p className="mb-4" style={{ color: 'var(--dh-text-2)' }}>
              {searchTerm
                ? `No customers match "${searchTerm}"`
                : 'No customers found'}
            </p>
            <div className="flex gap-4 justify-center">
              {searchTerm && (
                <button
                  onClick={() => handleSearch('')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={{ background: 'var(--dh-surface-2)', color: 'var(--dh-text-2)', border: '1px solid var(--dh-border)' }}
                >
                  Clear Search
                </button>
              )}
              <Link
                href="/customers/new"
                className="dh-btn-primary"
              >
                Create your first customer
              </Link>
            </div>
          </div>
        )}

        {/* Customer Table / List */}
        {!isLoading && customers.length > 0 && (
          <div className="dh-card overflow-hidden">
            {/* Desktop Table View (≥1200px) */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="dh-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <td className="font-medium" style={{ color: 'var(--dh-text)' }}>
                        {getCustomerName(customer)}
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>
                        <TypeBadge type={customer.customerType} />
                      </td>
                      <td>
                        <StatusBadge status={customer.status} />
                      </td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-sm font-semibold hover:underline"
                          style={{ color: 'var(--dh-primary)' }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet Table View (768-1199px) */}
            <div className="hidden md:block xl:hidden overflow-x-auto">
              <table className="dh-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <td className="font-medium" style={{ color: 'var(--dh-text)' }}>
                        {getCustomerName(customer)}
                      </td>
                      <td>
                        <div>{customer.email}</div>
                        <div className="text-xs" style={{ color: 'var(--dh-text-3)' }}>{customer.phone}</div>
                      </td>
                      <td>
                        <TypeBadge type={customer.customerType} />
                      </td>
                      <td>
                        <StatusBadge status={customer.status} />
                      </td>
                      <td
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-sm font-semibold hover:underline"
                          style={{ color: 'var(--dh-primary)' }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (<768px) */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--dh-border)' }}>
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="block p-5 transition-colors duration-150 min-h-[120px] hover:bg-slate-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="text-base font-semibold truncate" style={{ color: 'var(--dh-text)' }}>
                        {getCustomerName(customer)}
                      </h3>
                      <p className="text-sm mt-1 truncate" style={{ color: 'var(--dh-text-2)' }}>{customer.email}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={customer.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm mb-3" style={{ color: 'var(--dh-text-2)' }}>
                    <span className="truncate">{customer.phone}</span>
                    <span style={{ color: 'var(--dh-text-3)' }}>•</span>
                    <TypeBadge type={customer.customerType} />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs" style={{ color: 'var(--dh-text-3)' }}>Created {formatDate(customer.createdAt)}</p>
                    <span className="font-semibold text-sm inline-flex items-center min-h-[44px] min-w-[44px] justify-center" style={{ color: 'var(--dh-primary)' }}>
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
                className="px-3 py-2 rounded-lg text-sm font-medium transition"
                style={{ background: 'var(--dh-surface)', border: '1px solid var(--dh-border)', color: 'var(--dh-text-2)' }}
              >
                ← Previous
              </button>
            )}

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition"
                    style={pageNum === page
                      ? { background: 'var(--dh-primary)', color: 'white' }
                      : { background: 'var(--dh-surface)', border: '1px solid var(--dh-border)', color: 'var(--dh-text-2)' }
                    }
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {page < totalPages && (
              <button
                onClick={() => setPage(page + 1)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition"
                style={{ background: 'var(--dh-surface)', border: '1px solid var(--dh-border)', color: 'var(--dh-text-2)' }}
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
    <Suspense fallback={<div className="p-6"><div className="max-w-7xl mx-auto"><LoadingSkeleton /></div></div>}>
      <CustomersPageInner />
    </Suspense>
  );
}
