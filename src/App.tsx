import { useEffect, useState } from 'react'
import { useAuth } from './store/auth'
import { GAMES, type GameId } from './lib/points'
import { GameView } from './features/games/GameView'
import { GameCard } from './features/games/GameCard'
import { LoginForm } from './features/auth/LoginForm'
import { WalletSheet } from './features/WalletSheet'
import { BottomSheet } from './components/BottomSheet'

function App() {
  const { user, todayEarned, refresh, logout, loading } = useAuth()
  const [activeGame, setActiveGame] = useState<GameId | null>(null)
  const [walletOpen, setWalletOpen] = useState(false)

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const onPop = () => setActiveGame(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openGame = (id: GameId) => {
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
        {user && (
          <div className="userbar">
            <span className="chip chip-user">👤 {user.username}</span>
            {todayEarned > 0 && (
              <span className="chip chip-today">+{todayEarned.toLocaleString()} today</span>
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
            <button className="btn btn-ghost" onClick={() => logout()}>
              Logout
            </button>
          </div>
        )}
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
                    cash out your points for TRX on FaucetPay.
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
    </div>
  )
}

export default App
