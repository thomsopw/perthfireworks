import { useState, useCallback } from 'react';
import type { EventFilters } from '../hooks/useEvents';

interface FiltersProps {
  onFiltersChange: (filters: EventFilters) => void;
  onFindNearest: () => void;
  totalEvents: number;
  filteredCount: number;
}

export default function Filters({ onFiltersChange, onFindNearest, totalEvents, filteredCount }: FiltersProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchText, setSearchText] = useState('');

  const handleFilterChange = useCallback(() => {
    onFiltersChange({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      searchText: searchText || undefined,
    });
  }, [dateFrom, dateTo, searchText, onFiltersChange]);

  const handleClear = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setSearchText('');
    onFiltersChange({});
  }, [onFiltersChange]);

  return (
    <div className="p-4 border-b bg-white space-y-3">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search events or locations..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setTimeout(handleFilterChange, 100);
          }}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Date Range */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setTimeout(handleFilterChange, 100);
            }}
            className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setTimeout(handleFilterChange, 100);
            }}
            className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onFindNearest}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          📍 Find Nearest
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Event Count */}
      <div className="text-xs text-gray-500 text-center">
        Showing {filteredCount} of {totalEvents} events
      </div>
    </div>
  );
}
