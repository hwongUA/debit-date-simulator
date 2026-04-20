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
              const hasFulfilment = showFulfilmentDates && events.fulfilments.length > 0;
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
                    hasFulfilment ? 'day-cell--has-fulfilment' : '',
                    isSignup ? 'day-cell--signup' : '',
                    hasDebit || hasFulfilment || isSignup ? 'day-cell--event' : ''
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
                    {hasFulfilment ? <span className="marker marker--fulfilment" aria-hidden="true" /> : null}
                    {isSignup ? <span className="marker marker--signup" aria-hidden="true" /> : null}
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
