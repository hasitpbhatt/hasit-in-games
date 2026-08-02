import { useEffect, useState } from 'react'
import { useAuth } from './store/auth'
import { useProgress } from './store/progress'
import { GAMES, type GameId } from './lib/points'
import { titleById } from './lib/story'
import { useTheme } from './lib/useTheme'
import { GameView } from './features/games/GameView'
import { GameCard } from './features/games/GameCard'
import { LoginForm } from './features/auth/LoginForm'
import { WalletSheet } from './features/WalletSheet'
import { BottomSheet } from './components/BottomSheet'
import { ConfirmModal } from './components/ConfirmModal'
import { HelpModal } from './components/HelpModal'
import { BrandMark } from './components/BrandMark'
import { FrogMascot } from './components/FrogMascot'
import { SoulMeter } from './components/SoulMeter'
import { JournalSheet } from './components/JournalSheet'
import { StoryIntro } from './components/StoryIntro'
import { UnlockToast } from './components/UnlockToast'

function App() {
  const { user, todayEarned, todayCap, refresh, logout, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { introSeen, titles, soulPct, notice, markIntroSeen, clearNotice, refresh: refreshProgress } = useProgress()
  const [activeGame, setActiveGame] = useState<GameId | null>(null)
  const [walletOpen, setWalletOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (user) refreshProgress()
  }, [user, refreshProgress])

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

  const playFromJournal = (id: GameId) => {
    setJournalOpen(false)
    openGame(id)
  }

  const closeGame = () => {
    if (window.history.state && typeof window.history.state.game === 'string') {
      window.history.back()
    } else {
      setActiveGame(null)
    }
  }

  const topTitle = titles.length > 0 ? titles[titles.length - 1] : null

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <BrandMark />
          </span>
          <div className="brand-text">
            <span className="brand-name">SkillArcade</span>
            <span className="brand-sub">keep the arcade alive</span>
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
              {topTitle && (
                <button
                  type="button"
                  className="chip chip-title"
                  onClick={() => setJournalOpen(true)}
                  aria-label={`Your title: ${titleById(topTitle)?.name ?? ''}`}
                >
                  ★ {titleById(topTitle)?.name}
                </button>
              )}
              {todayEarned > 0 && (
                <span className="chip chip-today">+{todayEarned.toLocaleString()} today</span>
              )}
              {todayCap > 0 && (
                <div
                  className="cap-bar"
                  role="progressbar"
                  aria-label={`Daily points cap`}
                  aria-valuemin={0}
                  aria-valuemax={todayCap}
                  aria-valuenow={todayEarned}
                  title="Daily earning cap — resets at midnight UTC"
                >
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
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setJournalOpen(true)}
                aria-haspopup="dialog"
                aria-label="Open journal"
              >
                📖 Journal
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
          <FrogMascot className="loading-frog" />
          <span>Waking the cabinets…</span>
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
                  <p className="hero-kicker">
                    The arcade wakes as you walk in. Croak grins: "You're back."
                  </p>
                  <h1>
                    Play. Earn. <span className="gradient-text">Redeem.</span>
                  </h1>
                  <p className="sub">
                    {GAMES.length} cabinets, {GAMES.length} trials. Purify each with real skill and
                    the arcade's soul returns — every run still pays out as PEPE via FaucetPay.
                  </p>
                </section>

                {notice?.kind === 'welcome' && (
                  <div className="game-tip welcome-beat" role="status">
                    <FrogMascot className="welcome-frog" />
                    <span>{notice.text}</span>
                    <button type="button" onClick={clearNotice} aria-label="Dismiss welcome message">
                      ✕
                    </button>
                  </div>
                )}

                <SoulMeter />

                <p className="section-label">
                  The Trials
                  <button
                    type="button"
                    className="chip chip-soul"
                    onClick={() => setJournalOpen(true)}
                  >
                    Arcade soul {soulPct}%
                  </button>
                </p>
                <section className="games-grid" aria-label="Available trials">
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

      <BottomSheet open={journalOpen} onClose={() => setJournalOpen(false)} ariaLabel="Journal">
        <JournalSheet onPlay={playFromJournal} />
      </BottomSheet>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <ConfirmModal
        open={confirmLogout}
        title="Clock out, keeper?"
        message="The arcade keeps a light on for you. Your points stay in the safe — see you next shift."
        confirmLabel="Clock out"
        danger
        onConfirm={() => {
          setConfirmLogout(false)
          logout()
        }}
        onCancel={() => setConfirmLogout(false)}
      />

      {user && !introSeen && <StoryIntro onDone={markIntroSeen} />}

      <UnlockToast />
    </div>
  )
}

export default App
