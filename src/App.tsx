import { useState, useCallback, useEffect } from 'react';
import Map from './components/Map';
import EventList from './components/EventList';
import Filters from './components/Filters';
import NearestEvents from './components/NearestEvents';
import { useEvents } from './hooks/useEvents';
import type { FireworksEvent } from './types';

export default function App() {
  const { events, filteredEvents, loading, error, lastUpdated, setFilters } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<FireworksEvent | null>(null);
  const [showNearest, setShowNearest] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering for Leaflet
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleEventClick = useCallback((event: FireworksEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleFindNearest = useCallback(() => {
    setShowNearest(true);
  }, []);

  const handleCloseNearest = useCallback(() => {
    setShowNearest(false);
  }, []);

  // Error state
  if (error && events.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            The data might not be available yet. Please try again later or trigger a manual update.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              🎆 Perth Fireworks Map
            </h1>
            <p className="text-sm text-blue-100 mt-0.5">
              Find upcoming fireworks events in Western Australia
            </p>
          </div>
          {lastUpdated && (
            <div className="text-xs text-blue-200">
              Updated: {new Date(lastUpdated).toLocaleDateString('en-AU')}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-96 flex flex-col bg-white border-r shadow-sm overflow-hidden">
          {showNearest ? (
            <NearestEvents
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onEventClick={handleEventClick}
              onClose={handleCloseNearest}
            />
          ) : (
            <>
              <Filters
                onFiltersChange={setFilters}
                onFindNearest={handleFindNearest}
                totalEvents={events.length}
                filteredCount={filteredEvents.length}
              />
              <EventList
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onEventClick={handleEventClick}
                loading={loading}
              />
            </>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: '400px' }}>
          {isClient ? (
            <Map
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onEventClick={handleEventClick}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
