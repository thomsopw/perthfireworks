import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FireworksEvent } from '../types';

interface UseEventsReturn {
  events: FireworksEvent[];
  filteredEvents: FireworksEvent[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  setFilters: (filters: EventFilters) => void;
  refetch: () => Promise<void>;
  eventDistances: Map<string, number>;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
}

export interface EventFilters {
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
  quickDate?: 'today' | 'thisWeek' | 'thisMonth' | 'all';
  maxDistance?: number;
  sortBy?: 'dateAsc' | 'dateDesc' | 'distance' | 'name';
}

// Haversine formula to calculate distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get date range for quick filters
function getQuickDateRange(quickDate: 'today' | 'thisWeek' | 'thisMonth'): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (quickDate) {
    case 'today': {
      const todayStr = today.toISOString().split('T')[0];
      return { from: todayStr, to: todayStr };
    }
    case 'thisWeek': {
      const weekFrom = today.toISOString().split('T')[0];
      const weekTo = new Date(today);
      weekTo.setDate(today.getDate() + 7);
      return { from: weekFrom, to: weekTo.toISOString().split('T')[0] };
    }
    case 'thisMonth': {
      const monthFrom = today.toISOString().split('T')[0];
      const monthTo = new Date(today);
      monthTo.setDate(today.getDate() + 30);
      return { from: monthFrom, to: monthTo.toISOString().split('T')[0] };
    }
    default:
      return { from: '', to: '' };
  }
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<FireworksEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<FireworksEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<EventFilters>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter out events with invalid coordinates
      const validEvents = (data.events || []).filter((event: FireworksEvent) => 
        event.lat !== 0 && event.lng !== 0 && 
        !isNaN(event.lat) && !isNaN(event.lng)
      );

      setEvents(validEvents);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate distances for all events
  const eventDistances = useMemo(() => {
    const distances = new Map<string, number>();
    if (!userLocation) return distances;
    
    events.forEach(event => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        event.lat,
        event.lng
      );
      distances.set(event.id, distance);
    });
    
    return distances;
  }, [events, userLocation]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...events];

    // Apply quick date filter
    if (filters.quickDate && filters.quickDate !== 'all') {
      const { from, to } = getQuickDateRange(filters.quickDate);
      result = result.filter(event => event.date >= from && event.date <= to);
    } else {
      // Apply manual date range
      if (filters.dateFrom) {
        result = result.filter(event => event.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        result = result.filter(event => event.date <= filters.dateTo!);
      }
    }

    // Filter by search text
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      result = result.filter(event =>
        event.location.toLowerCase().includes(search) ||
        event.purpose.toLowerCase().includes(search)
      );
    }

    // Filter by distance
    if (filters.maxDistance && userLocation) {
      result = result.filter(event => {
        const distance = eventDistances.get(event.id);
        return distance !== undefined && distance <= filters.maxDistance!;
      });
    }

    // Sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'dateAsc':
          result.sort((a, b) => a.date.localeCompare(b.date));
          break;
        case 'dateDesc':
          result.sort((a, b) => b.date.localeCompare(a.date));
          break;
        case 'distance':
          if (userLocation) {
            result.sort((a, b) => {
              const distA = eventDistances.get(a.id) ?? Infinity;
              const distB = eventDistances.get(b.id) ?? Infinity;
              return distA - distB;
            });
          }
          break;
        case 'name':
          result.sort((a, b) => a.purpose.localeCompare(b.purpose));
          break;
      }
    } else {
      // Default sort: prioritize upcoming events, then sort by date
      const getEventStatus = (dateStr: string): 'upcoming' | 'past' => {
        try {
          const eventDate = new Date(dateStr);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today ? 'upcoming' : 'past';
        } catch {
          return 'upcoming';
        }
      };
      
      result.sort((a, b) => {
        const statusA = getEventStatus(a.date);
        const statusB = getEventStatus(b.date);
        
        // Upcoming events come first
        if (statusA !== statusB) {
          return statusA === 'upcoming' ? -1 : 1;
        }
        
        // Within same status, sort by date ascending
        return a.date.localeCompare(b.date);
      });
    }

    setFilteredEvents(result);
  }, [events, filters, userLocation, eventDistances]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const setFilters = useCallback((newFilters: EventFilters) => {
    setFiltersState(newFilters);
  }, []);

  return {
    events,
    filteredEvents,
    loading,
    error,
    lastUpdated,
    setFilters,
    refetch: fetchEvents,
    eventDistances,
    userLocation,
    setUserLocation,
  };
}

