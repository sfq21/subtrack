import { useState } from 'react'
import { ArrowRight, CreditCard, X } from 'lucide-react'
import { supabase } from '../src/lib/supabase'

export default function Auth({ onClose }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    try {
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
      if (result.error) throw result.error
      if (result.data.session) onClose()
      else setMessage('Account created. Check your email to confirm your address, then sign in.')
    } catch (authError) {
      setError(authError.message || 'Could not complete sign-in.')
    } finally {
      setBusy(false)
    }
  }

  function changeMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
    setMessage('')
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close dialog" disabled={busy}>
          <X size={20} />
        </button>
        <div className="auth-symbol"><CreditCard size={23} /></div>
        <div className="eyebrow">WELCOME TO SUBTRACK</div>
        <h2 id="auth-title">{mode === 'signin' ? 'A clearer picture starts here.' : 'Start your own tracker.'}</h2>
        <p className="modal-intro">{mode === 'signin' ? 'Sign in to see what is coming up.' : 'Create an account to keep your subscriptions in check.'}</p>
        <form className="subscription-form" onSubmit={submit}>
          <label>
            Email address
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </label>
          {error && <div className="notice error" role="alert">{error}</div>}
          {message && <div className="notice success" role="status">{message}</div>}
          <button className="button button-primary modal-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="auth-switch">
          {mode === 'signin' ? 'New to SubTrack?' : 'Already have an account?'}
          <button type="button" onClick={changeMode}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button>
        </div>
      </section>
    </div>
  )
}
