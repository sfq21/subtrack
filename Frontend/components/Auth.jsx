import { useState } from 'react'
import { ArrowRight, CreditCard, X } from 'lucide-react'
import { supabase } from '../src/lib/supabase'

export default function Auth({ onClose }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (resetError) throw resetError
        setMessage('If an account exists for that email, a reset link is on its way.')
      } else if (mode === 'reset' || mode === 'change') {
        if (password !== confirmPassword) {
          throw new Error('The passwords do not match.')
        }

        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError

        setPassword('')
        setConfirmPassword('')
        setMessage('Your password has been updated.')
      } else {
        const result = mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password })

        if (result.error) throw result.error
        if (result.data.session) onClose()
        else setMessage('Account created. Check your email to confirm your address, then sign in.')
      }
    } catch (authError) {
      setError(authError.message || 'Could not complete the request.')
    } finally {
      setBusy(false)
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  const needsEmail = ['signin', 'signup', 'forgot'].includes(mode)
  const needsPassword = ['signin', 'signup', 'reset', 'change'].includes(mode)
  const title = {
    signin: 'A clearer picture starts here.',
    signup: 'Start your own tracker.',
    forgot: 'Reset your password.',
    reset: 'Choose a new password.',
    change: 'Change your password.',
  }[mode]

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
        <h2 id="auth-title">{title}</h2>

        <form className="subscription-form" onSubmit={submit}>
          {needsEmail && (
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
          )}

          {needsPassword && (
            <label>
              {mode === 'signin' ? 'Password' : 'New password'}
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
          )}

          {(mode === 'reset' || mode === 'change') && (
            <label>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
          )}

          {error && <div className="notice error" role="alert">{error}</div>}
          {message && <div className="notice success" role="status">{message}</div>}

          <button className="button button-primary modal-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : {
              signin: 'Sign in',
              signup: 'Create account',
              forgot: 'Send reset link',
              reset: 'Update password',
              change: 'Update password',
            }[mode]}
            <ArrowRight size={17} />
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'signin' && (
            <>
              New to SubTrack?
              <button type="button" onClick={() => switchMode('signup')}>Create an account</button>
              <button type="button" onClick={() => switchMode('forgot')}>Forgot password?</button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?
              <button type="button" onClick={() => switchMode('signin')}>Sign in</button>
            </>
          )}
          {mode === 'forgot' && (
            <button type="button" onClick={() => switchMode('signin')}>Back to sign in</button>
          )}
        </div>
      </section>
    </div>
  )
}