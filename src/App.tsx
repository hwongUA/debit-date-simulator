import { addYears, isSameMonth, startOfDay, startOfMonth } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { CalendarGrid } from './components/CalendarGrid';
import { APP_CONFIG } from './config';
import {
  enumerateMonths,
  enumerateMonthDates,
  buildMonthlyDate,
  formatDateInput,
  parseDateInput,
  formatDateLabel,
  formatMonthLabel,
  toDateKey
} from './lib/dateUtils';
import {
  generateDebitDates,
  generateFulfilmentDates,
  getDefaultFourWeeklyFirstDebitDate,
  getNextMonthlyDebitDate
} from './lib/schedules';
import type { DayEvents, DebitMode, MonthSummary } from './types';

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

  const monthSummaries = useMemo<Map<string, MonthSummary>>(() => {
    const summaryMap = new Map<string, MonthSummary>();
    for (const month of months) {
      const key = month.toISOString();
      const debits = debitDates.filter((event) => isSameMonth(event.date, month));
      const fulfilments = showFulfilmentDates
        ? fulfilmentDates.filter((event) => isSameMonth(event.date, month))
        : [];
      summaryMap.set(key, {
        debits,
        fulfilments,
        isDoubleDebitMonth: debits.length >= 2
      });
    }
    return summaryMap;
  }, [debitDates, fulfilmentDates, months, showFulfilmentDates]);

  const monthCalendarData = useMemo(
    () =>
      months.map((month) => ({
        month,
        days: enumerateMonthDates(month),
        isDoubleDebitMonth: monthSummaries.get(month.toISOString())?.isDoubleDebitMonth ?? false
      })),
    [monthSummaries, months]
  );

  const selectedMonth = useMemo(() => startOfMonth(signupDate), [signupDate]);
  const selectedMonthSummary = monthSummaries.get(selectedMonth.toISOString()) ?? {
    debits: [],
    fulfilments: [],
    isDoubleDebitMonth: false
  };

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
            <div className="field-grid">
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
              <label className="field">
                <span>Next debit date picker (sets day)</span>
                <input
                  type="date"
                  min={formatDateInput(today)}
                  max={formatDateInput(rangeEnd)}
                  value={formatDateInput(buildMonthlyDate(signupDate, monthlyDebitDay))}
                  onChange={(event) => {
                    const nextDate = parseDateInput(event.target.value);
                    setMonthlyDebitDay(nextDate.getDate());
                  }}
                />
              </label>
              <div className="field field--readout">
                <span>First monthly debit</span>
                <strong>{formatDateLabel(monthlyFirstDebitDate)}</strong>
              </div>
            </div>
          )}
          {debitMode === 'monthly' ? (
            <p className="field-helper">Monthly IFD: first debit is always next month.</p>
          ) : null}

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
        <aside className="month-summary card-shell" aria-label="Month summary panel">
          <h2>{formatMonthLabel(selectedMonth)} summary</h2>
          <section>
            <h3>Debit dates</h3>
            {selectedMonthSummary.debits.length > 0 ? (
              <ul>
                {selectedMonthSummary.debits.map((event) => (
                  <li key={event.date.toISOString()}>
                    <span>{formatDateLabel(event.date)}</span>
                    <span>{event.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No debit dates in this month.</p>
            )}
          </section>
          <section>
            <h3>Fulfilment dates</h3>
            {showFulfilmentDates ? (
              selectedMonthSummary.fulfilments.length > 0 ? (
                <ul>
                  {selectedMonthSummary.fulfilments.map((event) => (
                    <li key={`${event.label}-${event.date.toISOString()}`}>
                      <span>{formatDateLabel(event.date)}</span>
                      <span>{event.label}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No fulfilment dates in this month.</p>
              )
            ) : (
              <p>Fulfilment dates are hidden.</p>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}
