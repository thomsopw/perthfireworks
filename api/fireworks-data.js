// This endpoint serves the fireworks data
// It serves from Vercel KV cache if available, otherwise falls back to static file

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to get from Vercel KV if available
    let events = null;
    
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        // Vercel KV REST API format
        const kvResponse = await fetch(
          `${process.env.KV_REST_API_URL}/get/fireworks-data`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
            },
          }
        );
        
        if (kvResponse.ok) {
          const kvData = await kvResponse.json();
          if (kvData && kvData.result) {
            events = JSON.parse(kvData.result);
            console.log('Loaded data from KV cache');
          }
        }
      } catch (kvError) {
        console.log('KV fetch failed, using fallback:', kvError.message);
      }
    }

    // If no KV data, return empty array (frontend will use static file fallback)
    return res.status(200).json(events || []);
  } catch (error) {
    console.error('Error fetching fireworks data:', error);
    return res.status(200).json([]);
  }
}

