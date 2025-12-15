import { useState, useEffect, useCallback } from 'react';
import type { FireworksEvent } from '../types';
import EventCard from './EventCard';

interface NearestEventsProps {
  events: FireworksEvent[];
  selectedEvent: FireworksEvent | null;
  onEventClick: (event: FireworksEvent) => void;
  onClose: () => void;
}

interface EventWithDistance extends FireworksEvent {
  distance: number;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NearestEvents({ events, selectedEvent, onEventClick, onClose }: NearestEventsProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestEvents, setNearestEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(`Unable to get your location: ${err.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Calculate distances when we have user location
  useEffect(() => {
    if (userLocation && events.length > 0) {
      const eventsWithDistance = events.map((event) => ({
        ...event,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          event.lat,
          event.lng
        ),
      }));

      // Sort by distance and take top 10
      eventsWithDistance.sort((a, b) => a.distance - b.distance);
      setNearestEvents(eventsWithDistance.slice(0, 10));
    }
  }, [userLocation, events]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-blue-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg text-gray-900">Nearest Events</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            ✕
          </button>
        </div>
        {userLocation && (
          <p className="text-xs text-gray-500">
            Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-500">Getting your location...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={getUserLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {nearestEvents.map((event) => (
            <div key={event.id} className="relative">
              <EventCard
                event={event}
                isSelected={selectedEvent?.id === event.id}
                onClick={() => onEventClick(event)}
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {event.distance.toFixed(1)} km
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
