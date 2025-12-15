export interface FireworksEvent {
  date: string;           // ISO date string
  time: string;           // "8:00 PM"
  duration: string;       // "10 minutes"
  location: string;       // Full address
  purpose: string;        // Event description
  lat: number;            // Latitude
  lng: number;            // Longitude
  coordinates?: [number, number]; // [lat, lng] for Leaflet
}

