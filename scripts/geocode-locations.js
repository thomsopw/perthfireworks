import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DELAY_MS = 1000; // 1 second delay between requests (Nominatim rate limit)

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address) {
  try {
    const params = new URLSearchParams({
      q: address + ', Perth, Western Australia, Australia',
      format: 'json',
      limit: 1,
    });
    
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'Perth-Fireworks-Map/1.0', // Required by Nominatim
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error.message);
    return null;
  }
}

async function geocodeEvents() {
  try {
    const inputPath = join(__dirname, '../public/fireworks-data.json');
    const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
    
    console.log(`Geocoding ${data.length} events...`);
    console.log('This may take a while due to rate limiting...\n');
    
    for (let i = 0; i < data.length; i++) {
      const event = data[i];
      
      // Skip if already geocoded
      if (event.lat && event.lng && event.lat !== 0 && event.lng !== 0) {
        console.log(`[${i + 1}/${data.length}] Skipping ${event.location} (already geocoded)`);
        continue;
      }
      
      console.log(`[${i + 1}/${data.length}] Geocoding: ${event.location}`);
      
      const coords = await geocodeAddress(event.location);
      
      if (coords) {
        event.lat = coords.lat;
        event.lng = coords.lng;
        event.coordinates = [coords.lat, coords.lng]; // Leaflet format [lat, lng]
        console.log(`  ✓ Found: ${coords.lat}, ${coords.lng}`);
      } else {
        console.log(`  ✗ Not found`);
      }
      
      // Rate limiting - wait between requests
      if (i < data.length - 1) {
        await delay(DELAY_MS);
      }
    }
    
    // Save geocoded data
    writeFileSync(inputPath, JSON.stringify(data, null, 2));
    
    console.log(`\nGeocoding complete! Data saved to ${inputPath}`);
    return data;
  } catch (error) {
    console.error('Error geocoding events:', error);
    throw error;
  }
}

geocodeEvents();

