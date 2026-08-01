import { useEffect } from 'react'
import { useAuth } from './store/auth'
import { GAMES } from './lib/points'
import Game2048 from './features/games/Game2048'
import { LoginForm } from './features/auth/LoginForm'
import { PromoBox } from './features/auth/PromoBox'

function App() {
  const { user, todayEarned, refresh, logout, loading } = useAuth()

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🎮</span>
          <span className="brand-name">hasit.in/games</span>
        </div>
        {user && (
          <div className="userbar">
            <span className="chip">👤 {user.username}</span>
            <span className="chip chip-points">⭐ {user.balance.toLocaleString()} pts</span>
            {todayEarned > 0 && (
              <span className="chip chip-today">today +{todayEarned.toLocaleString()}</span>
            )}
            <button className="btn btn-ghost" onClick={() => logout()}>
              Logout
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <main className="loading">Loading…</main>
      ) : !user ? (
        <main className="welcome">
          <LoginForm />
        </main>
      ) : (
        <main className="portal">
          <section className="hero">
            <h1>Play. Earn points. Redeem for TRX.</h1>
            <p className="sub">
              Skill-based arcade games on hasit.in. Every play is validated server-side;
              redeem your points on FaucetPay.
            </p>
          </section>

          <section className="games-grid">
            {GAMES.map((g) => (
              <GameCard key={g.id} id={g.id} name={g.name} description={g.description} icon={g.icon} />
            ))}
          </section>

          <section className="promo-section">
            <PromoBox />
          </section>

          <section className="game-area" id="game-2048">
            <h2>2048</h2>
            <Game2048 />
          </section>
        </main>
      )}
    </div>
  )
}

function GameCard({ name, description, icon }: { id: string; name: string; description: string; icon: string }) {
  return (
    <div className="game-card">
      <span className="game-icon">{icon}</span>
      <h3>{name}</h3>
      <p>{description}</p>
    </div>
  )
}

export default App
