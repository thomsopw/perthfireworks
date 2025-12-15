import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FireworksEvent } from '../types';

// Fix Leaflet default marker icons (use CDN)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom firework icon
const fireworkIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapProps {
  events: FireworksEvent[];
  selectedEvent: FireworksEvent | null;
  onEventClick: (event: FireworksEvent) => void;
}

// Component to handle map centering
function MapController({ selectedEvent }: { selectedEvent: FireworksEvent | null }) {
  const map = useMap();
  const initialMount = useRef(true);

  useEffect(() => {
    if (selectedEvent && !initialMount.current) {
      map.flyTo([selectedEvent.lat, selectedEvent.lng], 14, {
        duration: 1,
      });
    }
    initialMount.current = false;
  }, [selectedEvent, map]);

  return null;
}

// Format date for display
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function Map({ events, selectedEvent, onEventClick }: MapProps) {
  // Perth center coordinates
  const perthCenter: [number, number] = [-31.9505, 115.8605];

  return (
    <div className="w-full h-full">
      <MapContainer
        center={perthCenter}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ minHeight: '400px', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController selectedEvent={selectedEvent} />

        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lng]}
            icon={fireworkIcon}
            eventHandlers={{
              click: () => onEventClick(event),
            }}
          >
            <Popup className="custom-popup">
              <div className="min-w-[240px] p-1">
                <h3 className="font-bold text-base mb-3 text-gray-900 leading-tight">{event.purpose}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">📅</span>
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(event.date)}</p>
                      <p className="text-gray-600">{event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">⏱️</span>
                    <span className="text-gray-700">{event.duration}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1 border-t">
                    <span className="text-gray-400 mt-0.5">📍</span>
                    <p className="text-gray-700 leading-relaxed">{event.location}</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
