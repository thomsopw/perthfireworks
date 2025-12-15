import { useState, useEffect, useCallback } from 'react';
import type { FireworksEvent } from '../types';

interface UseEventsReturn {
  events: FireworksEvent[];
  filteredEvents: FireworksEvent[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  setFilters: (filters: EventFilters) => void;
  refetch: () => Promise<void>;
}

export interface EventFilters {
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<FireworksEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<FireworksEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<EventFilters>({});

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
      setFilteredEvents(validEvents);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters whenever events or filters change
  useEffect(() => {
    let result = [...events];

    // Filter by date range
    if (filters.dateFrom) {
      result = result.filter(event => event.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter(event => event.date <= filters.dateTo!);
    }

    // Filter by search text (location or purpose)
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      result = result.filter(event =>
        event.location.toLowerCase().includes(search) ||
        event.purpose.toLowerCase().includes(search)
      );
    }

    // Sort by date
    result.sort((a, b) => a.date.localeCompare(b.date));

    setFilteredEvents(result);
  }, [events, filters]);

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
  };
}

