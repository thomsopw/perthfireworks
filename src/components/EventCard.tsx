import type { FireworksEvent } from '../types';

interface EventCardProps {
  event: FireworksEvent;
  isSelected: boolean;
  onClick: () => void;
  distance?: number;
}

// Format date for display
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

// Get event status (today, upcoming, past)
function getEventStatus(dateStr: string): 'today' | 'upcoming' | 'past' {
  try {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    const diff = eventDate.getTime() - today.getTime();
    if (diff === 0) return 'today';
    if (diff > 0) return 'upcoming';
    return 'past';
  } catch {
    return 'upcoming';
  }
}

// Get status badge
function StatusBadge({ status }: { status: 'today' | 'upcoming' | 'past' }) {
  const config = {
    today: { label: 'Today', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    upcoming: { label: 'Upcoming', className: 'bg-green-100 text-green-700 border-green-200' },
    past: { label: 'Past', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  
  const { label, className } = config[status];
  
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>
      {label}
    </span>
  );
}

export default function EventCard({ event, isSelected, onClick, distance }: EventCardProps) {
  const status = getEventStatus(event.date);
  
  return (
    <div
      onClick={onClick}
      className={`p-3 md:p-4 border-b border-gray-200 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm'
          : 'hover:bg-gray-50 hover:shadow-sm border-l-4 border-l-transparent hover:border-l-blue-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 text-sm md:text-base leading-tight">
          {event.purpose}
        </h3>
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          {distance !== undefined && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap">
              {distance.toFixed(1)} km
            </span>
          )}
          <StatusBadge status={status} />
        </div>
      </div>
      
      <div className="text-xs md:text-sm text-gray-600 space-y-1 md:space-y-1.5">
        <p className="flex items-center gap-1.5 md:gap-2">
          <span className="text-gray-400 flex-shrink-0">📅</span>
          <span className="font-medium break-words">{formatDate(event.date)} at {event.time}</span>
        </p>
        <p className="flex items-center gap-1.5 md:gap-2">
          <span className="text-gray-400 flex-shrink-0">⏱️</span>
          <span>{event.duration}</span>
        </p>
        <p className="flex items-start gap-1.5 md:gap-2">
          <span className="text-gray-400 mt-0.5 flex-shrink-0">📍</span>
          <span className="line-clamp-2 text-gray-700 break-words">{event.location}</span>
        </p>
      </div>
    </div>
  );
}

