/**
 * Utility functions for week-based meal planning
 */

export interface WeekInfo {
  startDate: Date;
  endDate: Date;
  label: string; // "This Week", "Next Week", "Jan 12-18"
  weekStartString: string; // "2026-01-12" for database
  isCurrentWeek: boolean;
  isNextWeek: boolean;
  daysRemaining: number; // How many days left in this week
}

/**
 * Get the Monday of a given date's week
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the Sunday of a given date's week
 */
export function getSunday(date: Date): Date {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

/**
 * Format date as YYYY-MM-DD for database storage
 */
export function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date range as "Jan 12-18" or "Dec 29 - Jan 4"
 */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}

/**
 * Get the recommended default week for meal planning
 * Logic: If it's Thursday or later, plan for next week. Otherwise, plan for this week.
 */
export function getDefaultPlanningWeek(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // If it's Thursday (4) or later, OR if it's Sunday (0), plan for NEXT week
  if (dayOfWeek === 0 || dayOfWeek >= 4) {
    const nextMonday = getMonday(today);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return nextMonday;
  } else {
    // Monday-Wednesday: still time to plan for this week
    return getMonday(today);
  }
}

/**
 * Get week info for a given Monday date
 */
export function getWeekInfo(mondayDate: Date): WeekInfo {
  const startDate = new Date(mondayDate);
  const endDate = getSunday(startDate);
  const today = new Date();
  const currentMonday = getMonday(today);
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(currentMonday.getDate() + 7);

  const weekStartString = formatDateForDB(startDate);
  const isCurrentWeek = formatDateForDB(startDate) === formatDateForDB(currentMonday);
  const isNextWeek = formatDateForDB(startDate) === formatDateForDB(nextMonday);

  // Calculate days remaining in this week
  let daysRemaining = 0;
  if (isCurrentWeek) {
    const sunday = getSunday(today);
    daysRemaining = Math.ceil((sunday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Generate label
  let label: string;
  if (isCurrentWeek) {
    label = `This Week (${formatWeekRange(startDate, endDate)})`;
  } else if (isNextWeek) {
    label = `Next Week (${formatWeekRange(startDate, endDate)})`;
  } else {
    label = formatWeekRange(startDate, endDate);
  }

  return {
    startDate,
    endDate,
    label,
    weekStartString,
    isCurrentWeek,
    isNextWeek,
    daysRemaining,
  };
}

/**
 * Get an array of upcoming weeks for the week selector
 * @param count Number of weeks to return (default: 4)
 */
export function getUpcomingWeeks(count: number = 4): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const today = new Date();
  const currentMonday = getMonday(today);

  for (let i = 0; i < count; i++) {
    const weekMonday = new Date(currentMonday);
    weekMonday.setDate(currentMonday.getDate() + (i * 7));
    weeks.push(getWeekInfo(weekMonday));
  }

  return weeks;
}

/**
 * Parse week start string from database (YYYY-MM-DD) to Date
 */
export function parseWeekStartString(weekStartString: string): Date {
  const [year, month, day] = weekStartString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a week is in the past (ended)
 */
export function isWeekInPast(weekStartString: string): boolean {
  const weekStart = parseWeekStartString(weekStartString);
  const weekEnd = getSunday(weekStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return weekEnd < today;
}
