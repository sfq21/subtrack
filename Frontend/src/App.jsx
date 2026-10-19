import { useEffect, useMemo, useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import Auth from '../components/Auth'
import Editor from '../components/Editor'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Hero from '../components/Hero'
import SubscriptionList from '../components/SubscriptionList'
import { useSession } from '../hooks/useSession'
import { api } from './lib/api'
import { supabase } from './lib/supabase'

function dateFromSubscription(subscription) {
  const start = new Date(`${subscription.startd}T00:00:00`)
  if (Number.isNaN(start.getTime())) return null
  start.setDate(start.getDate() + Number(subscription.duration))
  return start
}

function daysUntil(date) {
  if (!date) return Number.POSITIVE_INFINITY
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - today.getTime()) / 86400000)
}

function App() {
  const { session, loading: sessionLoading, error: sessionError } = useSession()
  const [subscriptions, setSubscriptions] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loadedUserId, setLoadedUserId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('subtrack-theme') === 'dark')
  const loading = Boolean(session && loadedUserId !== session.user.id)

  useEffect(() => {
    if (!session) return undefined
    let cancelled = false
    api('/subs').then((data) => {
      if (cancelled) return
      setSubscriptions(data)
      setLoadError('')
      setLoadedUserId(session.user.id)
    }).catch((error) => {
      if (cancelled) return
      setLoadError(error.message || 'Could not load your subscriptions.')
      setLoadedUserId(session.user.id)
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey, session])

  useEffect(() => {
    if (!session) return undefined
    let cancelled = false
    api('/alerts').then((data) => {
      if (!cancelled) setAlerts(data.alerts || [])
    }).catch((error) => {
      if (cancelled) return
      setAlerts([])
      setLoadError((current) => [
        current,
        error.message || 'Could not load renewal alerts.',
      ].filter(Boolean).join(' '))
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey, session])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const upcoming = useMemo(
    () => subscriptions
      .map((subscription) => ({
        ...subscription,
        renewalDate: dateFromSubscription(subscription),
      }))
      .sort((a, b) => (a.renewalDate?.getTime() || 0) - (b.renewalDate?.getTime() || 0)),
    [subscriptions],
  )

  const visibleSubscriptions = useMemo(() => upcoming.filter((subscription) => {
    const matchesSearch = subscription.names.toLowerCase().includes(search.trim().toLowerCase())
    const days = daysUntil(subscription.renewalDate)
    const matchesFilter = filter === 'all' || (days >= 0 && days <= 7)
    return matchesSearch && matchesFilter
  }), [filter, search, upcoming])

  const summary = useMemo(() => {
    const active = upcoming.filter((subscription) => daysUntil(subscription.renewalDate) >= 0)
    const dueSoon = upcoming.filter((subscription) => {
      const days = daysUntil(subscription.renewalDate)
      return days >= 0 && days <= 7
    })
    const monthlyEquivalent = active.reduce((total, subscription) => {
      const duration = Number(subscription.duration)
      return total + (duration > 0 ? Number(subscription.price) * 30 / duration : 0)
    }, 0)
    return { active: active.length, dueSoon: dueSoon.length, monthlyEquivalent }
  }, [upcoming])

  async function saveSubscription(values) {
    const formData = new FormData()
    formData.append('names', values.names.trim())
    formData.append('price', values.price)
    formData.append('startd', values.startd)
    formData.append('duration', values.duration)
    const isEditing = Boolean(modal.subscription)

    await api(
      isEditing ? `/subs/${modal.subscription.id}` : '/subs',
      { method: isEditing ? 'PUT' : 'POST', body: formData },
    )
    setModal(null)
    setToast(isEditing ? 'Subscription updated' : 'Subscription added')
    setRefreshKey((current) => current + 1)
  }

  async function deleteSubscription(subscription) {
    if (!window.confirm(`Delete ${subscription.names}? This action cannot be undone.`)) return
    setDeletingId(subscription.id)
    try {
      await api(`/subs/${subscription.id}`, { method: 'DELETE' })
      setSubscriptions((current) => current.filter((item) => item.id !== subscription.id))
      setRefreshKey((current) => current + 1)
      setToast('Subscription deleted')
    } catch (error) {
      setLoadError(error.message || 'Could not delete this subscription.')
    } finally {
      setDeletingId(null)
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) setLoadError(error.message)
  }

  function toggleTheme() {
    const nextDarkMode = !darkMode
    window.localStorage.setItem('subtrack-theme', nextDarkMode ? 'dark' : 'light')
    setDarkMode(nextDarkMode)
  }

  return (
    <div className={`app-shell${darkMode ? ' dark-mode' : ''}`}>
      <Header
        session={session}
        sessionLoading={sessionLoading}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={signOut}
      />

      {sessionLoading ? (
        <main className="session-state"><span className="spinner" /> Checking your session…</main>
      ) : sessionError ? (
        <main className="session-state">
          <div className="notice error" role="alert">{sessionError}</div>
          <button className="button button-outline" onClick={() => window.location.reload()}>Try again</button>
        </main>
      ) : !session ? (
        <Hero onOpenAuth={() => setAuthOpen(true)} />
      ) : (
        <>
          <main className="dashboard">
            {alerts.length > 0 && (
              <section className="alert-banner" aria-label="Renewal alerts">
                <span className="alert-icon"><Bell size={17} /></span>
                <div>
                  <strong>Subscription ending soon</strong>
                  <p>{alerts.map((alert) => alert.descr).join(' ')}</p>
                </div>
                <button className="plain-icon" onClick={() => setAlerts([])} aria-label="Dismiss alerts">
                  <X size={17} />
                </button>
              </section>
            )}
            <section className="welcome-row">
              <div>
                <div className="eyebrow">YOUR PERSONAL OVERVIEW</div>
                <h1>Good to have you back<span className="heading-period">.</span></h1>
                <p>Here’s what’s happening with your subscriptions.</p>
              </div>
              <button className="button button-primary add-button" onClick={() => setModal({ subscription: null })}>
                Add subscription
              </button>
            </section>

            {loadError && (
              <div className="notice error" role="alert">
                <span>{loadError}</span>
                <button className="notice-action" onClick={() => setRefreshKey((current) => current + 1)}>Try again</button>
              </div>
            )}

            <SubscriptionList
              deletingId={deletingId}
              filter={filter}
              loading={loading}
              onAdd={() => setModal({ subscription: null })}
              onDelete={deleteSubscription}
              onEdit={(subscription) => setModal({ subscription })}
              onFilterChange={setFilter}
              onSearchChange={setSearch}
              search={search}
              summary={summary}
              subscriptions={subscriptions}
              visibleSubscriptions={visibleSubscriptions}
            />
          </main>
          <Footer />
        </>
      )}

      {modal && (
        <Editor
          subscription={modal.subscription}
          onClose={() => setModal(null)}
          onSave={saveSubscription}
        />
      )}
      {authOpen && <Auth onClose={() => setAuthOpen(false)} />}
      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
    </div>
  )
}

export default App
