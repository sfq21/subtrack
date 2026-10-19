import { useEffect, useState } from 'react'
import { supabase } from '../src/lib/supabase'

export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
      setError('')
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error
      if (active) {
        setSession(data.session)
        setLoading(false)
      }
    }).catch((error) => {
      if (active) {
        setError(error.message || 'Could not load your sign-in session.')
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading, error }
}
