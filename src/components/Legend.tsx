export function Legend() {
  return (
    <div className="legend" aria-label="Calendar legend">
      <span className="legend__item">
        <span className="legend__swatch legend__swatch--debit" />
        Debit date
      </span>
      <span className="legend__item">
        <span className="legend__swatch legend__swatch--fulfilment" />
        Fulfilment / dispatch date
      </span>
      <span className="legend__item">
        <span className="legend__swatch legend__swatch--double" />
        Double debit month
      </span>
    </div>
  );
}