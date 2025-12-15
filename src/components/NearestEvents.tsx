import { useEffect, useState } from 'react';
import type { FireworksEvent } from '../types/events';
import { calculateDistance, getUserLocation } from '../utils/geolocation';
import { formatDateTime } from '../utils/dateUtils';

interface NearestEventsProps {
  events: FireworksEvent[];
  onEventSelect: (event: FireworksEvent | null) => void;
}

export default function NearestEvents({ events, onEventSelect }: NearestEventsProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearestEvents, setNearestEvents] = useState<
    Array<FireworksEvent & { distance: number }>
  >([]);

  const handleGetLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await getUserLocation();
      setUserLocation(location);

      // Calculate distances and sort
      const eventsWithDistance = events
        .filter((event) => event.lat !== 0 && event.lng !== 0)
        .map((event) => ({
          ...event,
          distance: calculateDistance(location.lat, location.lng, event.lat, event.lng),
        }))
        .sort((a, b) => a.distance - b.distance);

      setNearestEvents(eventsWithDistance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) {
      const eventsWithDistance = events
        .filter((event) => event.lat !== 0 && event.lng !== 0)
        .map((event) => ({
          ...event,
          distance: calculateDistance(userLocation.lat, userLocation.lng, event.lat, event.lng),
        }))
        .sort((a, b) => a.distance - b.distance);

      setNearestEvents(eventsWithDistance);
    }
  }, [events, userLocation]);

  return (
    <div className="bg-white p-4 border-b">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Nearest Events</h2>
        {!userLocation && (
          <button
            onClick={handleGetLocation}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Getting location...' : 'Use My Location'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {userLocation && (
        <div className="mb-4 text-sm text-gray-600">
          📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </div>
      )}

      {nearestEvents.length === 0 ? (
        <p className="text-gray-500 text-sm">
          {userLocation
            ? 'No events found nearby.'
            : 'Click "Use My Location" to find the nearest fireworks events.'}
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {nearestEvents.map((event, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => onEventSelect(event)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-sm">{event.purpose}</h3>
                <span className="text-xs font-bold text-blue-600">
                  {event.distance.toFixed(1)} km
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {formatDateTime(event.date, event.time)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{event.location}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

