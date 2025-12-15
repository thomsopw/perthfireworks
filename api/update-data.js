import * as cheerio from 'cheerio';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const WORKSAFE_URL = 'https://www.worksafe.wa.gov.au/schedule-fireworks-events';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fixAddressWithAI(location, req) {
  try {
    // Determine the base URL for the API
    let baseUrl;
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (req?.headers?.host) {
      // Use request host if available
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      baseUrl = `${protocol}://${req.headers.host}`;
    } else {
      baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    }
    
    const apiUrl = `${baseUrl}/api/fix-address`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.fixedAddress || location;
  } catch (error) {
    console.error(`Error fixing address with AI: ${error.message}`);
    return location; // Fallback to original
  }
}

// Perth metropolitan area bounds for validation
const PERTH_BOUNDS = {
  minLat: -32.5,
  maxLat: -31.5,
  minLng: 115.5,
  maxLng: 116.5,
};

function isValidPerthLocation(lat, lng) {
  return (
    lat >= PERTH_BOUNDS.minLat &&
    lat <= PERTH_BOUNDS.maxLat &&
    lng >= PERTH_BOUNDS.minLng &&
    lng <= PERTH_BOUNDS.maxLng &&
    lat !== 0 &&
    lng !== 0 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

async function tryGeocode(query) {
  try {
    const params = new URLSearchParams({
      q: query + ', Perth, Western Australia, Australia',
      format: 'json',
      limit: 1,
      addressdetails: 1,
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'Perth-Fireworks-Map/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      if (isValidPerthLocation(lat, lng)) {
        return {
          lat,
          lng,
          coordinates: [lat, lng],
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function generateGeocodeQueryWithAI(address, purpose, req) {
  try {
    let baseUrl;
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (req?.headers?.host) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      baseUrl = `${protocol}://${req.headers.host}`;
    } else {
      baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    }

    const aiUrl = `${baseUrl}/api/generate-geocode-queries`;

    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, purpose }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.queries || [];
    }
  } catch (error) {
    console.error('Error generating geocode queries with AI:', error.message);
  }

  // Fallback: generate basic queries
  return [
    address,
    address.replace(/WA \d{4}/, '').trim(),
    address.split(/[–-]/)[0].trim(),
  ];
}

async function geocodeAddressWithAI(address, purpose, req) {
  try {
    // Step 1: Generate multiple geocoding query variations using AI
    const queries = await generateGeocodeQueryWithAI(address, purpose, req);

    // Step 2: Try each query strategy in order
    for (const query of queries) {
      if (!query || query.trim() === '') continue;

      const result = await tryGeocode(query);
      if (result) {
        console.log(`  ✓ Geocoded with query: "${query}"`);
        return result;
      }

      // Small delay between attempts
      await delay(500);
    }

    // Step 3: Try some common Perth landmark patterns
    const landmarkPatterns = [
      { pattern: /WACA/i, query: 'WACA Ground Perth' },
      { pattern: /ELIZABETH QUAY/i, query: 'Elizabeth Quay Perth' },
      { pattern: /SCARBOROUGH/i, query: 'Scarborough Beach Perth' },
      { pattern: /SWAN RIVER/i, query: 'Swan River Perth' },
      { pattern: /KINGS PARK/i, query: 'Kings Park Perth' },
      { pattern: /YANCHEP/i, query: 'Yanchep Perth' },
      { pattern: /KAMBALDA/i, query: 'Kambalda Western Australia' },
      { pattern: /CLOVERDALE/i, query: 'Cloverdale Perth' },
      { pattern: /HEATHRIDGE/i, query: 'Heathridge Perth' },
      { pattern: /PINGELLY/i, query: 'Pingelly Western Australia' },
      { pattern: /KWINANA/i, query: 'Kwinana Perth' },
    ];

    for (const { pattern, query } of landmarkPatterns) {
      if (pattern.test(address)) {
        const result = await tryGeocode(query);
        if (result) {
          console.log(`  ✓ Geocoded using landmark: "${query}"`);
          return result;
        }
        await delay(500);
      }
    }

    return null;
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error.message);
    return null;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Optional: Add authentication token check
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting data update...');
    
    // Step 1: Scrape fireworks data
    console.log('Fetching fireworks schedule from WorkSafe WA...');
    const response = await fetch(WORKSAFE_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const events = [];
    
    // Find the table with fireworks events
    $('table tbody tr').each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td');
      
      if (cells.length >= 4) {
        const dateStr = $(cells[0]).text().trim();
        const timeDuration = $(cells[1]).text().trim();
        const location = $(cells[2]).text().trim();
        const purpose = $(cells[3]).text().trim();
        
        // Parse time and duration
        const timeMatch = timeDuration.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/);
        const durationMatch = timeDuration.match(/(\d+)\s*(?:minute|minutes|min)/i);
        
        const time = timeMatch ? timeMatch[1] : '';
        const duration = durationMatch ? `${durationMatch[1]} minutes` : '';
        
        // Parse date - format is like "11/12/2025Thursday"
        const dateMatch = dateStr.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
        let date = '';
        if (dateMatch) {
          const [day, month, year] = dateMatch[1].split('/');
          date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        if (date && time && location) {
          events.push({
            date,
            time,
            duration: duration || 'Unknown',
            location,
            purpose: purpose || 'Fireworks display',
            lat: 0,
            lng: 0,
          });
        }
      }
    });
    
    console.log(`Found ${events.length} fireworks events`);
    
    // Step 2: Geocode all events using AI-enhanced geocoding
    console.log('Geocoding events with AI-enhanced geocoding...');
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`[${i + 1}/${events.length}] Processing: ${event.location}`);
      console.log(`  Purpose: ${event.purpose}`);
      
      const coords = await geocodeAddressWithAI(event.location, event.purpose, req);
      
      if (coords) {
        event.lat = coords.lat;
        event.lng = coords.lng;
        event.coordinates = coords.coordinates;
        console.log(`  ✓ Geocoded: ${coords.lat}, ${coords.lng}`);
      } else {
        console.log(`  ✗ Failed to geocode - coordinates remain 0,0`);
      }
      
      // Rate limiting - wait between requests
      if (i < events.length - 1) {
        await delay(1000); // 1 second delay for Nominatim
      }
    }
    
    // Step 3: Store in Vercel KV if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const kvResponse = await fetch(
          `${process.env.KV_REST_API_URL}/set/fireworks-data`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(JSON.stringify(events)),
          }
        );
        
        if (kvResponse.ok) {
          console.log('Data stored in Vercel KV');
        } else {
          console.error('KV store failed:', await kvResponse.text());
        }
      } catch (kvError) {
        console.error('Failed to store in KV:', kvError.message);
      }
    }
    
    const timestamp = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      timestamp,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error('Error updating data:', error);
    return res.status(500).json({
      error: 'Failed to update data',
      details: error.message,
    });
  }
}

