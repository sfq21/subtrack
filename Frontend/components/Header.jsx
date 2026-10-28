import { CreditCard, LogIn, Moon, Sun } from 'lucide-react'

export default function Header({ session, sessionLoading, darkMode, onToggleTheme, onOpenAuth,onChangePassword, onSignOut }) {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="SubTrack home">
        <span className="brand-mark"><CreditCard size={19} strokeWidth={2.2} /></span>
        <span>SubTrack<span className="brand-period">.</span></span>
      </a>
      <nav className="topbar-actions" aria-label="Main navigation">
        <button
          className="button button-outline theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        {session ? (
          <>
            <span className="account-label">{session.user.email}</span>
            <button className="button button-outline" type="button" onClick={onChangePassword}>Change password</button>
            <button className="button button-outline signout-button" type="button" onClick={onSignOut}>Sign out</button>
          </>
        ) : !sessionLoading && (
          <button className="button button-outline" type="button" onClick={onOpenAuth}>
            <LogIn size={16} /> Sign in
          </button>
        )}
      </nav>
    </header>
  )
}
