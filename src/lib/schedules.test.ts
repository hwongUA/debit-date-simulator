import { addDays } from 'date-fns';
import { describe, expect, it } from 'vitest';
import {
  generateDebitDates,
  generateFulfilmentDates,
  getDefaultFourWeeklyFirstDebitDate,
  getNextMonthlyDebitDate
} from './schedules';
import { formatDateInput } from './dateUtils';

describe('generateFulfilmentDates', () => {
  it('uses the sign-up date when sign-up already falls on a Tuesday', () => {
    const schedule = generateFulfilmentDates(new Date(2026, 3, 21));

    expect(formatDateInput(schedule.welcomePackDate)).toBe('2026-04-21');
    expect(formatDateInput(schedule.monthlyPackDates[0].date)).toBe('2026-05-05');
    expect(schedule.monthlyPackDates).toHaveLength(11);
  });

  it('can start monthly packs in the same month as the welcome pack', () => {
    const schedule = generateFulfilmentDates(new Date(2026, 3, 20), {
      monthlyPackStartMode: 'same-month'
    });

    expect(formatDateInput(schedule.welcomePackDate)).toBe('2026-04-21');
    expect(formatDateInput(schedule.monthlyPackDates[0].date)).toBe('2026-04-07');
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

  it('falls back to the end of month when the chosen monthly day does not exist', () => {
    const signup = new Date(2026, 0, 31);
    const firstDebitDate = getNextMonthlyDebitDate(signup, 31);
    const debits = generateDebitDates({
      mode: 'monthly',
      rangeStart: signup,
      rangeEnd: new Date(2026, 3, 30),
      dayOfMonth: 31,
      firstDebitDate
    });

    expect(debits.map((event) => formatDateInput(event.date))).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30'
    ]);
  });

  it('finds the next monthly debit date after the selected sign-up date', () => {
    expect(formatDateInput(getNextMonthlyDebitDate(new Date(2026, 3, 20), 15))).toBe('2026-05-15');
    expect(formatDateInput(getNextMonthlyDebitDate(new Date(2026, 3, 12), 15))).toBe('2026-04-15');
  });
});