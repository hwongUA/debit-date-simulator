import { addYears, isSameMonth, startOfDay, startOfMonth } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { CalendarGrid } from './components/CalendarGrid';
import { Legend } from './components/Legend';
import { MonthNavigator } from './components/MonthNavigator';
import { MonthSidebar } from './components/MonthSidebar';
import { APP_CONFIG } from './config';
import {
  enumerateMonthDates,
  formatDateInput,
  formatDateLabel,
  shiftMonth,
  parseDateInput,
  toDateKey,
  toLocalDate
} from './lib/dateUtils';
import {
  generateDebitDates,
  generateFulfilmentDates,
  getDefaultFourWeeklyFirstDebitDate,
  getNextMonthlyDebitDate
} from './lib/schedules';
import type { DayEvents, DebitMode, MonthSummary, PackStartMode } from './types';

const today = startOfDay(new Date());
const rangeEnd = addYears(today, APP_CONFIG.rangeYears);
const rangeStartMonth = startOfMonth(today);
const rangeEndMonth = startOfMonth(rangeEnd);

export default function App() {
  const [signupDate, setSignupDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today));
  const [debitMode, setDebitMode] = useState<DebitMode>('four-weekly');
  const [showFulfilmentDates, setShowFulfilmentDates] = useState(true);
  const [monthlyDebitDay, setMonthlyDebitDay] = useState(APP_CONFIG.defaultMonthlyDebitDay);
  const [fourWeeklyFirstDebitDate, setFourWeeklyFirstDebitDate] = useState(
    getDefaultFourWeeklyFirstDebitDate(today)
  );
  const [packStartMode, setPackStartMode] = useState<PackStartMode>(APP_CONFIG.defaultPackStartMode);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    setVisibleMonth(startOfMonth(signupDate));
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
        monthlyPackCount: APP_CONFIG.fulfilmentMonthlyPackCount,
        monthlyPackStartMode: packStartMode
      }),
    [packStartMode, signupDate]
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

  const visibleMonthSummary = useMemo<MonthSummary>(() => {
    const debits = debitDates.filter((event) => isSameMonth(event.date, visibleMonth));
    const fulfilments = showFulfilmentDates
      ? fulfilmentDates.filter((event) => isSameMonth(event.date, visibleMonth))
      : [];

    return {
      debits,
      fulfilments,
      isDoubleDebitMonth: debits.length >= 2
    };
  }, [debitDates, fulfilmentDates, showFulfilmentDates, visibleMonth]);

  const calendarDays = useMemo(() => enumerateMonthDates(visibleMonth), [visibleMonth]);

  const assumptions = useMemo(
    () => [
      `Timezone: ${APP_CONFIG.localTimezoneLabel}.`,
      `4-weekly default first debit: sign-up date + ${APP_CONFIG.defaultFourWeeklyOffsetDays} days.`,
      'Monthly mode uses one debit per month and falls back to the last day when the chosen day does not exist.',
      `Monthly Pack #1 starts in the ${packStartMode === 'next-month' ? 'month after' : 'same month as'} the Welcome Pack dispatch month.`,
      'Welcome Pack is a single dispatch on the next Tuesday on or after the sign-up date.'
    ],
    [packStartMode]
  );

  const welcomePackCopy = formatDateLabel(fulfilmentSchedule.welcomePackDate);

  return (
    <div className="app-shell">
      <header className="hero card-shell">
        <div>
          <p className="eyebrow">Internal planning tool</p>
          <h1>Debit Date Simulator</h1>
          <p className="lede">
            Compare supporter debit timing with dispatch timing across a two-year planning window. Switch between 4-weekly and monthly debit logic without leaving the visible month.
          </p>
        </div>
        <div className="hero__summary">
          <div>
            <span>Welcome Pack</span>
            <strong>{welcomePackCopy}</strong>
          </div>
          <div>
            <span>Next monthly debit</span>
            <strong>{formatDateLabel(monthlyFirstDebitDate)}</strong>
          </div>
          <div>
            <span>Range</span>
            <strong>
              {formatDateLabel(today)} to {formatDateLabel(rangeEnd)}
            </strong>
          </div>
        </div>
      </header>

      <main className="workspace-layout">
        <section className="controls card-shell">
          <div className="controls__section">
            <p className="eyebrow">Journey input</p>
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
          </div>

          <div className="controls__section">
            <p className="eyebrow">Debit schedule</p>
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
                  <span>Debit day of month</span>
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
                  <span>Next debit date</span>
                  <strong>{formatDateLabel(monthlyFirstDebitDate)}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="controls__section">
            <p className="eyebrow">Fulfilment visibility</p>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={showFulfilmentDates}
                onChange={(event) => setShowFulfilmentDates(event.target.checked)}
              />
              <span>Show fulfilment dates</span>
            </label>
            <label className="field">
              <span>Monthly pack start rule</span>
              <select
                value={packStartMode}
                onChange={(event) => setPackStartMode(event.target.value as PackStartMode)}
              >
                <option value="next-month">Start in month after Welcome Pack month</option>
                <option value="same-month">Start in same month as Welcome Pack month</option>
              </select>
            </label>
          </div>

          <div className="controls__section controls__section--assumptions">
            <p className="eyebrow">Explicit assumptions</p>
            <ul className="assumption-list">
              {assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="calendar-column">
          <MonthNavigator
            visibleMonth={visibleMonth}
            onPrevious={() => setVisibleMonth((current) => shiftMonth(current, -1))}
            onNext={() => setVisibleMonth((current) => shiftMonth(current, 1))}
            onToday={() => setVisibleMonth(startOfMonth(today))}
            disablePrevious={visibleMonth.getTime() <= rangeStartMonth.getTime()}
            disableNext={visibleMonth.getTime() >= rangeEndMonth.getTime()}
          />

          <Legend />

          <CalendarGrid
            days={calendarDays}
            visibleMonth={visibleMonth}
            rangeStart={today}
            rangeEnd={rangeEnd}
            signupDate={signupDate}
            showFulfilmentDates={showFulfilmentDates}
            eventsByDay={eventsByDay}
            isDoubleDebitMonth={visibleMonthSummary.isDoubleDebitMonth}
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
          />
        </section>

        <MonthSidebar
          visibleMonth={visibleMonth}
          summary={visibleMonthSummary}
          showFulfilmentDates={showFulfilmentDates}
          monthlyFirstDebitDate={monthlyFirstDebitDate}
          assumptions={assumptions}
        />
      </main>
    </div>
  );
}