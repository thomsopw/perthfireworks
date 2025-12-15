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
    // Use OpenAI to generate optimal geocoding queries
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that analyzes addresses in Perth, Western Australia and generates optimal geocoding search queries.

Your task is to analyze the given address and event context, then generate 3-5 different geocoding query variations that will help find the correct location.

Consider:
- Perth landmarks and venues (WACA Ground, Elizabeth Quay, Kings Park, Scarborough Beach, etc.)
- Venue names from the event purpose
- Suburbs and street names
- Context clues (e.g., "beach" suggests beachfront, "river" suggests river location, "barge" suggests a barge on the river)
- Common abbreviations (PD = Parade, TCE = Terrace, DR = Drive, ST = Street)

Return ONLY a JSON array of query strings, nothing else. Each query should be optimized for geocoding services like Nominatim.

Example input:
Address: "SWAN RIVER – BARGERIVERSIDE DRPERTH WA 6000"
Purpose: "CITY OF PERTHFESTIVE LIGHTS"

Example output:
["Swan River barge Perth", "Riverside Drive Perth", "Swan River Perth fireworks", "Perth barge location", "Riverside Drive Swan River Perth"]`,
          },
          {
            role: 'user',
            content: `Address: "${address}"
Purpose: "${purpose || 'Fireworks event'}"

Generate geocoding queries as a JSON array:`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    let queriesText = data.choices[0]?.message?.content?.trim();

    // Try to parse as JSON
    let queries = [];
    try {
      // First, try to find a JSON array in the response
      const arrayMatch = queriesText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        queries = JSON.parse(arrayMatch[0]);
      } else {
        // Try parsing the whole thing
        const parsed = JSON.parse(queriesText);
        if (parsed.queries && Array.isArray(parsed.queries)) {
          queries = parsed.queries;
        } else if (Array.isArray(parsed)) {
          queries = parsed;
        } else if (typeof parsed === 'object') {
          // Try to find an array in the object
          queries = Object.values(parsed).find(v => Array.isArray(v)) || [];
        }
      }
    } catch (parseError) {
      // If not JSON, try to extract queries from text format
      // Look for lines that look like queries (not code blocks, not markdown)
      const lines = queriesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => 
          line.length > 0 && 
          !line.startsWith('```') && 
          !line.startsWith('[') &&
          !line.startsWith('{') &&
          line.match(/[a-zA-Z]/)
        );
      
      // Extract quoted strings or plain text
      queries = lines
        .map(line => {
          const quoted = line.match(/"([^"]+)"/);
          if (quoted) return quoted[1];
          const singleQuoted = line.match(/'([^']+)'/);
          if (singleQuoted) return singleQuoted[1];
          return line.replace(/^[-•]\s*/, '').trim();
        })
        .filter(q => q.length > 0 && q.length < 200); // Reasonable query length
    }

    // Ensure we have at least some queries
    if (!queries || queries.length === 0) {
      queries = [
        address,
        address.replace(/WA \d{4}/, '').trim(),
        address.split(/[–-]/)[0].trim(),
      ];
    }

    return res.status(200).json({ queries });
  } catch (error) {
    console.error('Error generating geocode queries:', error);
    
    // Fallback queries
    const fallbackQueries = [
      address,
      address.replace(/WA \d{4}/, '').trim(),
      address.split(/[–-]/)[0].trim(),
    ].filter(q => q && q.length > 0);

    return res.status(200).json({ queries: fallbackQueries });
  }
}

