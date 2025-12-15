import { useState, useEffect, useRef } from 'react';
import { cleanAddressSimple } from '../utils/addressUtils';

interface PurposeDisplayProps {
  purpose: string;
  className?: string;
}

// Global queue for batching purpose fixes to avoid too many simultaneous API calls
const purposeFixQueue: Array<{ purpose: string; resolve: (value: string) => void; reject: (error: any) => void }> = [];
let isProcessingPurposeQueue = false;

async function fixPurposeWithAI(purpose: string): Promise<string> {
  try {
    const response = await fetch('/api/fix-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purpose }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.fixedAddress || purpose;
    } else {
      return purpose;
    }
  } catch (error) {
    console.error(`Error fixing purpose with AI: ${error}`);
    return purpose;
  }
}

async function processPurposeQueue() {
  if (isProcessingPurposeQueue || purposeFixQueue.length === 0) return;
  
  isProcessingPurposeQueue = true;
  
  // Process purposes one at a time with a small delay to avoid rate limiting
  while (purposeFixQueue.length > 0) {
    const item = purposeFixQueue.shift();
    if (item) {
      try {
        const fixed = await fixPurposeWithAI(item.purpose);
        item.resolve(fixed);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        item.reject(error);
      }
    }
  }
  
  isProcessingPurposeQueue = false;
}

/**
 * Component that displays an event purpose/title, using AI to fix spacing
 * Shows a simple cleaned version immediately, then updates with AI-fixed version
 */
export default function PurposeDisplay({ purpose, className = '' }: PurposeDisplayProps) {
  const [displayPurpose, setDisplayPurpose] = useState(cleanAddressSimple(purpose));
  const [isFixing, setIsFixing] = useState(false);
  const hasFixedRef = useRef(false);

  useEffect(() => {
    // Only fix if the purpose looks malformed (has common issues)
    const needsFixing = /[A-Z]{2,}(BEACH|CLUB|CHRISTMAS|CAROLS|FIREWORKS|PARTY|LIGHTS|SPIRIT|PROXIMITY)/.test(purpose);
    
    if (needsFixing && purpose && !hasFixedRef.current) {
      hasFixedRef.current = true;
      setIsFixing(true);
      
      // Queue the purpose fix
      new Promise<string>((resolve, reject) => {
        purposeFixQueue.push({ purpose, resolve, reject });
        processPurposeQueue();
      })
        .then((fixed) => {
          setDisplayPurpose(fixed);
          setIsFixing(false);
        })
        .catch(() => {
          setIsFixing(false);
        });
    }
  }, [purpose]);

  return (
    <span className={className}>
      {displayPurpose}
      {isFixing && (
        <span className="inline-block ml-1 w-2 h-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}
    </span>
  );
}

