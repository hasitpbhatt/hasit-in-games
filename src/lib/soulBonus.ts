import { api } from './api'
import { useAuth } from '../store/auth'
import { useProgress } from '../store/progress'

// Claim the one-time arcade-soul completion bonus. Idempotent server-side: the
// reward is granted at most once per account and only after the server
// re-verifies progress from the accepted score history. Safe to call whenever
// the client believes the soul is at 100% — a repeat call simply reports
// awarded: false. Failures (offline, rate limit) are ignored and retried on
// the next crossing or app load.
export async function claimSoulBonus(): Promise<void> {
  if (useProgress.getState().soulPct < 100) return
  try {
    const res = await api.soulComplete()
    if (res.awarded) {
      useAuth.getState().applyEarned(res.balance, res.todayEarned)
      useProgress.getState().notifySoulBonus(res.amount)
    }
  } catch {
    // Not claimed yet — retried on a later submit or refresh.
  }
}
