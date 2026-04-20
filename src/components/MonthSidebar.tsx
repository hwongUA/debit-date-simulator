import type { MonthSummary } from '../types';
import { formatDateLabel, formatMonthLabel } from '../lib/dateUtils';

interface MonthSidebarProps {
  visibleMonth: Date;
  summary: MonthSummary;
  showFulfilmentDates: boolean;
  monthlyFirstDebitDate: Date;
  assumptions: string[];
}

export function MonthSidebar({
  visibleMonth,
  summary,
  showFulfilmentDates,
  monthlyFirstDebitDate,
  assumptions
}: MonthSidebarProps) {
  return (
    <aside className="sidebar card-shell">
      <div className="sidebar__header">
        <p className="eyebrow">Visible month</p>
        <h3>{formatMonthLabel(visibleMonth)}</h3>
        {summary.isDoubleDebitMonth ? <span className="status-pill">Double debit month</span> : null}
      </div>

      <section className="sidebar__section">
        <div className="sidebar__section-header">
          <h4>Debit dates</h4>
          <strong>{summary.debits.length}</strong>
        </div>
        {summary.debits.length > 0 ? (
          <ul className="event-list">
            {summary.debits.map((event) => (
              <li key={event.date.toISOString()}>
                <span>{formatDateLabel(event.date)}</span>
                <span>Debit</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-copy">No debit dates in this visible month.</p>
        )}
      </section>

      {showFulfilmentDates ? (
        <section className="sidebar__section">
          <div className="sidebar__section-header">
            <h4>Fulfilment dates</h4>
            <strong>{summary.fulfilments.length}</strong>
          </div>
          {summary.fulfilments.length > 0 ? (
            <ul className="event-list">
              {summary.fulfilments.map((event) => (
                <li key={`${event.label}-${event.date.toISOString()}`}>
                  <span>{formatDateLabel(event.date)}</span>
                  <span>{event.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-copy">No fulfilment dates in this visible month.</p>
          )}
        </section>
      ) : null}

      <section className="sidebar__section">
        <div className="sidebar__section-header">
          <h4>Current assumptions</h4>
        </div>
        <ul className="assumption-list">
          {assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
        <p className="small-note">
          Monthly mode uses the next debit on or after the sign-up date. Current next monthly debit: {formatDateLabel(monthlyFirstDebitDate)}.
        </p>
      </section>
    </aside>
  );
}