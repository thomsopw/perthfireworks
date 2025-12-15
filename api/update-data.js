import { kv } from '@vercel/kv';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const WORKSAFE_URL = 'https://www.worksafe.wa.gov.au/schedule-fireworks-events';
const PERTH_BOUNDS = {
  minLat: -33.0, maxLat: -31.0,
  minLng: 115.0, maxLng: 117.0,
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate unique ID from event data
function generateId(date, location, time) {
  const str = `${date}-${location}-${time}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Validate coordinates are within Perth area
function isValidPerthLocation(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= PERTH_BOUNDS.minLat && lat <= PERTH_BOUNDS.maxLat &&
    lng >= PERTH_BOUNDS.minLng && lng <= PERTH_BOUNDS.maxLng
  );
}

// Use OpenAI to clean and geocode an event
async function processEventWithAI(rawEvent) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at processing fireworks event data from Perth, Western Australia.

Given raw event data with potentially malformed text (missing spaces, concatenated words), you must:
1. Fix the location text to be properly formatted with spaces
2. Fix the purpose/event name text to be properly formatted
3. Determine the most accurate GPS coordinates (latitude, longitude) for the location

IMPORTANT: For water-based locations (barges, floating stages, boats), place coordinates ON THE WATER, not on the nearest land. Use coordinates in the Swan River or ocean as appropriate.

Perth coordinate bounds: Latitude -33.0 to -31.0, Longitude 115.0 to 117.0

You MUST return valid JSON in this exact format:
{
  "location": "Clean, properly formatted address",
  "purpose": "Clean, properly formatted event name",
  "lat": -31.xxxx,
  "lng": 115.xxxx
}

Common Perth venues and their coordinates:
- Elizabeth Quay: -31.9583, 115.8576
- Elizabeth Quay Floating Stage: -31.9580, 115.8575 (in the inlet, on water)
- Riverside Drive, Perth: -31.9500, 115.8600 (road along Swan River)
- Langley Park: -31.9520, 115.8620 (park along Riverside Drive)
- Swan River Barge (Riverside Drive area): -31.9505, 115.8605 (on water, opposite Langley Park/Elizabeth Quay)
- WACA Ground: -31.9594, 115.8799
- Optus Stadium: -31.9512, 115.8891
- Kings Park: -31.9619, 115.8383
- Scarborough Beach: -31.8936, 115.7571
- Scarborough Foreshore: -31.8936, 115.7571
- Fremantle: -32.0569, 115.7439
- Yanchep: -31.5480, 115.6314
- Mandurah: -32.5269, 115.7217
- Rockingham: -32.2931, 115.7314
- Joondalup: -31.7461, 115.7675
- Midland: -31.8894, 116.0100
- Armadale: -32.1531, 116.0100
- Perth CBD: -31.9505, 115.8605
- Perth Water (Swan River central): -31.9500, 115.8600

SPECIFIC WATER-BASED LOCATIONS:
- "Swan River - Barge" or "Barge Riverside Drive": Use coordinates ON THE SWAN RIVER, approximately -31.9505, 115.8605 (in the water, not on land)
- "Floating Stage" or "Stage in the Inlet": Use coordinates in the water at Elizabeth Quay inlet, approximately -31.9580, 115.8575
- Any mention of "barge", "floating", "on water", "inlet", "river" should have coordinates ON THE WATER, not on the nearest park or road

If the location mentions Riverside Drive with a barge or water-based activity, place it in the Swan River near Riverside Drive (around -31.9505, 115.8605), NOT on Riverside Drive itself.

If you cannot determine exact coordinates, use the nearest known landmark or suburb center, but prioritize water-based coordinates for water activities.`,
        },
        {
          role: 'user',
          content: `Process this fireworks event:
- Raw Location: "${rawEvent.location}"
- Raw Purpose: "${rawEvent.purpose}"
- Date: ${rawEvent.date}
- Time: ${rawEvent.time}

Return the cleaned data with GPS coordinates as JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 300,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No content in AI response');
    }

    const parsed = JSON.parse(responseContent);
    
    // Validate the response
    if (!parsed.location || !parsed.purpose || !parsed.lat || !parsed.lng) {
      throw new Error('AI response missing required fields');
    }

    if (!isValidPerthLocation(parsed.lat, parsed.lng)) {
      console.warn(`AI returned invalid coordinates for "${rawEvent.location}": ${parsed.lat}, ${parsed.lng}`);
      // Default to Perth CBD if coordinates are invalid
      parsed.lat = -31.9505;
      parsed.lng = 115.8605;
    }

    return parsed;
  } catch (error) {
    console.error(`Error processing event with AI:`, error);
    // Return cleaned version with default Perth coordinates
    return {
      location: rawEvent.location,
      purpose: rawEvent.purpose,
      lat: -31.9505,
      lng: 115.8605,
    };
  }
}

// Scrape events from WorkSafe WA
async function scrapeEvents() {
  console.log('Fetching from WorkSafe WA...');
  
  const response = await fetch(WORKSAFE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PerthFireworksMap/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const events = [];

  // Find the events table - structure has 4 columns:
  // Event Date | Approximate start time and duration | Location | Purpose
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 4) {
      // Extract text, replacing <br> with newlines for parsing
      const dateCell = $(cells[0]).html()?.replace(/<br\s*\/?>/gi, '\n') || '';
      const timeCell = $(cells[1]).html()?.replace(/<br\s*\/?>/gi, '\n') || '';
      const locationCell = $(cells[2]).html()?.replace(/<br\s*\/?>/gi, ' ') || '';
      const purposeCell = $(cells[3]).html()?.replace(/<br\s*\/?>/gi, ' ') || '';

      // Parse date - format like "11/12/2025\nThursday" or "11/12/2025 &\n13/12/2025\nThursday & Saturday"
      const dateText = $('<div>').html(dateCell).text().trim();
      const dateMatch = dateText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      const date = dateMatch ? dateMatch[1] : dateText;

      // Parse time and duration - format like "7:00 PM\n8 minutes"
      const timeText = $('<div>').html(timeCell).text().trim();
      const timeParts = timeText.split('\n').map(s => s.trim()).filter(Boolean);
      const time = timeParts[0] || '';
      const duration = timeParts[1] || '';

      // Clean location and purpose - remove HTML tags
      const location = $('<div>').html(locationCell).text().trim().replace(/\s+/g, ' ');
      const purpose = $('<div>').html(purposeCell).text().trim().replace(/\s+/g, ' ');

      if (date && location) {
        events.push({
          date,
          time,
          duration,
          location,
          purpose,
        });
      }
    }
  });

  console.log(`Scraped ${events.length} events`);
  return events;
}

// Parse date string to ISO format
function parseDate(dateStr) {
  try {
    // Handle formats like "Wednesday 11/12/2025"
    const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST for cron or GET for manual trigger
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting data update...');

    // Step 1: Scrape events
    const rawEvents = await scrapeEvents();

    if (rawEvents.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No events found on the page',
        count: 0,
      });
    }

    // Step 2: Process each event with AI
    const processedEvents = [];
    
    for (let i = 0; i < rawEvents.length; i++) {
      const rawEvent = rawEvents[i];
      console.log(`Processing event ${i + 1}/${rawEvents.length}: ${rawEvent.purpose.substring(0, 30)}...`);
      
      // Process with AI
      const aiResult = await processEventWithAI(rawEvent);
      
      // Create final event object
      const event = {
        id: generateId(rawEvent.date, rawEvent.location, rawEvent.time),
        date: parseDate(rawEvent.date),
        time: rawEvent.time,
        duration: rawEvent.duration,
        location: aiResult.location,
        purpose: aiResult.purpose,
        lat: aiResult.lat,
        lng: aiResult.lng,
      };
      
      processedEvents.push(event);
      
      // Rate limiting - wait 500ms between AI calls
      if (i < rawEvents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Processed ${processedEvents.length} events`);

    // Step 3: Store in Vercel KV
    await kv.set('fireworks-events', processedEvents);
    await kv.set('fireworks-last-updated', new Date().toISOString());

    console.log('Data stored in KV successfully');

    return res.status(200).json({
      success: true,
      message: 'Data updated successfully',
      count: processedEvents.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating data:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
