import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FireworksEvent } from '../types/events';
import { formatDateTime } from '../utils/dateUtils';
import AddressDisplay from './AddressDisplay';
import PurposeDisplay from './PurposeDisplay';

// Fix for default marker icons in React-Leaflet
// Use CDN or public folder for production
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  events: FireworksEvent[];
  selectedEvent: FireworksEvent | null;
  onEventSelect: (event: FireworksEvent | null) => void;
}

// Component to handle map centering when selectedEvent changes
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Map({ events, selectedEvent, onEventSelect }: MapProps) {
  // Perth center coordinates [lat, lng]
  const perthCenter: [number, number] = [-31.9505, 115.8605];

  // Filter events with valid coordinates
  const validEvents = events.filter(
    (event) => event.coordinates && event.lat !== 0 && event.lng !== 0 && !isNaN(event.lat) && !isNaN(event.lng)
  );

  useEffect(() => {
    if (selectedEvent && selectedEvent.coordinates) {
      // Map will be centered by MapCenter component
    }
  }, [selectedEvent]);

  // Ensure map container has proper dimensions
  if (typeof window === 'undefined') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ minHeight: '400px' }}>
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ minHeight: '400px', height: '100%' }}>
      <MapContainer
        center={perthCenter}
        zoom={11}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        className="z-0"
        key="perth-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validEvents.map((event, index) => (
          <Marker
            key={index}
            position={event.coordinates!}
            eventHandlers={{
              click: () => onEventSelect(event),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">
                  <PurposeDisplay purpose={event.purpose} />
                </h3>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Date & Time:</strong> {formatDateTime(event.date, event.time)}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Duration:</strong> {event.duration}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Location:</strong> <AddressDisplay address={event.location} />
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        {selectedEvent && selectedEvent.coordinates && (
          <MapCenter center={selectedEvent.coordinates} />
        )}
      </MapContainer>
    </div>
  );
}

