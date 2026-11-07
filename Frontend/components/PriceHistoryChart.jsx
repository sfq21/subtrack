import { useMemo } from 'react'

const COLORS = ['#486c5b', '#c98963', '#72658d', '#54728a', '#b36d75', '#77914f', '#bd9e43', '#588d91']
const MONTHS_TO_SHOW = 12
const CHART = { width: 760, height: 280, left: 62, right: 744, top: 20, bottom: 228 }
const amountFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' })

function monthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function createMonthLabels() {
  const now = new Date()
  return Array.from({ length: MONTHS_TO_SHOW }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - MONTHS_TO_SHOW + index + 1, 1)
    return {
      date,
      label: `${monthFormatter.format(date)} ${String(date.getFullYear()).slice(-2)}`,
      end: monthEnd(date),
    }
  })
}

function valueAtMonthEnd(history, end) {
  let latest = null
  for (const point of history) {
    if (new Date(point.effective_at) > end) break
    latest = point
  }
  if (!latest) return null
  const duration = Number(latest.duration)
  return duration > 0 ? Number(latest.price) * 30 / duration : null
}

export default function PriceHistoryChart({
  history,
  historyError,
  loading,
  onToggleSubscription,
  selectedSubscriptionIds,
  subscriptions,
}) {
  const months = useMemo(() => createMonthLabels(), [])
  const selectedSubscriptions = subscriptions.filter((subscription) => selectedSubscriptionIds.includes(subscription.id))
  const series = selectedSubscriptions.map((subscription) => {
    const points = history
      .filter((point) => point.subs_id === subscription.id)
      .sort((a, b) => new Date(a.effective_at) - new Date(b.effective_at))
    return {
      subscription,
      color: COLORS[subscriptions.indexOf(subscription) % COLORS.length],
      values: months.map((month) => valueAtMonthEnd(points, month.end)),
    }
  })
  const values = series.flatMap((item) => item.values.filter((value) => value !== null))
  const minValue = values.length ? Math.min(...values) : 0
  const maxValue = values.length ? Math.max(...values) : 1
  const spread = maxValue - minValue
  const padding = spread ? spread * 0.12 : Math.max(maxValue * 0.12, 1)
  const domainMin = Math.max(0, minValue - padding)
  const domainMax = maxValue + padding || 1
  const x = (index) => CHART.left + (index * (CHART.right - CHART.left)) / (MONTHS_TO_SHOW - 1)
  const y = (value) => CHART.bottom - ((value - domainMin) / (domainMax - domainMin)) * (CHART.bottom - CHART.top)
  const ticks = Array.from({ length: 5 }, (_, index) => domainMin + ((domainMax - domainMin) * index) / 4)

  function selectAll() {
    for (const subscription of subscriptions) {
      if (!selectedSubscriptionIds.includes(subscription.id)) onToggleSubscription(subscription.id)
    }
  }

  function clearSelection() {
    for (const id of selectedSubscriptionIds) onToggleSubscription(id)
  }

  return (
    <section className="price-history-section" aria-labelledby="price-history-title">
      <div className="price-history-heading">
        <div>
          <div className="eyebrow">HOW YOUR COSTS CHANGE</div>
          <h2 id="price-history-title">Monthly price trends</h2>
          <p>Monthly equivalent at each month-end. Select subscriptions to compare.</p>
        </div>
        <div className="chart-selection-actions">
          <button type="button" className="row-action" onClick={selectAll}>Select all</button>
          <button type="button" className="row-action" onClick={clearSelection}>Clear</button>
        </div>
      </div>

      <div className="chart-subscription-picker" aria-label="Subscriptions to compare">
        {subscriptions.map((subscription) => (
          <label className="chart-subscription-option" key={subscription.id}>
            <input
              type="checkbox"
              checked={selectedSubscriptionIds.includes(subscription.id)}
              onChange={() => onToggleSubscription(subscription.id)}
            />
            <span>{subscription.names}</span>
          </label>
        ))}
        {!subscriptions.length && <span className="chart-empty-hint">Add a subscription to start tracking price changes.</span>}
      </div>

      {historyError ? (
        <div className="chart-message notice error" role="alert">{historyError}</div>
      ) : loading ? (
        <div className="chart-message loading-state"><span className="spinner" /> Loading price history…</div>
      ) : !selectedSubscriptions.length ? (
        <div className="chart-message">Select one or more subscriptions to see their price trends.</div>
      ) : !values.length ? (
        <div className="chart-message">Price history will appear here as changes are tracked.</div>
      ) : (
        <>
          <div className="price-chart-scroll">
            <svg
              className="price-chart"
              viewBox={`0 0 ${CHART.width} ${CHART.height}`}
              role="img"
              aria-label="Monthly equivalent subscription prices over the last 12 months"
            >
              {ticks.map((tick, index) => (
                <g key={tick}>
                  <line
                    x1={CHART.left}
                    x2={CHART.right}
                    y1={y(tick)}
                    y2={y(tick)}
                    className="chart-grid-line"
                  />
                  <text x={CHART.left - 10} y={y(tick) + 4} textAnchor="end" className="chart-axis-label">
                    {amountFormatter.format(tick)}
                  </text>
                  {index === 0 && <title>Monthly equivalent amount</title>}
                </g>
              ))}
              {months.map((month, index) => (
                <text
                  key={month.label}
                  x={x(index)}
                  y={CHART.bottom + 24}
                  textAnchor="middle"
                  className="chart-axis-label"
                >
                  {month.label}
                </text>
              ))}
              {series.map((item) => {
                const coordinates = item.values
                  .map((value, index) => value === null ? null : `${x(index)},${y(value)}`)
                  .filter(Boolean)
                return (
                  <g key={item.subscription.id}>
                    {coordinates.length > 1 && (
                      <polyline
                        points={coordinates.join(' ')}
                        fill="none"
                        stroke={item.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {item.values.map((value, index) => value === null ? null : (
                      <circle key={months[index].label} cx={x(index)} cy={y(value)} r="4" fill={item.color}>
                        <title>{`${item.subscription.names}: ${amountFormatter.format(value)} monthly equivalent in ${months[index].label}`}</title>
                      </circle>
                    ))}
                  </g>
                )
              })}
            </svg>
          </div>
          <div className="chart-legend">
            {series.map((item) => (
              <span className="chart-legend-item" key={item.subscription.id}>
                <span style={{ backgroundColor: item.color }} />
                {item.subscription.names}
              </span>
            ))}
          </div>
          <p className="chart-footnote">Tracking starts when you add a subscription or after price history is enabled; earlier months are not estimated.</p>
        </>
      )}
    </section>
  )
}
