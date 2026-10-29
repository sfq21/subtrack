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

function dateFromSubscription(subscription) { // Calculate the renewal date
  const start = new Date(`${subscription.startd}T00:00:00`) // Get the start date from table subs and start the time at 0000H
  if (Number.isNaN(start.getTime())) return null // Check if the date is not a number, then return null
  start.setDate(start.getDate() + Number(subscription.duration)) // Count the days it take to expired by getting start date + duration
  return start
}

function daysUntil(date) { // Count how many days left
  if (!date) return Number.POSITIVE_INFINITY // Check if date exist
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Get today and set the hours to 0000
  return Math.round((date.getTime() - today.getTime()) / 86400000) // Left days = subs(start date) - today and divide it by 86400000 (ms in one day)
} // Then round it to the nearest whole day

function App() {
  const { session, loading: sessionLoading, error: sessionError } = useSession() // check if the user logged in
  const [subscriptions, setSubscriptions] = useState([]) // select the subs with the current user id
  const [alerts, setAlerts] = useState([]) // select the alert where the subs_id == user_id
  const [loadedUserId, setLoadedUserId] = useState(null) //
  const [refreshKey, setRefreshKey] = useState(0)
  const [loadError, setLoadError] = useState('') // handle errror message if API fails
  const [search, setSearch] = useState('') // filter for all / due soon for subs
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null) 
  const [authOpen, setAuthOpen] = useState(false)
  const [toast, setToast] = useState('') // success message
  const [deletingId, setDeletingId] = useState(null) // track which subs is being deleted
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('subtrack-theme') === 'dark') // toggle between dark and light
  const loading = Boolean(session && loadedUserId !== session.user.id)

  useEffect(() => { // To load user's subs from backend
    if (!session) return undefined // check if user sign in if no user the code does not run
    let cancelled = false // prevent data loads if user log out,change page or refresh
    api('/subs').then((data) => { // calls subs from backend 
      if (cancelled) return // If false, load the subs
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
  }, [refreshKey, session]) // runs when user logs in/out

  useEffect(() => { // for alerts table
    if (!session) return undefined
    let cancelled = false
    api('/alerts').then((data) => {
      if (!cancelled) setAlerts(data.alerts || []) // if user still on the page update list, if there no alert set to empty list
    }).catch((error) => { // catch any error and run the code
      if (cancelled) return // if true stop
      setAlerts([]) // set alert to empty list
      setLoadError((current) => [ // update error message to list 
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
    const timeout = window.setTimeout(() => setToast(''), 3200) // delay for message disappear
    return () => window.clearTimeout(timeout)
  }, [toast])

  const upcoming = useMemo( // usememo = memorize it if the changes is not run
    () => subscriptions
      .map((subscription) => ({ // get every object from table
        ...subscription,
        renewalDate: dateFromSubscription(subscription), // get the date from datefromsub function
      }))
      .sort((a, b) => (a.renewalDate?.getTime() || 0) - (b.renewalDate?.getTime() || 0)), // sort the subs in asc 
    [subscriptions],  // check the date are not zero and minus it with another date
  )

  const visibleSubscriptions = useMemo(() => upcoming.filter((subscription) => { // start the list with the subs that almost expired
    const matchesSearch = subscription.names.toLowerCase().includes(search.trim().toLowerCase()) // for search
    const days = daysUntil(subscription.renewalDate) // get the count of day until expired from daysUntil function
    let matchesFilter = true
    if (filter === "upcoming") {
      matchesFilter = days >= 0 && days <= 7
    } else if (filter === "expired") {
      matchesFilter = days < 0
    }
    return matchesSearch && matchesFilter
  }), [filter, search, upcoming])

  const summary = useMemo(() => {
    const active = upcoming.filter((subscription) => daysUntil(subscription.renewalDate) >= 0) // keep only subs that have not expired
    const dueSoon = upcoming.filter((subscription) => { // filter subs nearing renewal
      const days = daysUntil(subscription.renewalDate)
      return days >= 0 && days <= 7
    })
    const monthlyEquivalent = active.reduce((total, subscription) => {
      const duration = Number(subscription.duration) // get the duration from subs table
      return total + (duration > 0 ? Number(subscription.price) * 30 / duration : 0) // check duration > 0 if true get the price from subs * 30 / duration else 0 then + total
    }, 0)
    return { active: active.length, dueSoon: dueSoon.length, monthlyEquivalent } // return active subs count & expiring subs count & monthly cost
  }, [upcoming])

  async function saveSubscription(values) { // Create/Update function
    const formData = new FormData()
    formData.append('names', values.names.trim())
    formData.append('price', values.price)
    formData.append('startd', values.startd)
    formData.append('duration', values.duration)
    const isEditing = Boolean(modal.subscription) // check if the subs exist

    await api(
      isEditing ? `/subs/${modal.subscription.id}` : '/subs', // send PUT request for updating and POST for creating
      { method: isEditing ? 'PUT' : 'POST', body: formData },
    )
    setModal(null) // close the popup
    setToast(isEditing ? 'Subscription updated' : 'Subscription added')
    setRefreshKey((current) => current + 1) // refresh data
  }

  async function deleteSubscription(subscription) { // function for delete subs
    if (!window.confirm(`Delete ${subscription.names}? This action cannot be undone.`)) return // check the user intend
    setDeletingId(subscription.id) // track the subs that being delete
    try {
      await api(`/subs/${subscription.id}`, { method: 'DELETE' }) // call the backend to delete
      setSubscriptions((current) => current.filter((item) => item.id !== subscription.id)) // update state
      setRefreshKey((current) => current + 1) // refresh the data
      setToast('Subscription deleted')
    } catch (error) {
      setLoadError(error.message || 'Could not delete this subscription.')
    } finally {
      setDeletingId(null) // reset state (cleanup)
    }
  }

  async function signOut() { // for sign out
    const { error } = await supabase.auth.signOut()
    if (error) setLoadError(error.message)
  }

  function toggleTheme() { // toggle for dark and light mode
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
            {alerts.map((alert) => (
              <section className="alert-banner" aria-label="Renewal alert" key={alert.id}>
                <span className="alert-icon"><Bell size={17} /></span>
                <div>
                  <strong>Subscription ending soon</strong>
                  <p>{alert.descr}</p>
                </div>
                <button
                  className="plain-icon"
                  onClick={() => setAlerts((current) => current.filter((item) => item.id !== alert.id))}
                  aria-label="Dismiss alert"
                >
                  <X size={17} />
                </button>
              </section>
            ))}
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
