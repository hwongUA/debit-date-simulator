import {
  addDays,
  addMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  getDate,
  getDay,
  isAfter,
  isBefore,
  lastDayOfMonth,
  startOfDay,
  startOfMonth
} from 'date-fns';

export function toLocalDate(date: Date): Date {
  return startOfDay(date);
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateInput(date: Date): string {
  return format(toLocalDate(date), 'yyyy-MM-dd');
}

export function formatDateLabel(date: Date): string {
  return format(toLocalDate(date), 'EEE d MMM yyyy');
}

export function formatMonthLabel(date: Date): string {
  return format(toLocalDate(date), 'MMMM yyyy');
}

export function toDateKey(date: Date): string {
  return format(toLocalDate(date), 'yyyy-MM-dd');
}

export function enumerateMonthDates(month: Date): Date[] {
  const monthStart = startOfMonth(toLocalDate(month));
  const day = getDay(monthStart);
  const mondayOffset = (day + 6) % 7;
  const gridStart = addDays(monthStart, -mondayOffset);

  const monthEnd = endOfMonth(monthStart);
  const monthEndDay = getDay(monthEnd);
  const sundayOffset = (7 - monthEndDay) % 7;
  const gridEnd = addDays(monthEnd, sundayOffset === 0 ? 0 : sundayOffset);

  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function enumerateMonths(rangeStart: Date, rangeEnd: Date): Date[] {
  return eachMonthOfInterval({
    start: startOfMonth(toLocalDate(rangeStart)),
    end: startOfMonth(toLocalDate(rangeEnd))
  });
}

export function isWithinRange(date: Date, rangeStart: Date, rangeEnd: Date): boolean {
  const value = toLocalDate(date).getTime();
  return value >= toLocalDate(rangeStart).getTime() && value <= toLocalDate(rangeEnd).getTime();
}

export function buildMonthlyDate(monthDate: Date, dayOfMonth: number): Date {
  const safeMonth = startOfMonth(toLocalDate(monthDate));
  const clampedDay = Math.min(dayOfMonth, getDate(lastDayOfMonth(safeMonth)));
  return new Date(safeMonth.getFullYear(), safeMonth.getMonth(), clampedDay);
}

export function nextOrSameTuesday(date: Date): Date {
  const safeDate = toLocalDate(date);
  const delta = (2 - getDay(safeDate) + 7) % 7;
  return addDays(safeDate, delta);
}

export function firstTuesdayOfMonth(monthDate: Date): Date {
  const monthStart = startOfMonth(toLocalDate(monthDate));
  const delta = (2 - getDay(monthStart) + 7) % 7;
  return addDays(monthStart, delta);
}

export function isPast(date: Date, other: Date): boolean {
  return isBefore(toLocalDate(date), toLocalDate(other));
}

export function isFuture(date: Date, other: Date): boolean {
  return isAfter(toLocalDate(date), toLocalDate(other));
}

export function shiftMonth(date: Date, amount: number): Date {
  return startOfMonth(addMonths(toLocalDate(date), amount));
}