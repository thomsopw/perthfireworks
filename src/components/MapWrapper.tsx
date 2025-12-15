import { useEffect, useState } from 'react';
import Map from './Map';
import type { FireworksEvent } from '../types/events';

interface MapWrapperProps {
  events: FireworksEvent[];
  selectedEvent: FireworksEvent | null;
  onEventSelect: (event: FireworksEvent | null) => void;
}

// Client-side only wrapper for the map
export default function MapWrapper({ events, selectedEvent, onEventSelect }: MapWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ minHeight: '400px', height: '100%' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <Map events={events} selectedEvent={selectedEvent} onEventSelect={onEventSelect} />;
}

