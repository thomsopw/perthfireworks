import type { FireworksEvent } from '../types';
import EventCard from './EventCard';

interface EventListProps {
  events: FireworksEvent[];
  selectedEvent: FireworksEvent | null;
  onEventClick: (event: FireworksEvent) => void;
  loading: boolean;
}

export default function EventList({ events, selectedEvent, onEventClick, loading }: EventListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No events found</p>
          <p className="text-sm">Try adjusting your filters or check back later.</p>
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
        />
      ))}
    </div>
  );
}
