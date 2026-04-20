import { addDays, isSameMonth } from 'date-fns';
import { describe, expect, it } from 'vitest';
import {
  generateDebitDates,
  generateFulfilmentDates,
  getDefaultFourWeeklyFirstDebitDate,
  getNextMonthlyDebitDate
} from './schedules';
import { formatDateInput } from './dateUtils';

describe('generateFulfilmentDates', () => {
  it('pushes welcome pack to the following Tuesday when sign-up falls on a Tuesday dispatch date', () => {
    const schedule = generateFulfilmentDates(new Date(2026, 3, 21));

    expect(formatDateInput(schedule.welcomePackDate)).toBe('2026-04-28');
    expect(formatDateInput(schedule.monthlyPackDates[0].date)).toBe('2026-05-05');
    expect(schedule.monthlyPackDates).toHaveLength(11);
  });

  it('always starts monthly packs in the month after the welcome pack', () => {
    const schedule = generateFulfilmentDates(new Date(2026, 3, 20));

    expect(formatDateInput(schedule.welcomePackDate)).toBe('2026-04-21');
    expect(formatDateInput(schedule.monthlyPackDates[0].date)).toBe('2026-05-05');
  });
});

describe('generateDebitDates', () => {
  it('creates 4-weekly debits from the first debit date', () => {
    const signup = new Date(2026, 3, 20);
    const firstDebitDate = getDefaultFourWeeklyFirstDebitDate(signup);
    const debits = generateDebitDates({
      mode: 'four-weekly',
      rangeStart: signup,
      rangeEnd: addDays(firstDebitDate, 90),
      firstDebitDate
    });

    expect(debits.map((event) => formatDateInput(event.date))).toEqual([
      '2026-05-18',
      '2026-06-15',
      '2026-07-13',
      '2026-08-10'
    ]);
  });

  it('always sets the first monthly debit to the selected day in the next month', () => {
    const signups = [new Date(2026, 3, 1), new Date(2026, 3, 14), new Date(2026, 3, 15), new Date(2026, 3, 30)];
    expect(signups.map((signup) => formatDateInput(getNextMonthlyDebitDate(signup, 15)))).toEqual([
      '2026-05-15',
      '2026-05-15',
      '2026-05-15',
      '2026-05-15'
    ]);
  });

  it('rolls to end-of-month when day-of-month does not exist', () => {
    expect(formatDateInput(getNextMonthlyDebitDate(new Date(2025, 0, 10), 31))).toBe('2025-02-28');
    expect(formatDateInput(getNextMonthlyDebitDate(new Date(2024, 0, 10), 31))).toBe('2024-02-29');
    expect(formatDateInput(getNextMonthlyDebitDate(new Date(2026, 2, 10), 31))).toBe('2026-04-30');
  });

  it('never creates a monthly debit in the same calendar month as sign-up', () => {
    const signup = new Date(2026, 3, 12);
    const firstDebitDate = getNextMonthlyDebitDate(signup, 15);
    const debits = generateDebitDates({
      mode: 'monthly',
      rangeStart: signup,
      rangeEnd: new Date(2026, 5, 30),
      dayOfMonth: 15,
      firstDebitDate
    });

    expect(debits.some((event) => isSameMonth(event.date, signup))).toBe(false);
    expect(formatDateInput(debits[0].date)).toBe('2026-05-15');
  });
});
