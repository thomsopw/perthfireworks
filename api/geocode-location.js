const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Perth metropolitan area bounds for validation
const PERTH_BOUNDS = {
  minLat: -32.5,
  maxLat: -31.5,
  minLng: 115.5,
  maxLng: 116.5,
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate that coordinates are within Perth metropolitan area
 */
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

/**
 * Try to geocode an address using Nominatim
 */
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
          confidence: data[0].importance || 0.5,
          displayName: data[0].display_name,
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`Geocoding error for "${query}":`, error.message);
    return null;
  }
}

/**
 * Use AI to generate optimal geocoding queries from address and context
 */
async function generateGeocodeQueryWithAI(address, purpose, req) {
  try {
    // Determine the base URL for the API
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

/**
 * Geocode an address using AI-enhanced multi-strategy approach
 */
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
      /WACA/i,
      /ELIZABETH QUAY/i,
      /SCARBOROUGH/i,
      /SWAN RIVER/i,
      /KINGS PARK/i,
    ];

    for (const pattern of landmarkPatterns) {
      if (pattern.test(address)) {
        const landmarkQuery = address.match(pattern)[0];
        const result = await tryGeocode(landmarkQuery);
        if (result) {
          console.log(`  ✓ Geocoded using landmark: "${landmarkQuery}"`);
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, purpose } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const result = await geocodeAddressWithAI(address, purpose || '', req);

    if (result) {
      return res.status(200).json({
        success: true,
        lat: result.lat,
        lng: result.lng,
        coordinates: result.coordinates,
        confidence: result.confidence,
        displayName: result.displayName,
      });
    } else {
      return res.status(200).json({
        success: false,
        error: 'Could not geocode address',
      });
    }
  } catch (error) {
    console.error('Error in geocode-location:', error);
    return res.status(500).json({
      error: 'Failed to geocode location',
      details: error.message,
    });
  }
}

