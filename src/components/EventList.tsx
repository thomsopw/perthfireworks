import type { FireworksEvent } from '../types';
import EventCard from './EventCard';

interface EventListProps {
  events: FireworksEvent[];
  selectedEvent: FireworksEvent | null;
  onEventClick: (event: FireworksEvent) => void;
  loading: boolean;
  eventDistances?: Map<string, number>;
}

// Skeleton loader component
function EventCardSkeleton() {
  return (
    <div className="p-4 border-b animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="h-5 bg-gray-200 rounded flex-1"></div>
        <div className="h-5 w-16 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export default function EventList({ events, selectedEvent, onEventClick, loading, eventDistances }: EventListProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-3">🎆</div>
          <p className="text-lg font-medium mb-2">No events found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isSelected={selectedEvent?.id === event.id}
          onClick={() => onEventClick(event)}
          distance={eventDistances?.get(event.id)}
        />
      ))}
    </div>
  );
}
