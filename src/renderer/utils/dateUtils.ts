import { format } from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const TIME_DISPLAY_FORMAT = 'h:mm a';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';
export const DISPLAY_DATE_FORMAT = 'EEEE, MMMM d, yyyy';

export const formatDate = (date: Date | string): string => {
  return format(typeof date === 'string' ? new Date(date) : date, DATE_FORMAT);
};

export const formatTime = (date: Date | string): string => {
  return format(typeof date === 'string' ? new Date(date) : date, TIME_FORMAT);
};

export const formatDisplayTime = (timeString: string): string => {
  // Convert HH:mm format to 12-hour format with AM/PM
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return format(date, TIME_DISPLAY_FORMAT);
};

export const formatDisplayDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    // For date strings in yyyy-MM-dd format, parse as local date to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    return format(new Date(year, month - 1, day), DISPLAY_DATE_FORMAT);
  }
  return format(date, DISPLAY_DATE_FORMAT);
};

export const getTodayDateString = (): string => {
  return formatDate(new Date());
};

export const getCurrentTimeString = (): string => {
  return formatTime(new Date());
};
