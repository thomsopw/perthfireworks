// Cache for AI-fixed addresses to avoid repeated API calls
const addressCache = new Map<string, string>();

/**
 * Clean and format malformed addresses using AI
 * Uses the /api/fix-address endpoint to intelligently fix spacing issues
 */
export async function cleanAddressWithAI(address: string): Promise<string> {
  if (!address) return address;

  // Check cache first
  if (addressCache.has(address)) {
    return addressCache.get(address)!;
  }

  try {
    const response = await fetch('/api/fix-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location: address }),
    });

    if (response.ok) {
      const data = await response.json();
      const fixedAddress = data.fixedAddress || address;
      // Cache the result
      addressCache.set(address, fixedAddress);
      return fixedAddress;
    } else {
      // If API fails, return original address
      console.warn('Failed to fix address with AI, using original');
      return address;
    }
  } catch (error) {
    console.error('Error calling AI address fix API:', error);
    // Return original address on error
    return address;
  }
}

/**
 * Synchronous fallback for simple cases (used as initial display)
 * This provides immediate display while AI processes in background
 */
export function cleanAddressSimple(address: string): string {
  if (!address) return address;

  // Basic fixes that are always safe
  let cleaned = address
    // Add space before WA (state)
    .replace(/(\d)(WA)/g, '$1 $2')
    // Add space before postcodes (4 digits)
    .replace(/([A-Z])(\d{4})/g, '$1 $2')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

