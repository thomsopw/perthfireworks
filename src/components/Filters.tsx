import { useState, useCallback, useEffect } from 'react';
import type { EventFilters } from '../hooks/useEvents';

interface FiltersProps {
  onFiltersChange: (filters: EventFilters) => void;
  onFindNearest: () => void;
  totalEvents: number;
  filteredCount: number;
  userLocation: { lat: number; lng: number } | null;
  onLocationRequest: () => void;
}

export default function Filters({ 
  onFiltersChange, 
  onFindNearest, 
  totalEvents, 
  filteredCount,
  userLocation,
  onLocationRequest,
}: FiltersProps) {
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickDate, setQuickDate] = useState<'today' | 'thisWeek' | 'thisMonth' | 'all'>('all');
  const [maxDistance, setMaxDistance] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'dateAsc' | 'dateDesc' | 'distance' | 'name'>('dateAsc');

  // Update filters when local state changes
  useEffect(() => {
    const filters: EventFilters = {
      searchText: searchText || undefined,
      dateFrom: quickDate === 'all' ? (dateFrom || undefined) : undefined,
      dateTo: quickDate === 'all' ? (dateTo || undefined) : undefined,
      quickDate: quickDate !== 'all' ? quickDate : undefined,
      maxDistance: maxDistance,
      sortBy: sortBy,
    };
    onFiltersChange(filters);
  }, [searchText, dateFrom, dateTo, quickDate, maxDistance, sortBy, onFiltersChange]);

  const handleClear = useCallback(() => {
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setQuickDate('all');
    setMaxDistance(undefined);
    setSortBy('dateAsc');
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters = searchText || dateFrom || dateTo || quickDate !== 'all' || maxDistance || sortBy !== 'dateAsc';

  return (
    <div className="p-4 border-b bg-white space-y-4">
      {/* Search */}
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search events or locations..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-3 py-2.5 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Quick Date Filters */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Quick Filters</label>
        <div className="flex gap-2 flex-wrap">
          {(['today', 'thisWeek', 'thisMonth', 'all'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setQuickDate(option)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                quickDate === option
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option === 'today' ? 'Today' : 
               option === 'thisWeek' ? 'This Week' :
               option === 'thisMonth' ? 'This Month' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range (only show when "All" is selected) */}
      {quickDate === 'all' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Distance Filter */}
      {userLocation ? (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Within {maxDistance || 50} km
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="50"
              value={maxDistance || 50}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <button
              onClick={() => setMaxDistance(undefined)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={onLocationRequest}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            📍 Enable Location for Distance Filter
          </button>
        </div>
      )}

      {/* Sort */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="dateAsc">Date (Soonest First)</option>
          <option value="dateDesc">Date (Latest First)</option>
          {userLocation && <option value="distance">Distance (Nearest First)</option>}
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t">
        <button
          onClick={onFindNearest}
          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          📍 Find Nearest
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Event Count */}
      <div className="text-xs text-center pt-2 border-t">
        <span className="font-medium text-gray-700">{filteredCount}</span>
        <span className="text-gray-500"> of </span>
        <span className="font-medium text-gray-700">{totalEvents}</span>
        <span className="text-gray-500"> events</span>
      </div>
    </div>
  );
}
