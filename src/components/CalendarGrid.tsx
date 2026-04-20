import { isSameDay, isSameMonth } from 'date-fns';
import { APP_CONFIG } from '../config';
import { formatDateLabel, toDateKey } from '../lib/dateUtils';
import type { DayEvents } from '../types';

interface CalendarGridProps {
  days: Date[];
  visibleMonth: Date;
  rangeStart: Date;
  rangeEnd: Date;
  signupDate: Date;
  showFulfilmentDates: boolean;
  eventsByDay: Map<string, DayEvents>;
  isDoubleDebitMonth: boolean;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string | null) => void;
}

export function CalendarGrid({
  days,
  visibleMonth,
  rangeStart,
  rangeEnd,
  signupDate,
  showFulfilmentDates,
  eventsByDay,
  isDoubleDebitMonth,
  selectedDateKey,
  onSelectDate
}: CalendarGridProps) {
  return (
    <section className={`calendar card-shell ${isDoubleDebitMonth ? 'calendar--double-debit' : ''}`}>
      <div className="weekday-row">
        {APP_CONFIG.weekdayHeaders.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((date) => {
          const key = toDateKey(date);
          const events = eventsByDay.get(key) ?? { debits: [], fulfilments: [] };
          const inMonth = isSameMonth(date, visibleMonth);
          const inRange = date.getTime() >= rangeStart.getTime() && date.getTime() <= rangeEnd.getTime();
          const hasDebit = events.debits.length > 0;
          const hasFulfilment = showFulfilmentDates && events.fulfilments.length > 0;
          const isSelected = selectedDateKey === key;
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
                isSelected ? 'day-cell--selected' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(isSelected ? null : key)}
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
              {isSelected && labels.length > 0 ? (
                <span className="day-popover">
                  <strong>{formatDateLabel(date)}</strong>
                  {labels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}