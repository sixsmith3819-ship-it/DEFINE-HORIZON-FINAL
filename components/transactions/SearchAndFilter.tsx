'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchAndFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/transactions');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            defaultValue={searchParams.get('search') || ''}
            onChange={(e) => handleFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          defaultValue={searchParams.get('provider') || 'all'}
          onChange={(e) => handleFilter('provider', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Providers</option>
          <option value="EcoCash">EcoCash</option>
          <option value="Mukuru">Mukuru</option>
          <option value="Mama Money">Mama Money</option>
          <option value="MOOVAR">MOOVAR</option>
          <option value="WorldRemit">WorldRemit</option>
        </select>

        <select
          defaultValue={searchParams.get('type') || 'all'}
          onChange={(e) => handleFilter('type', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="local">Local</option>
          <option value="international">International</option>
        </select>

        <select
          defaultValue={searchParams.get('direction') || 'all'}
          onChange={(e) => handleFilter('direction', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Directions</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>

        <select
          defaultValue={searchParams.get('status') || 'all'}
          onChange={(e) => handleFilter('status', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {(searchParams.get('search') || searchParams.get('provider') || searchParams.get('type') || searchParams.get('direction') || searchParams.get('status')) && (
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
