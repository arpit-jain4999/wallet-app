/**
 * Date Utility Functions
 * 
 * Provides date formatting utilities for consistent date display across the application.
 * 
 * @module utils/date
 */

/**
 * Format a date to a readable string (MMM dd, yyyy format)
 * 
 * @param date - Date object, ISO string, or timestamp to format
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 * 
 * @example
 * formatDate(new Date('2024-01-15')) // returns "Jan 15, 2024"
 * formatDate('2024-01-15T10:30:00Z') // returns "Jan 15, 2024"
 * formatDate(1705315800000) // returns "Jan 15, 2024"
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date to a long format with time (MMM dd, yyyy, HH:MM AM/PM)
 * 
 * @param date - Date object, ISO string, or timestamp to format
 * @returns Formatted date string with time (e.g., "Jan 15, 2024, 10:30 AM")
 * 
 * @example
 * formatDateTime(new Date('2024-01-15T10:30:00')) // returns "Jan 15, 2024, 10:30 AM"
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 * 
 * @param date - Date object, ISO string, or timestamp
 * @returns Relative time string
 * 
 * @example
 * getRelativeTime(Date.now() - 3600000) // returns "1 hour ago"
 * getRelativeTime(Date.now() - 86400000) // returns "1 day ago"
 */
export function getRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return formatDate(d);
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}