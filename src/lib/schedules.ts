import { addDays, addMonths, startOfDay, startOfMonth } from 'date-fns';
import { APP_CONFIG } from '../config';
import type { DebitEvent, DebitMode, FulfilmentEvent, FulfilmentSchedule } from '../types';
import { buildMonthlyDate, firstTuesdayOfMonth, isWithinRange, nextOrSameTuesday, toLocalDate } from './dateUtils';

interface BaseDebitOptions {
  rangeStart: Date;
  rangeEnd: Date;
}

interface FourWeeklyDebitOptions extends BaseDebitOptions {
  mode: 'four-weekly';
  firstDebitDate: Date;
}

interface MonthlyDebitOptions extends BaseDebitOptions {
  mode: 'monthly';
  dayOfMonth: number;
  firstDebitDate: Date;
}

export type DebitGenerationOptions = FourWeeklyDebitOptions | MonthlyDebitOptions;

interface FulfilmentConfig {
  monthlyPackCount?: number;
}

export function getDefaultFourWeeklyFirstDebitDate(
  signupDate: Date,
  offsetDays = APP_CONFIG.defaultFourWeeklyOffsetDays
): Date {
  return addDays(toLocalDate(signupDate), offsetDays);
}

export function getNextMonthlyDebitDate(signupDate: Date, dayOfMonth: number): Date {
  const signup = toLocalDate(signupDate);
  const currentMonthCandidate = buildMonthlyDate(signup, dayOfMonth);

  if (currentMonthCandidate.getTime() >= signup.getTime()) {
    return currentMonthCandidate;
  }

  return buildMonthlyDate(addMonths(signup, 1), dayOfMonth);
}

export function generateDebitDates(options: DebitGenerationOptions): DebitEvent[] {
  const rangeStart = toLocalDate(options.rangeStart);
  const rangeEnd = toLocalDate(options.rangeEnd);
  const results: DebitEvent[] = [];

  if (options.mode === 'four-weekly') {
    let cursor = toLocalDate(options.firstDebitDate);

    while (cursor.getTime() <= rangeEnd.getTime()) {
      if (isWithinRange(cursor, rangeStart, rangeEnd)) {
        results.push({ date: cursor, label: 'Debit' });
      }
      cursor = addDays(cursor, 28);
    }

    return results;
  }

  const firstDebitDate = toLocalDate(options.firstDebitDate);
  let cursorMonth = startOfMonth(firstDebitDate);

  while (cursorMonth.getTime() <= rangeEnd.getTime()) {
    const debitDate = buildMonthlyDate(cursorMonth, options.dayOfMonth);

    if (debitDate.getTime() >= firstDebitDate.getTime() && isWithinRange(debitDate, rangeStart, rangeEnd)) {
      results.push({ date: debitDate, label: 'Debit' });
    }

    cursorMonth = startOfMonth(addMonths(cursorMonth, 1));
  }

  return results;
}

export function generateFulfilmentDates(
  signupDate: Date,
  config: FulfilmentConfig = {}
): FulfilmentSchedule {
  const safeSignupDate = startOfDay(signupDate);
  const welcomePackDate = nextOrSameTuesday(safeSignupDate);
  const monthlyPackCount = config.monthlyPackCount ?? APP_CONFIG.fulfilmentMonthlyPackCount;
  const startMonth = startOfMonth(addMonths(welcomePackDate, 1));

  const monthlyPackDates: FulfilmentEvent[] = Array.from({ length: monthlyPackCount }, (_, index) => {
    const dispatchDate = firstTuesdayOfMonth(addMonths(startMonth, index));

    return {
      date: dispatchDate,
      label: `Monthly Pack #${index + 1} Dispatch`,
      kind: 'monthly-pack',
      packNumber: index + 1
    };
  });

  return {
    welcomePackDate,
    monthlyPackDates
  };
}
