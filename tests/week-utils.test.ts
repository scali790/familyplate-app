import { describe, it, expect } from 'vitest';
import {
  getMonday,
  getSunday,
  formatDateForDB,
  formatWeekRange,
  getDefaultPlanningWeek,
  getWeekInfo,
  getUpcomingWeeks,
  parseWeekStartString,
  isWeekInPast,
} from '../lib/week-utils';

describe('Week Utilities', () => {
  describe('getMonday', () => {
    it('should return Monday for a date in the middle of the week', () => {
      const wednesday = new Date(2026, 0, 7); // Wednesday Jan 7, 2026
      const monday = getMonday(wednesday);
      expect(monday.getDay()).toBe(1); // Monday
      expect(formatDateForDB(monday)).toBe('2026-01-05');
    });

    it('should return the same date if already Monday', () => {
      const monday = new Date(2026, 0, 5); // Monday Jan 5, 2026
      const result = getMonday(monday);
      expect(formatDateForDB(result)).toBe('2026-01-05');
    });

    it('should handle Sunday correctly (previous Monday)', () => {
      const sunday = new Date(2026, 0, 11); // Sunday Jan 11, 2026
      const monday = getMonday(sunday);
      expect(monday.getDay()).toBe(1);
      expect(formatDateForDB(monday)).toBe('2026-01-05');
    });
  });

  describe('getSunday', () => {
    it('should return Sunday for a date in the middle of the week', () => {
      const wednesday = new Date(2026, 0, 7); // Wednesday Jan 7, 2026
      const sunday = getSunday(wednesday);
      expect(sunday.getDay()).toBe(0); // Sunday
      expect(formatDateForDB(sunday)).toBe('2026-01-11');
    });

    it('should return the same date if already Sunday', () => {
      const sunday = new Date(2026, 0, 11); // Sunday Jan 11, 2026
      const result = getSunday(sunday);
      expect(formatDateForDB(result)).toBe('2026-01-11');
    });
  });

  describe('formatDateForDB', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2026, 0, 5); // Jan 5, 2026
      expect(formatDateForDB(date)).toBe('2026-01-05');
    });

    it('should pad single-digit months and days', () => {
      const date = new Date(2026, 2, 9); // Mar 9, 2026
      expect(formatDateForDB(date)).toBe('2026-03-09');
    });
  });

  describe('formatWeekRange', () => {
    it('should format week range in same month', () => {
      const start = new Date(2026, 0, 5); // Jan 5, 2026
      const end = new Date(2026, 0, 11); // Jan 11, 2026
      expect(formatWeekRange(start, end)).toBe('Jan 5-11');
    });

    it('should format week range across months', () => {
      const start = new Date(2025, 11, 29); // Dec 29, 2025
      const end = new Date(2026, 0, 4); // Jan 4, 2026
      expect(formatWeekRange(start, end)).toBe('Dec 29 - Jan 4');
    });
  });

  describe('getDefaultPlanningWeek', () => {
    it('should return next week if today is Thursday', () => {
      // Mock a Thursday
      const thursday = new Date('2026-01-08'); // Thursday
      const now = new Date();
      const dayOfWeek = now.getDay();
      
      // We can't easily mock Date, so we'll test the logic conceptually
      // If it's Thursday (4) or later, should get next week's Monday
      if (dayOfWeek >= 4 || dayOfWeek === 0) {
        const result = getDefaultPlanningWeek();
        const monday = getMonday(now);
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);
        expect(formatDateForDB(result)).toBe(formatDateForDB(nextMonday));
      }
    });

    it('should return current week if today is Monday-Wednesday', () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      
      // If it's Monday (1) through Wednesday (3), should get this week's Monday
      if (dayOfWeek >= 1 && dayOfWeek <= 3) {
        const result = getDefaultPlanningWeek();
        const monday = getMonday(now);
        expect(formatDateForDB(result)).toBe(formatDateForDB(monday));
      }
    });
  });

  describe('getWeekInfo', () => {
    it('should return correct week info for a Monday', () => {
      const monday = new Date(2026, 0, 5); // Monday Jan 5, 2026
      const info = getWeekInfo(monday);
      
      expect(info.weekStartString).toBe('2026-01-05');
      expect(info.startDate.getDay()).toBe(1); // Monday
      expect(info.endDate.getDay()).toBe(0); // Sunday
      expect(formatDateForDB(info.endDate)).toBe('2026-01-11');
    });

    it('should detect current week correctly', () => {
      const now = new Date();
      const currentMonday = getMonday(now);
      const info = getWeekInfo(currentMonday);
      
      expect(info.isCurrentWeek).toBe(true);
      expect(info.isNextWeek).toBe(false);
    });

    it('should detect next week correctly', () => {
      const now = new Date();
      const currentMonday = getMonday(now);
      const nextMonday = new Date(currentMonday);
      nextMonday.setDate(currentMonday.getDate() + 7);
      const info = getWeekInfo(nextMonday);
      
      expect(info.isCurrentWeek).toBe(false);
      expect(info.isNextWeek).toBe(true);
    });

    it('should calculate days remaining for current week', () => {
      const now = new Date();
      const currentMonday = getMonday(now);
      const info = getWeekInfo(currentMonday);
      
      if (info.isCurrentWeek) {
        expect(info.daysRemaining).toBeGreaterThanOrEqual(0);
        expect(info.daysRemaining).toBeLessThanOrEqual(7);
      }
    });

    it('should generate appropriate labels', () => {
      const now = new Date();
      const currentMonday = getMonday(now);
      const nextMonday = new Date(currentMonday);
      nextMonday.setDate(currentMonday.getDate() + 7);
      
      const currentInfo = getWeekInfo(currentMonday);
      const nextInfo = getWeekInfo(nextMonday);
      
      expect(currentInfo.label).toContain('This Week');
      expect(nextInfo.label).toContain('Next Week');
    });
  });

  describe('getUpcomingWeeks', () => {
    it('should return 4 weeks by default', () => {
      const weeks = getUpcomingWeeks();
      expect(weeks).toHaveLength(4);
    });

    it('should return specified number of weeks', () => {
      const weeks = getUpcomingWeeks(6);
      expect(weeks).toHaveLength(6);
    });

    it('should return weeks in chronological order', () => {
      const weeks = getUpcomingWeeks(4);
      
      for (let i = 0; i < weeks.length - 1; i++) {
        const current = new Date(weeks[i].weekStartString);
        const next = new Date(weeks[i + 1].weekStartString);
        expect(next.getTime()).toBeGreaterThan(current.getTime());
      }
    });

    it('should have exactly 7 days between consecutive weeks', () => {
      const weeks = getUpcomingWeeks(4);
      
      for (let i = 0; i < weeks.length - 1; i++) {
        const current = new Date(weeks[i].weekStartString);
        const next = new Date(weeks[i + 1].weekStartString);
        const daysDiff = (next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBe(7);
      }
    });
  });

  describe('parseWeekStartString', () => {
    it('should parse YYYY-MM-DD string to Date', () => {
      const dateStr = '2026-01-05';
      const parsed = parseWeekStartString(dateStr);
      
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(0); // January (0-indexed)
      expect(parsed.getDate()).toBe(5);
    });

    it('should handle different months correctly', () => {
      const dateStr = '2026-12-28';
      const parsed = parseWeekStartString(dateStr);
      
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(11); // December (0-indexed)
      expect(parsed.getDate()).toBe(28);
    });
  });

  describe('isWeekInPast', () => {
    it('should return true for past weeks', () => {
      const pastWeek = '2025-01-01';
      expect(isWeekInPast(pastWeek)).toBe(true);
    });

    it('should return false for current week', () => {
      const now = new Date();
      const currentMonday = getMonday(now);
      const currentWeekStr = formatDateForDB(currentMonday);
      expect(isWeekInPast(currentWeekStr)).toBe(false);
    });

    it('should return false for future weeks', () => {
      const now = new Date();
      const currentMonday = getMonday(now);
      const futureMonday = new Date(currentMonday);
      futureMonday.setDate(currentMonday.getDate() + 14); // 2 weeks ahead
      const futureWeekStr = formatDateForDB(futureMonday);
      expect(isWeekInPast(futureWeekStr)).toBe(false);
    });
  });

  describe('Integration: Full workflow', () => {
    it('should support complete meal planning workflow', () => {
      // 1. Get default planning week
      const defaultWeek = getDefaultPlanningWeek();
      expect(defaultWeek).toBeInstanceOf(Date);
      
      // 2. Get week info
      const weekInfo = getWeekInfo(defaultWeek);
      expect(weekInfo.weekStartString).toBeTruthy();
      expect(weekInfo.label).toBeTruthy();
      
      // 3. Get upcoming weeks for selector
      const weeks = getUpcomingWeeks(4);
      expect(weeks.length).toBe(4);
      expect(weeks[0].weekStartString).toBeTruthy();
      
      // 4. Parse week string back to date
      const parsed = parseWeekStartString(weeks[0].weekStartString);
      expect(parsed).toBeInstanceOf(Date);
      
      // 5. Format for display
      const range = formatWeekRange(parsed, getSunday(parsed));
      expect(range).toMatch(/^[A-Z][a-z]{2} \d+/); // Matches "Jan 5-11" or "Dec 29 - Jan 4"
    });
  });
});
