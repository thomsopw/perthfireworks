import type { FireworksEvent } from '../types/events';

/**
 * Geocode a single event using the API
 */
export async function geocodeEvent(event: FireworksEvent): Promise<FireworksEvent | null> {
  try {
    const response = await fetch('/api/geocode-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: event.location,
        purpose: event.purpose,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.lat && data.lng) {
        return {
          ...event,
          lat: data.lat,
          lng: data.lng,
          coordinates: data.coordinates || [data.lat, data.lng],
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error geocoding event:', error);
    return null;
  }
}

/**
 * Geocode multiple events, processing them with delays to avoid rate limiting
 */
export async function geocodeEvents(events: FireworksEvent[]): Promise<FireworksEvent[]> {
  const geocodedEvents: FireworksEvent[] = [];
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    // Skip if already geocoded
    if (event.lat !== 0 && event.lng !== 0 && event.coordinates) {
      geocodedEvents.push(event);
      continue;
    }
    
    console.log(`Geocoding event ${i + 1}/${events.length}: ${event.purpose}`);
    const geocoded = await geocodeEvent(event);
    
    if (geocoded) {
      geocodedEvents.push(geocoded);
    } else {
      // Keep original event even if geocoding fails
      geocodedEvents.push(event);
    }
    
    // Rate limiting - wait between requests
    if (i < events.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return geocodedEvents;
}

