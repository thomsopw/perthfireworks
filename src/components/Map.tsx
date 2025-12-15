import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FireworksEvent } from '../types';
import MapLegend from './MapLegend';

// Fix Leaflet default marker icons (use CDN)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Get event status (today, upcoming, past)
function getEventStatus(dateStr: string): 'today' | 'upcoming' | 'past' {
  try {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    const diff = eventDate.getTime() - today.getTime();
    if (diff === 0) return 'today';
    if (diff > 0) return 'upcoming';
    return 'past';
  } catch {
    return 'upcoming';
  }
}

// Create custom colored marker icon
function createMarkerIcon(color: string): L.DivIcon {
  const size = 28;
  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Marker icons for different statuses
const upcomingIcon = createMarkerIcon('#10b981'); // Green for upcoming
const todayIcon = createMarkerIcon('#f59e0b'); // Orange for today
const pastIcon = createMarkerIcon('#6b7280'); // Gray for past

// Get appropriate icon for event
function getEventIcon(event: FireworksEvent): L.DivIcon {
  const status = getEventStatus(event.date);
  switch (status) {
    case 'today':
      return todayIcon;
    case 'upcoming':
      return upcomingIcon;
    case 'past':
      return pastIcon;
    default:
      return upcomingIcon;
  }
}

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
            icon={getEventIcon(event)}
            eventHandlers={{
              click: () => onEventClick(event),
            }}
          >
            <Popup className="custom-popup">
              <div className="min-w-[240px] p-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-gray-900 leading-tight flex-1">{event.purpose}</h3>
                  {(() => {
                    const status = getEventStatus(event.date);
                    const statusConfig = {
                      today: { label: 'Today', className: 'bg-orange-100 text-orange-700 border-orange-200' },
                      upcoming: { label: 'Upcoming', className: 'bg-green-100 text-green-700 border-green-200' },
                      past: { label: 'Past', className: 'bg-gray-100 text-gray-600 border-gray-200' },
                    };
                    const { label, className } = statusConfig[status];
                    return (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ml-2 flex-shrink-0 ${className}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
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
        
        <MapLegend />
      </MapContainer>
    </div>
  );
}
