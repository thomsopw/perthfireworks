import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to get events from Vercel KV
    const events = await kv.get('fireworks-events');
    const lastUpdated = await kv.get('fireworks-last-updated');

    if (events && Array.isArray(events)) {
      return res.status(200).json({
        events,
        lastUpdated: lastUpdated || null,
      });
    }

    // Return empty array if no data yet
    return res.status(200).json({
      events: [],
      lastUpdated: null,
    });
  } catch (error) {
    console.error('Error fetching events from KV:', error);
    
    // If KV is not configured, return empty array
    return res.status(200).json({
      events: [],
      lastUpdated: null,
      error: 'KV not configured or unavailable',
    });
  }
}

