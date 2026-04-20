import { formatMonthLabel } from '../lib/dateUtils';

interface MonthNavigatorProps {
  visibleMonth: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  disablePrevious: boolean;
  disableNext: boolean;
}

export function MonthNavigator({
  visibleMonth,
  onPrevious,
  onNext,
  onToday,
  disablePrevious,
  disableNext
}: MonthNavigatorProps) {
  return (
    <div className="month-nav">
      <div>
        <p className="eyebrow">Calendar window</p>
        <h2>{formatMonthLabel(visibleMonth)}</h2>
      </div>
      <div className="month-nav__actions">
        <button type="button" className="ghost-button" onClick={onPrevious} disabled={disablePrevious}>
          Prev
        </button>
        <button type="button" className="ghost-button" onClick={onToday}>
          Today
        </button>
        <button type="button" className="ghost-button" onClick={onNext} disabled={disableNext}>
          Next
        </button>
      </div>
    </div>
  );
}