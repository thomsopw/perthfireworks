import { useState, useEffect, useRef } from 'react';
import { cleanAddressWithAI, cleanAddressSimple } from '../utils/addressUtils';

interface AddressDisplayProps {
  address: string;
  className?: string;
}

// Global queue for batching address fixes to avoid too many simultaneous API calls
const addressFixQueue: Array<{ address: string; resolve: (value: string) => void; reject: (error: any) => void }> = [];
let isProcessingQueue = false;

async function processAddressQueue() {
  if (isProcessingQueue || addressFixQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  // Process addresses one at a time with a small delay to avoid rate limiting
  while (addressFixQueue.length > 0) {
    const item = addressFixQueue.shift();
    if (item) {
      try {
        const fixed = await cleanAddressWithAI(item.address);
        item.resolve(fixed);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        item.reject(error);
      }
    }
  }
  
  isProcessingQueue = false;
}

/**
 * Component that displays an address, using AI to fix it
 * Shows a simple cleaned version immediately, then updates with AI-fixed version
 */
export default function AddressDisplay({ address, className = '' }: AddressDisplayProps) {
  const [displayAddress, setDisplayAddress] = useState(cleanAddressSimple(address));
  const [isFixing, setIsFixing] = useState(false);
  const hasFixedRef = useRef(false);

  useEffect(() => {
    // Only fix if the address looks malformed (has common issues) and we haven't fixed it yet
    const needsFixing = /[A-Z]{2,}(BEACH|RIVER|PARK|DRIVE|DR|ST|RD|WA|QUAY|OVAL)/.test(address);
    
    if (needsFixing && address && !hasFixedRef.current) {
      hasFixedRef.current = true;
      setIsFixing(true);
      
      // Queue the address fix
      new Promise<string>((resolve, reject) => {
        addressFixQueue.push({ address, resolve, reject });
        processAddressQueue();
      })
        .then((fixed) => {
          setDisplayAddress(fixed);
          setIsFixing(false);
        })
        .catch(() => {
          setIsFixing(false);
        });
    }
  }, [address]);

  return (
    <span className={className}>
      {displayAddress}
      {isFixing && (
        <span className="inline-block ml-1 w-2 h-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}
    </span>
  );
}

