import type { FireworksEvent } from '../types';

interface EventCardProps {
  event: FireworksEvent;
  isSelected: boolean;
  onClick: () => void;
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

export default function EventCard({ event, isSelected, onClick }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
      }`}
    >
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
        {event.purpose}
      </h3>
      <div className="text-sm text-gray-600 space-y-0.5">
        <p className="flex items-center gap-2">
          <span>📅</span>
          <span>{formatDate(event.date)} at {event.time}</span>
        </p>
        <p className="flex items-center gap-2">
          <span>⏱️</span>
          <span>{event.duration}</span>
        </p>
        <p className="flex items-start gap-2">
          <span>📍</span>
          <span className="line-clamp-2">{event.location}</span>
        </p>
      </div>
    </div>
  );
}

