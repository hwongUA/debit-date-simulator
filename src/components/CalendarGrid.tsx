import { isSameDay, isSameMonth } from 'date-fns';
import { APP_CONFIG } from '../config';
import { formatDateLabel, formatMonthLabel, toDateKey } from '../lib/dateUtils';
import type { DayEvents } from '../types';

interface CalendarGridProps {
  months: Array<{
    month: Date;
    days: Date[];
    isDoubleDebitMonth: boolean;
  }>;
  rangeStart: Date;
  rangeEnd: Date;
  signupDate: Date;
  showFulfilmentDates: boolean;
  eventsByDay: Map<string, DayEvents>;
  onSelectDate: (date: Date) => void;
}

export function CalendarGrid({
  months,
  rangeStart,
  rangeEnd,
  signupDate,
  showFulfilmentDates,
  eventsByDay,
  onSelectDate
}: CalendarGridProps) {
  return (
    <section className="calendar-mosaic">
      {months.map(({ month, days, isDoubleDebitMonth }) => (
        <article
          key={month.toISOString()}
          className={`calendar card-shell ${isDoubleDebitMonth ? 'calendar--double-debit' : ''}`}
        >
          <header className="calendar__month-header">
            <h2>{formatMonthLabel(month)}</h2>
          </header>

          <div className="weekday-row">
            {APP_CONFIG.weekdayHeaders.map((header) => (
              <span key={header}>{header}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((date) => {
              const key = toDateKey(date);
              const events = eventsByDay.get(key) ?? { debits: [], fulfilments: [] };
              const inMonth = isSameMonth(date, month);
              const inRange = date.getTime() >= rangeStart.getTime() && date.getTime() <= rangeEnd.getTime();
              const hasDebit = events.debits.length > 0;
              const hasDispatch = showFulfilmentDates && events.fulfilments.length > 0;
              const hasWelcomeDispatch =
                showFulfilmentDates && events.fulfilments.some((event) => event.kind === 'welcome');
              const hasMonthlyPackDispatch =
                showFulfilmentDates && events.fulfilments.some((event) => event.kind === 'monthly-pack');
              const isSignup = isSameDay(date, signupDate);
              const labels = [
                ...events.debits.map((event) => event.label),
                ...(showFulfilmentDates ? events.fulfilments.map((event) => event.label) : []),
                ...(isSignup ? ['Sign-up date'] : [])
              ];

              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    'day-cell',
                    inMonth ? '' : 'day-cell--outside',
                    inRange ? '' : 'day-cell--out-of-range',
                    hasDebit ? 'day-cell--has-debit' : '',
                    hasDispatch ? 'day-cell--has-dispatch' : '',
                    isSignup ? 'day-cell--signup' : '',
                    isSignup && hasDispatch ? 'day-cell--signup-and-dispatch' : '',
                    hasDebit || hasDispatch || isSignup ? 'day-cell--event' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSelectDate(date)}
                  disabled={!inRange}
                  title={labels.length > 0 ? `${formatDateLabel(date)}: ${labels.join(' | ')}` : formatDateLabel(date)}
                  aria-label={labels.length > 0 ? `${formatDateLabel(date)}. ${labels.join('. ')}` : formatDateLabel(date)}
                >
                  <span className="day-cell__number">{date.getDate()}</span>
                  <span className="day-cell__markers">
                    {hasDebit ? <span className="marker marker--debit" aria-hidden="true" /> : null}
                    {hasWelcomeDispatch ? (
                      <span className="marker marker--dispatch marker--welcome" aria-hidden="true">
                        W
                      </span>
                    ) : null}
                    {hasMonthlyPackDispatch ? (
                      <span className="marker marker--dispatch marker--monthly-pack" aria-hidden="true">
                        #
                      </span>
                    ) : null}
                    {isSignup ? (
                      <span className="marker marker--signup" aria-hidden="true">
                        S
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </article>
      ))}
    </section>
  );
}
