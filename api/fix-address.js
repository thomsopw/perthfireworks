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

  const { location } = req.body;

  if (!location) {
    return res.status(400).json({ error: 'Location is required' });
  }

  try {
    // Using OpenAI API to fix the address
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
            content: `You are a helpful assistant that fixes malformed addresses in Perth, Western Australia. 
The addresses are missing spaces between words. Fix the address by adding proper spacing and formatting.
Return ONLY the corrected address, nothing else. Make sure it's a valid Perth address format.
Examples:
- "CAPRICORN BEACHRIVERSIDE ESPYANCHEP WA 6035" → "Capricorn Beach, Riverside Esplanade, Yanchep WA 6035"
- "WACA GROUNDNELSON CREAST PERTH WA 6004" → "WACA Ground, Nelson Crescent, Perth WA 6004"
- "SWAN RIVER – BARGERIVERSIDE DRPERTH WA 6000" → "Swan River - Barge, Riverside Drive, Perth WA 6000"
- "ELIZABETH QUAY -FLOATING STAGE IN THE INLETTHE ESPLANADEPERTH WA 6000" → "Elizabeth Quay - Floating Stage in the Inlet, The Esplanade, Perth WA 6000"`,
          },
          {
            role: 'user',
            content: `Fix this address: "${location}"`,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const fixedAddress = data.choices[0]?.message?.content?.trim();

    if (!fixedAddress) {
      throw new Error('No response from AI');
    }

    return res.status(200).json({ fixedAddress });
  } catch (error) {
    console.error('Error fixing address:', error);
    return res.status(500).json({ 
      error: 'Failed to fix address',
      details: error.message 
    });
  }
}

