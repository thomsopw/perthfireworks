import { useState, useEffect } from 'react';
import MapWrapper from './components/MapWrapper';
import EventList from './components/EventList';
import Filters from './components/Filters';
import NearestEvents from './components/NearestEvents';
import type { FireworksEvent } from './types/events';

function App() {
  const [allEvents, setAllEvents] = useState<FireworksEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<FireworksEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FireworksEvent | null>(null);
  const [nearestMode, setNearestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load fireworks data - try API first, fallback to static file
    const loadData = async () => {
      try {
        // Try API endpoint first
        const apiResponse = await fetch('/api/fireworks-data');
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData && apiData.length > 0) {
            const eventsWithCoords = apiData.map((event: FireworksEvent) => ({
              ...event,
              coordinates: event.coordinates || [event.lat, event.lng],
            }));
            setAllEvents(eventsWithCoords);
            setFilteredEvents(eventsWithCoords);
            setLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.log('API fetch failed, trying static file...', apiError);
      }

      // Fallback to static file
      try {
        const response = await fetch('/fireworks-data.json');
        if (!response.ok) {
          throw new Error('Failed to load fireworks data');
        }
        const data: FireworksEvent[] = await response.json();
        const eventsWithCoords = data.map((event) => ({
          ...event,
          coordinates: event.coordinates || [event.lat, event.lng],
        }));
        setAllEvents(eventsWithCoords);
        setFilteredEvents(eventsWithCoords);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (filtered: FireworksEvent[]) => {
    setFilteredEvents(filtered);
    setSelectedEvent(null);
  };

  const handleEventSelect = (event: FireworksEvent | null) => {
    setSelectedEvent(event);
  };

  const handleNearestModeToggle = (enabled: boolean) => {
    setNearestMode(enabled);
    if (!enabled) {
      setSelectedEvent(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fireworks data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            Please make sure you have run <code className="bg-gray-200 px-2 py-1 rounded">npm run scrape</code> and{' '}
            <code className="bg-gray-200 px-2 py-1 rounded">npm run geocode</code> to generate the data file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">Perth Fireworks Map</h1>
        <p className="text-sm text-blue-100 mt-1">
          Find the nearest fireworks events in Perth, Western Australia
        </p>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Left sidebar */}
        <div className="w-full md:w-96 flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden">
          {nearestMode ? (
            <NearestEvents
              events={filteredEvents}
              onEventSelect={handleEventSelect}
            />
          ) : (
            <>
              <Filters
                events={allEvents}
                onFilterChange={handleFilterChange}
                onNearestModeToggle={handleNearestModeToggle}
                nearestMode={nearestMode}
              />
              <EventList
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onEventSelect={handleEventSelect}
              />
            </>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: '400px', height: '100%' }}>
          <MapWrapper
            events={filteredEvents}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
