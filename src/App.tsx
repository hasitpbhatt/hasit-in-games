import { useEffect, useState } from 'react'
import { useAuth } from './store/auth'
import { GAMES, type GameId } from './lib/points'
import { useTheme } from './lib/useTheme'
import { GameView } from './features/games/GameView'
import { GameCard } from './features/games/GameCard'
import { LoginForm } from './features/auth/LoginForm'
import { WalletSheet } from './features/WalletSheet'
import { BottomSheet } from './components/BottomSheet'
import { ConfirmModal } from './components/ConfirmModal'
import { HelpModal } from './components/HelpModal'

function App() {
  const { user, todayEarned, todayCap, refresh, logout, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeGame, setActiveGame] = useState<GameId | null>(null)
  const [walletOpen, setWalletOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const onPop = () => setActiveGame(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openGame = (id: GameId) => {
    if (activeGame) return
    setActiveGame(id)
    window.history.pushState({ game: id }, '')
  }

  const closeGame = () => {
    if (window.history.state && typeof window.history.state.game === 'string') {
      window.history.back()
    } else {
      setActiveGame(null)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            🎮
          </span>
          <div className="brand-text">
            <span className="brand-name">hasit.in/games</span>
            <span className="brand-sub">play · earn · redeem</span>
          </div>
        </div>
        <div className="userbar">
          <button
            type="button"
            className="btn btn-ghost theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <>
              <span className="chip chip-user">👤 {user.username}</span>
              {todayEarned > 0 && (
                <span className="chip chip-today">+{todayEarned.toLocaleString()} today</span>
              )}
              {todayCap > 0 && (
                <div className="cap-bar" aria-label={`Daily cap ${Math.round((todayEarned / todayCap) * 100)}% used`}>
                  <div className="cap-bar-fill" style={{ width: `${Math.min(100, Math.round((todayEarned / todayCap) * 100))}%` }} />
                  <span className="cap-bar-label">{todayEarned.toLocaleString()} / {todayCap.toLocaleString()}</span>
                </div>
              )}
              <button
                type="button"
                className="wallet-pill"
                onClick={() => setWalletOpen(true)}
                aria-haspopup="dialog"
                aria-label="Open wallet"
              >
                <span className="wallet-icon" aria-hidden>
                  ⭐
                </span>
                {user.balance.toLocaleString()}
              </button>
              <button className="btn btn-ghost" onClick={() => setHelpOpen(true)} aria-label="Help">
                Help
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmLogout(true)}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {loading ? (
        <main className="loading">
          <div className="skeleton-ring" aria-hidden />
          <span>Loading your arcade…</span>
        </main>
      ) : !user ? (
        <main className="welcome">
          <LoginForm />
        </main>
      ) : (
        <main>
          <div className="container">
            {activeGame ? (
              <GameView game={activeGame} onBack={closeGame} />
            ) : (
              <>
                <section className="hero">
                  <h1>
                    Play. Earn. <span className="gradient-text">Redeem.</span>
                  </h1>
                  <p className="sub">
                    Skill-based arcade games on hasit.in. Every play is validated server-side;
                    cash out your points for PEPE on FaucetPay.
                  </p>
                </section>

                <p className="section-label">Game vault</p>
                <section className="games-grid" aria-label="Available games">
                  {GAMES.map((g, i) => (
                    <GameCard key={g.id} game={g} index={i} onPlay={openGame} />
                  ))}
                </section>
              </>
            )}
          </div>
        </main>
      )}

      <BottomSheet open={walletOpen} onClose={() => setWalletOpen(false)} ariaLabel="Wallet">
        <WalletSheet />
      </BottomSheet>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <ConfirmModal
        open={confirmLogout}
        title="Log out?"
        message="You'll need to log back in to play and redeem. Your points stay saved."
        confirmLabel="Log out"
        danger
        onConfirm={() => {
          setConfirmLogout(false)
          logout()
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}

export default App
