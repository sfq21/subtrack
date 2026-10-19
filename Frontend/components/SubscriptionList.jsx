import {
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Plus,
  Search,
} from 'lucide-react'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function daysUntil(date) {
  if (!date) return Number.POSITIVE_INFINITY
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - today.getTime()) / 86400000)
}

function formatAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

export default function SubscriptionList({
  deletingId,
  filter,
  loading,
  onAdd,
  onDelete,
  onEdit,
  onFilterChange,
  onSearchChange,
  search,
  summary,
  subscriptions,
  visibleSubscriptions,
}) {
  return (
    <>
      <section className="summary-grid" aria-label="Subscription summary">
        <article className="summary-card summary-featured">
          <div className="summary-icon"><CreditCard size={18} /></div>
          <span className="summary-label">Active subscriptions</span>
          <strong>{summary.active}</strong>
          <small>{subscriptions.length === 1 ? 'subscription tracked' : 'subscriptions tracked'}</small>
        </article>
        <article className="summary-card">
          <div className="summary-icon icon-peach"><CalendarDays size={18} /></div>
          <span className="summary-label">Ending this week</span>
          <strong>{summary.dueSoon}</strong>
          <small>{summary.dueSoon ? 'Keep an eye on these' : 'Nothing due just yet'}</small>
        </article>
        <article className="summary-card">
          <div className="summary-icon icon-lavender"><CircleDollarSign size={18} /></div>
          <span className="summary-label">Monthly equivalent</span>
          <strong>{formatAmount(summary.monthlyEquivalent)}</strong>
          <small>Estimated from each cycle</small>
        </article>
      </section>

      <section className="subscriptions-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">THE WHOLE PICTURE</div>
            <h2>Your subscriptions <span className="count-pill">{subscriptions.length}</span></h2>
          </div>
          <div className="list-controls">
            <label className="search-box">
              <Search size={17} />
              <input type="search" placeholder="Search subscriptions" value={search} onChange={(event) => onSearchChange(event.target.value)} aria-label="Search subscriptions" />
            </label>
            <label className="filter-select">
              <select value={filter} onChange={(event) => onFilterChange(event.target.value)} aria-label="Filter subscriptions">
                <option value="all">All subscriptions</option>
                <option value="upcoming">Ending soon</option>
              </select>
              <ChevronDown size={15} />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading your subscriptions…</div>
        ) : visibleSubscriptions.length ? (
          <div className="subscription-list">
            {visibleSubscriptions.map((subscription) => {
              const days = daysUntil(subscription.renewalDate)
              const isOverdue = days < 0
              return (
                <article className="subscription-row" key={subscription.id}>
                  <div className="subscription-logo" aria-hidden="true">{subscription.names.trim().slice(0, 1).toUpperCase()}</div>
                  <div className="subscription-main">
                    <h3>{subscription.names}</h3>
                    <span>{formatAmount(subscription.price)} <span className="muted">/ {subscription.duration} days</span></span>
                  </div>
                  <div className="renewal-info">
                    <span className="renewal-label">END DATE</span>
                    <strong>{subscription.renewalDate ? dateFormatter.format(subscription.renewalDate) : 'Not available'}</strong>
                  </div>
                  <span className={`status-pill ${isOverdue ? 'status-ended' : days <= 7 ? 'status-soon' : 'status-active'}`}>
                    <span className="status-dot" />
                    {isOverdue ? 'Ended' : days === 0 ? 'Today' : days === 1 ? '1 day left' : days <= 7 ? `${days} days left` : 'On track'}
                  </span>
                  <div className="row-actions">
                    <button className="row-action" onClick={() => onEdit(subscription)}>Edit</button>
                    <button className="row-action row-delete" onClick={() => onDelete(subscription)} disabled={deletingId === subscription.id}>
                      {deletingId === subscription.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><Clock3 size={22} /></div>
            <h3>{subscriptions.length ? 'No matches found' : 'Your list starts here'}</h3>
            <p>{subscriptions.length ? 'Try a different search or filter.' : 'Add the subscriptions you want to keep an eye on.'}</p>
            {!subscriptions.length && (
              <button className="button button-primary" onClick={onAdd}>
                <Plus size={17} /> Add your first one
              </button>
            )}
          </div>
        )}
      </section>
    </>
  )
}
