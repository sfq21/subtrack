import { useState } from 'react'
import { ArrowRight, X } from 'lucide-react'

function todayAsInput() {
  const today = new Date()
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

export default function SubscriptionModal({ subscription, onClose, onSave }) {
  const [names, setNames] = useState(subscription?.names || '')
  const [price, setPrice] = useState(subscription ? String(subscription.price) : '')
  const [startd, setStartd] = useState(subscription?.startd?.slice(0, 10) || todayAsInput())
  const [duration, setDuration] = useState(subscription ? String(subscription.duration) : '30')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSave({ names, price, startd, duration })
    } catch (saveError) {
      setError(saveError.message || 'Could not save this subscription.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="modal subscription-modal" role="dialog" aria-modal="true" aria-labelledby="subscription-modal-title">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close dialog" disabled={busy}><X size={20} /></button>
        <div className="eyebrow">{subscription ? 'MAKE A CHANGE' : 'KEEP IT IN VIEW'}</div>
        <h2 id="subscription-modal-title">{subscription ? 'Edit subscription' : 'Add a subscription'}</h2>
        <p className="modal-intro">A few details are all it takes to stay one step ahead.</p>
        <form className="subscription-form" onSubmit={submit}>
          <label>
            Subscription name
            <input
              autoFocus
              type="text"
              maxLength={169}
              placeholder="e.g. Music streaming"
              value={names}
              onChange={(event) => setNames(event.target.value)}
              required
            />
          </label>
          <div className="form-grid">
            <label>
              Price per cycle
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="9.99"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </label>
            <label>
              Cycle length (days)
              <input
                type="number"
                min="1"
                step="1"
                placeholder="30"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Cycle start date
            <input type="date" value={startd} onChange={(event) => setStartd(event.target.value)} required />
          </label>
          {error && <div className="notice error" role="alert">{error}</div>}
          <button className="button button-primary modal-submit" type="submit" disabled={busy}>
            {busy ? 'Saving…' : subscription ? 'Save changes' : 'Add subscription'}
            <ArrowRight size={17} />
          </button>
        </form>
      </section>
    </div>
  )
}
