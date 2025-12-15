/**
 * Format date string for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string, timeString: string): string {
  const date = formatDate(dateString);
  return `${date} at ${timeString}`;
}

/**
 * Check if event is in the future
 */
export function isFutureEvent(dateString: string, timeString: string): boolean {
  const [time, period] = timeString.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }

  const eventDate = new Date(dateString);
  eventDate.setHours(hour24, minutes || 0, 0, 0);
  
  return eventDate > new Date();
}

/**
 * Parse date string from table format (e.g., "11/12/2025Thursday")
 */
export function parseDate(dateStr: string): string {
  // Extract date part (before the day name)
  const match = dateStr.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (!match) return dateStr;
  
  const [day, month, year] = match[1].split('/');
  // Return ISO date string (YYYY-MM-DD)
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

