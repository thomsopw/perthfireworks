import { useState, useCallback, useEffect } from 'react';
import Map from './components/Map';
import EventList from './components/EventList';
import Filters from './components/Filters';
import NearestEvents from './components/NearestEvents';
import { useEvents } from './hooks/useEvents';
import type { FireworksEvent } from './types';

export default function App() {
  const { 
    events, 
    filteredEvents, 
    loading, 
    error, 
    lastUpdated, 
    setFilters,
    eventDistances,
    userLocation,
    setUserLocation,
  } = useEvents();
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

  const handleLocationRequest = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          alert('Unable to get your location. Please check your browser permissions.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }, [setUserLocation]);

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
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white px-3 md:px-4 py-2 md:py-4 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <span className="text-xl md:text-3xl">🎆</span>
              <span className="truncate">Perth Fireworks Map</span>
            </h1>
            <p className="text-xs md:text-sm text-blue-100/90 font-medium hidden sm:block">
              Find upcoming fireworks events in Western Australia
            </p>
          </div>
          {lastUpdated && (
            <div className="text-xs text-blue-100/80 bg-blue-500/20 px-2 md:px-3 py-1 md:py-1.5 rounded-full backdrop-blur-sm flex-shrink-0 hidden sm:block">
              Updated: {new Date(lastUpdated).toLocaleDateString('en-AU')}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-full md:w-96 flex flex-col bg-white border-r border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
          {showNearest ? (
            <NearestEvents
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onEventClick={handleEventClick}
              onClose={handleCloseNearest}
            />
          ) : (
            <>
              <div className="flex-shrink-0 overflow-y-auto max-h-[40vh] md:max-h-none">
                <Filters
                  onFiltersChange={setFilters}
                  onFindNearest={handleFindNearest}
                  totalEvents={events.length}
                  filteredCount={filteredEvents.length}
                  userLocation={userLocation}
                  onLocationRequest={handleLocationRequest}
                />
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <EventList
                  events={filteredEvents}
                  selectedEvent={selectedEvent}
                  onEventClick={handleEventClick}
                  loading={loading}
                  eventDistances={eventDistances}
                />
              </div>
            </>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[50vh] md:min-h-0" style={{ minHeight: '400px' }}>
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
