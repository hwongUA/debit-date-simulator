import { addYears, isSameMonth, startOfDay, startOfMonth } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { CalendarGrid } from './components/CalendarGrid';
import { APP_CONFIG } from './config';
import {
  enumerateMonths,
  enumerateMonthDates,
  formatDateInput,
  parseDateInput,
  formatDateLabel,
  toDateKey
} from './lib/dateUtils';
import {
  generateDebitDates,
  generateFulfilmentDates,
  getDefaultFourWeeklyFirstDebitDate,
  getNextMonthlyDebitDate
} from './lib/schedules';
import type { DayEvents, DebitMode } from './types';

const today = startOfDay(new Date());
const rangeEnd = addYears(today, APP_CONFIG.rangeYears);
const rangeStartMonth = startOfMonth(today);
const rangeEndMonth = startOfMonth(rangeEnd);

export default function App() {
  const [signupDate, setSignupDate] = useState(today);
  const [debitMode, setDebitMode] = useState<DebitMode>('four-weekly');
  const [showFulfilmentDates, setShowFulfilmentDates] = useState(true);
  const [monthlyDebitDay, setMonthlyDebitDay] = useState(APP_CONFIG.defaultMonthlyDebitDay);
  const [fourWeeklyFirstDebitDate, setFourWeeklyFirstDebitDate] = useState(
    getDefaultFourWeeklyFirstDebitDate(today)
  );

  useEffect(() => {
    setFourWeeklyFirstDebitDate(getDefaultFourWeeklyFirstDebitDate(signupDate));
  }, [signupDate]);

  const monthlyFirstDebitDate = useMemo(
    () => getNextMonthlyDebitDate(signupDate, monthlyDebitDay),
    [signupDate, monthlyDebitDay]
  );

  const debitDates = useMemo(
    () =>
      debitMode === 'four-weekly'
        ? generateDebitDates({
            mode: 'four-weekly',
            rangeStart: today,
            rangeEnd,
            firstDebitDate: fourWeeklyFirstDebitDate
          })
        : generateDebitDates({
            mode: 'monthly',
            rangeStart: today,
            rangeEnd,
            dayOfMonth: monthlyDebitDay,
            firstDebitDate: monthlyFirstDebitDate
          }),
    [debitMode, fourWeeklyFirstDebitDate, monthlyDebitDay, monthlyFirstDebitDate]
  );

  const fulfilmentSchedule = useMemo(
    () =>
      generateFulfilmentDates(signupDate, {
        monthlyPackCount: APP_CONFIG.fulfilmentMonthlyPackCount
      }),
    [signupDate]
  );

  const fulfilmentDates = useMemo(
    () => [
      {
        date: fulfilmentSchedule.welcomePackDate,
        label: 'Welcome Pack Dispatch',
        kind: 'welcome' as const
      },
      ...fulfilmentSchedule.monthlyPackDates
    ],
    [fulfilmentSchedule]
  );

  const eventsByDay = useMemo(() => {
    const eventMap = new Map<string, DayEvents>();

    for (const debit of debitDates) {
      const key = toDateKey(debit.date);
      const current = eventMap.get(key) ?? { debits: [], fulfilments: [] };
      current.debits.push(debit);
      eventMap.set(key, current);
    }

    if (showFulfilmentDates) {
      for (const fulfilment of fulfilmentDates) {
        const key = toDateKey(fulfilment.date);
        const current = eventMap.get(key) ?? { debits: [], fulfilments: [] };
        current.fulfilments.push(fulfilment);
        eventMap.set(key, current);
      }
    }

    return eventMap;
  }, [debitDates, fulfilmentDates, showFulfilmentDates]);

  const months = useMemo(() => enumerateMonths(rangeStartMonth, rangeEndMonth), []);

  const doubleDebitMonths = useMemo(() => {
    const monthFlags = new Map<string, boolean>();
    for (const month of months) {
      monthFlags.set(
        month.toISOString(),
        debitDates.filter((event) => isSameMonth(event.date, month)).length >= 2
      );
    }
    return monthFlags;
  }, [debitDates, months]);

  const monthCalendarData = useMemo(
    () =>
        months.map((month) => ({
          month,
          days: enumerateMonthDates(month),
          isDoubleDebitMonth: doubleDebitMonths.get(month.toISOString()) ?? false
        })),
    [doubleDebitMonths, months]
  );

  return (
    <div className="app-shell">
      <header className="top-header card-shell">
        <h1>Debit Date Simulator</h1>
        <div className="controls-inline">
          <label className="field">
            <span>Sign-up date</span>
            <input
              type="date"
              min={formatDateInput(today)}
              max={formatDateInput(rangeEnd)}
              value={formatDateInput(signupDate)}
              onChange={(event) => setSignupDate(parseDateInput(event.target.value))}
            />
          </label>

          <div className="field">
            <span>Debit schedule</span>
            <div className="toggle-row" role="radiogroup" aria-label="Debit schedule mode">
              <button
                type="button"
                className={debitMode === 'four-weekly' ? 'toggle-button toggle-button--active' : 'toggle-button'}
                onClick={() => setDebitMode('four-weekly')}
              >
                4-weekly
              </button>
              <button
                type="button"
                className={debitMode === 'monthly' ? 'toggle-button toggle-button--active' : 'toggle-button'}
                onClick={() => setDebitMode('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>

          {debitMode === 'four-weekly' ? (
            <label className="field">
              <span>First debit date</span>
              <input
                type="date"
                min={formatDateInput(today)}
                max={formatDateInput(rangeEnd)}
                value={formatDateInput(fourWeeklyFirstDebitDate)}
                onChange={(event) => setFourWeeklyFirstDebitDate(parseDateInput(event.target.value))}
              />
            </label>
          ) : (
            <>
              <label className="field">
                <span>Configured debit day of month</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={monthlyDebitDay}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    setMonthlyDebitDay(Number.isNaN(nextValue) ? APP_CONFIG.defaultMonthlyDebitDay : Math.min(31, Math.max(1, nextValue)));
                  }}
                />
              </label>
              <div className="field field--readout">
                <span>First monthly debit</span>
                <strong>{formatDateLabel(monthlyFirstDebitDate)}</strong>
              </div>
            </>
          )}

          <label className="switch-row">
            <input
              type="checkbox"
              checked={showFulfilmentDates}
              onChange={(event) => setShowFulfilmentDates(event.target.checked)}
            />
            <span>Show dispatch dates</span>
          </label>

        </div>
      </header>

      <main className="workspace-layout">
        <CalendarGrid
          months={monthCalendarData}
          rangeStart={today}
          rangeEnd={rangeEnd}
          signupDate={signupDate}
          showFulfilmentDates={showFulfilmentDates}
          eventsByDay={eventsByDay}
          onSelectDate={setSignupDate}
        />
      </main>
    </div>
  );
}
