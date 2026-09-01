'use client';

import { useState, useCallback, useEffect } from 'react';
import { CustomerFilters, SortField, CustomerStatus, CustomerType } from '@/lib/types/customer';
import { Search, Filter, X } from 'lucide-react';

interface SearchAndFilterProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (filters: CustomerFilters) => void;
  onSort: (sortBy: SortField) => void;
  filters?: CustomerFilters;
  sortBy?: SortField;
  searchTerm?: string;
  userRole?: 'admin' | 'manager' | 'employee';
  statusCounts?: { active: number; inactive: number };
}

export function SearchAndFilter({
  onSearch,
  onFilter,
  onSort,
  filters = {},
  sortBy,
  searchTerm = '',
  userRole = 'admin',
  statusCounts,
}: SearchAndFilterProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localFilters, setLocalFilters] = useState<CustomerFilters>(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced search handler (300ms)
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onSearch(localSearchTerm);
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [localSearchTerm, onSearch]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  // Handle Enter key for immediate search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      onSearch(localSearchTerm);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof CustomerFilters, value: any) => {
    const newFilters = { ...localFilters };

    if (value === undefined || value === null || value === '') {
      delete newFilters[filterType];
    } else {
      newFilters[filterType] = value;
    }

    setLocalFilters(newFilters);
    onFilter(newFilters);
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const field = e.target.value as 'name' | 'email' | 'createdAt' | 'status';

    if (!field) {
      return;
    }

    // If clicking same field, toggle direction; otherwise default to asc
    const newDirection = sortBy?.field === field && sortBy?.direction === 'asc' ? 'desc' : 'asc';

    onSort({
      field,
      direction: newDirection,
    });
  };

  // Clear individual filter
  const clearFilter = (filterType: keyof CustomerFilters) => {
    handleFilterChange(filterType, undefined);
  };

  // Clear all filters and search
  const clearAll = () => {
    setLocalSearchTerm('');
    setLocalFilters({});
    onSearch('');
    onFilter({});
  };

  // Count active filters
  const activeFilterCount = Object.keys(localFilters).length + (localSearchTerm ? 1 : 0);

  const getSortLabel = (): string => {
    if (!sortBy) return 'Sort by...';
    const directions: Record<string, string> = {
      name: sortBy.direction === 'asc' ? 'Name (A-Z)' : 'Name (Z-A)',
      email: sortBy.direction === 'asc' ? 'Email (A-Z)' : 'Email (Z-A)',
      createdAt: sortBy.direction === 'asc' ? 'Created (Oldest)' : 'Created (Newest)',
      status: sortBy.direction === 'asc' ? 'Status (A-Z)' : 'Status (Z-A)',
    };
    return directions[sortBy.field] || 'Sort by...';
  };

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search Input */}
        <div className="flex-1 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, company..."
              value={localSearchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="w-full lg:w-48">
          <select
            value={sortBy ? `${sortBy.field}_${sortBy.direction}` : ''}
            onChange={(e) => {
              if (e.target.value) {
                const [field, direction] = e.target.value.split('_') as ['name' | 'email' | 'createdAt' | 'status', 'asc' | 'desc'];
                onSort({ field, direction });
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Sort by...</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="email_asc">Email (A-Z)</option>
            <option value="email_desc">Email (Z-A)</option>
            <option value="createdAt_desc">Created (Newest)</option>
            <option value="createdAt_asc">Created (Oldest)</option>
            <option value="status_asc">Status (A-Z)</option>
            <option value="status_desc">Status (Z-A)</option>
          </select>
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors relative ${
            showFilters
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible Filters Section */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={localFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value as CustomerStatus | undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Statuses</option>
                <option value={CustomerStatus.Active}>Active {statusCounts?.active ? `(${statusCounts.active})` : ''}</option>
                <option value={CustomerStatus.Inactive}>Inactive {statusCounts?.inactive ? `(${statusCounts.inactive})` : ''}</option>
              </select>
            </div>

            {/* Customer Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
              <select
                value={localFilters.customerType || ''}
                onChange={(e) => handleFilterChange('customerType', e.target.value as CustomerType | undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Types</option>
                <option value={CustomerType.Individual}>Individual</option>
                <option value={CustomerType.Business}>Business</option>
              </select>
            </div>

            {/* Created After Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Created After</label>
              <input
                type="date"
                value={localFilters.createdAfter || ''}
                onChange={(e) => {
                  const value = e.target.value || undefined;
                  handleFilterChange('createdAfter', value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Created Before Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Created Before</label>
              <input
                type="date"
                value={localFilters.createdBefore || ''}
                onChange={(e) => {
                  const value = e.target.value || undefined;
                  handleFilterChange('createdBefore', value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600 font-medium">Active filters:</span>

          {/* Search Term Badge */}
          {localSearchTerm && (
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span>Search: "{localSearchTerm}"</span>
              <button
                onClick={() => setLocalSearchTerm('')}
                className="hover:text-blue-900 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Status Badge */}
          {localFilters.status && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <span>Status: {localFilters.status}</span>
              <button
                onClick={() => clearFilter('status')}
                className="hover:text-green-900 transition-colors"
                aria-label="Clear status filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Customer Type Badge */}
          {localFilters.customerType && (
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              <span>Type: {localFilters.customerType}</span>
              <button
                onClick={() => clearFilter('customerType')}
                className="hover:text-purple-900 transition-colors"
                aria-label="Clear customer type filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Created After Badge */}
          {localFilters.createdAfter && (
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <span>After: {new Date(localFilters.createdAfter).toLocaleDateString()}</span>
              <button
                onClick={() => clearFilter('createdAfter')}
                className="hover:text-yellow-900 transition-colors"
                aria-label="Clear created after filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Created Before Badge */}
          {localFilters.createdBefore && (
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
              <span>Before: {new Date(localFilters.createdBefore).toLocaleDateString()}</span>
              <button
                onClick={() => clearFilter('createdBefore')}
                className="hover:text-orange-900 transition-colors"
                aria-label="Clear created before filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
