/**
 * Date utility functions for the Flow GTD application
 */

/**
 * Get today's date normalized to midnight (00:00:00.000)
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Normalize a date to midnight for date-only comparisons
 */
function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = getToday();
  const normalized = normalizeDate(date);
  return normalized.getTime() === today.getTime();
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  const today = getToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const normalized = normalizeDate(date);
  return normalized.getTime() === tomorrow.getTime();
}

/**
 * Check if a date is in the past (before today)
 */
export function isPast(date: Date): boolean {
  const today = getToday();
  const normalized = normalizeDate(date);
  return normalized.getTime() < today.getTime();
}

/**
 * Format a date as "Sunday, Feb 1"
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Format a date as "Feb 1" (short format for due date badges)
 */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Due date label variant for styling purposes
 */
export type DueDateVariant = "overdue" | "today" | "tomorrow" | "future";

/**
 * Get due date label and variant for display
 * Returns null if no date is provided
 */
export function getDueDateLabel(date: Date | null): {
  label: string;
  variant: DueDateVariant;
} | null {
  if (!date) return null;

  const today = getToday();
  const normalized = normalizeDate(date);
  const diffTime = normalized.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Overdue
    return {
      label: formatDateShort(date),
      variant: "overdue",
    };
  } else if (diffDays === 0) {
    // Today
    return {
      label: "Today",
      variant: "today",
    };
  } else if (diffDays === 1) {
    // Tomorrow
    return {
      label: "Tomorrow",
      variant: "tomorrow",
    };
  } else {
    // Future
    return {
      label: formatDateShort(date),
      variant: "future",
    };
  }
}
