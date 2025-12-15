import type { FireworksEvent } from '../types/events';
import { formatDateTime } from '../utils/dateUtils';
import AddressDisplay from './AddressDisplay';
import PurposeDisplay from './PurposeDisplay';

interface EventListProps {
  events: FireworksEvent[];
  selectedEvent: FireworksEvent | null;
  onEventSelect: (event: FireworksEvent | null) => void;
}

export default function EventList({ events, selectedEvent, onEventSelect }: EventListProps) {
  // Sort events by date and time
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Fireworks Events ({events.length})</h2>
        {sortedEvents.length === 0 ? (
          <p className="text-gray-500">No events found.</p>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedEvent === event
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
                onClick={() => onEventSelect(event)}
              >
                <h3 className="font-semibold text-lg mb-2">
                  <PurposeDisplay purpose={event.purpose} />
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  📅 {formatDateTime(event.date, event.time)}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  ⏱️ Duration: {event.duration}
                </p>
                <p className="text-sm text-gray-600">
                  📍 <AddressDisplay address={event.location} />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

