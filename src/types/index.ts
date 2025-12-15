export interface FireworksEvent {
  id: string;           // Unique ID (hash of date + location)
  date: string;         // "2025-12-25"
  time: string;         // "8:00 PM"
  duration: string;     // "10 minutes"
  location: string;     // Clean address
  purpose: string;      // Clean event title
  lat: number;          // Latitude
  lng: number;          // Longitude
}

export interface EventsResponse {
  events: FireworksEvent[];
  lastUpdated: string;
}

