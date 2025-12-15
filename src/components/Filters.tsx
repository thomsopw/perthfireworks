import { useState } from 'react';
import type { FireworksEvent } from '../types/events';

interface FiltersProps {
  events: FireworksEvent[];
  onFilterChange: (filteredEvents: FireworksEvent[]) => void;
  onNearestModeToggle: (enabled: boolean) => void;
  nearestMode: boolean;
}

export default function Filters({
  events,
  onFilterChange,
  onNearestModeToggle,
  nearestMode,
}: FiltersProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const handleFilter = () => {
    let filtered = [...events];

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((event) => event.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((event) => event.date <= endDate);
    }

    // Filter by location search
    if (searchLocation) {
      const searchLower = searchLocation.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.location.toLowerCase().includes(searchLower) ||
          event.purpose.toLowerCase().includes(searchLower)
      );
    }

    onFilterChange(filtered);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setSearchLocation('');
    onFilterChange(events);
  };

  return (
    <div className="bg-white p-4 border-b shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Location or Event
          </label>
          <input
            type="text"
            value={searchLocation}
            onChange={(e) => {
              setSearchLocation(e.target.value);
              handleFilter();
            }}
            placeholder="Search by location or event name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              handleFilter();
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              handleFilter();
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-md cursor-pointer hover:bg-blue-200 transition-colors">
            <input
              type="checkbox"
              checked={nearestMode}
              onChange={(e) => onNearestModeToggle(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Find Nearest</span>
          </label>
        </div>
      </div>
    </div>
  );
}

