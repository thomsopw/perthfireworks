import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FireworksEvent } from '../types/events';
import { formatDateTime } from '../utils/dateUtils';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
    (event) => event.coordinates && event.lat !== 0 && event.lng !== 0
  );

  useEffect(() => {
    if (selectedEvent && selectedEvent.coordinates) {
      // Map will be centered by MapCenter component
    }
  }, [selectedEvent]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={perthCenter}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
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
                <h3 className="font-bold text-lg mb-2">{event.purpose}</h3>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Date & Time:</strong> {formatDateTime(event.date, event.time)}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Duration:</strong> {event.duration}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Location:</strong> {event.location}
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

