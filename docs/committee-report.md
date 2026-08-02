# SkillArcade — AI Committee Evaluation Report

**Committee:** 5 game designers (GD-A … GD-E) + 2 psychologists (PSY-A, PSY-B)
**Mode:** E2E code-level review of the shipped build (no live playtesting)
**Date:** 2026-08-02

Every claim below was grounded by reading the actual source. Critical bugs were
re-verified against `src/features/games/`, `functions/_shared/economy.ts`,
`functions/api/*.ts`, and `src/lib/*.ts`.

---

## Executive summary

The platform is structurally sound and unusually well-behaved for a real-money
skill product: deterministic server-authoritative scoring, hard financial
ceilings, honest copy, and a cosmetic-only narrative layer. **Composite score
≈ 3.5/5.** It earns praise on integrity and harm-safety but loses points on
three things: (1) the trust model assumes the client tells the truth about
`playSeconds` and the score, (2) two games aren't strong skill gates, and (3) an
endgame that runs out of reasons to play once the pot is drained and soul is at
100%. (The original soft-lock/payout/fairness bugs were fixed in Phase A.)

| Metric | Score | Committee |
|---|---|---|
| Economy & balancing | 3/5 | GD-C |
| Mobile design & touch | ~3/5 | GD-B |
| UX / UI / clarity | 3.5/5 | GD-D |
| Engagement & roster novelty | 3/5 | GD-E |
| Motivation & flow | 3/5 (flow) · 4/5 (reward) · 4/5 (harm-risk) | PSY-A |
| Cognitive load & frustration | 3/5 | PSY-B |

---

## Consensus strengths

1. **Deterministic, server-truth, skill-only rewards.** No chance mechanics, no
   wager framing, client never computes awards. This is the textbook-correct way
   to stay India-legal and reward-healthy (all members).
2. **Race-safe money plumbing.** Atomic pot/user-cap reservations with partial
   clamping and refunds (`functions/api/score.ts:33-89`), the triple
   per-user/IP/wallet withdrawal budget (`functions/api/redeem.ts:46-75`), and a
   5s undo window are genuinely well-engineered (GD-C, GD-A, PSY-A).
3. **A soul layer that can't corrupt the ledger.** Achievements/titles/streaks
   mint zero points, are skippable and non-blocking, and only advance on
   server-accepted runs — the right way to add meaning without dependency
   (PSY-A, GD-D, PSY-B).
4. **Reduced-motion honored down to JS effects** (`ParticleBurst.tsx:29-30`),
   warm honest copy, and no dark patterns (PSY-B, GD-D).

---

## Cross-confirmed bugs & fairness issues

These were independently reported by ≥2 members and verified in source. Items
below remain open; everything else from the original review (Reaction soft-lock,
payout deadlock, Snake input reversal, cap-message conflation, Memory/Queens/
Tango tiering, vault order, heal thresholds, WCAG contrast, focus management,
Toad Hop input handling, bottom-sheet scrolling, Queens tap targets, copy
errors) was fixed in the Phase A pass.

### Major
- **Client-reported playtime is unverifiable.** `playSeconds` is trusted
  verbatim (`score.ts:121-123`). A script can POST fabricated max-tier scores
  with `playSeconds: 5` and harvest the 2,000/day cap in ~1 minute per account;
  with open registration, three accounts drain the whole 5,000/day pot. This
  poisons the "skill-only" claim the legal posture rests on. (GD-A, GD-C, PSY-A)
- **Two games aren't really skill games.** Reaction rewards physiology/hardware
  (flat ceiling); Pinpoint's 19 fixed categories are memorizable in two sessions
  → reliable 150/pts farm, not a skill gate. (GD-A, GD-C, GD-E)

---

## Psychology findings (PSY-A, PSY-B)

- **Flow is fragmented.** Rounds end in a submit→server→banner round-trip with
  a "Submitting…" pause; step-function tiers create unrewarded plateaus
  (e.g. 2048 128→256 both ~70–120 pts) — the classic flow "boredom gap".
- **Reward health is high.** Deterministic payouts = zero slot-machine
  reinforcement. Near-miss *tiers* are mild mastery-motivators, not gambling
  hooks at these stakes.
- **Harm risk is low financially** (~$0.10/day pot) but has two behavioral
  holes: **no 18+ gate** (real-money payouts, scheduled only for Phase 3) and
  **no session pacing** (no break prompt; auto-focused "Play again" buttons
  encourage one-more-try chains).
- **Honesty is a genuine 5/5** — cosmetic-only metagame is communicated with
  unusual candor; no loss-framing, no fake scarcity.
- **Guardrail:** never add randomized payout multipliers or "bonus rounds" —
  that single change would convert this safe product into a slot-adjacent one.

---

## Game concept catalog (30 concepts from 5 designers)

All pass the skill-only / no-luck / server-verifiable / mobile-one-thumb tests.
Grouped by genre. Trust model notes: **count** = bounded integer
(whack/toadhop family), **time** = solve-seconds (queens family), **mono** =
monotonic non-decreasing (2048 family), **derive** = server re-simulates the
claim (strongest).

### Action / dexterity (GD-A, GD-B, GD-E)
| Game | Mechanic | Trust | Effort |
|---|---|---|---|
| **Ballista** | slingshot 12 targets, clear-time | time | Medium |
| **ArcShot / Cannon Flick** | flick-launch, ring scoring (8 shots) | count (sum≤80) | Med-High |
| **Loft** ★ | ballistic aiming; server re-simulates each shot from `{seed, angle, power}` | **derive** | Low-Med |
| **Ring Rush** | tap to intercept a bolt on a moving ring | count | Low-Med |
| **Slice Dash** | swipe-cut scripted targets in one stroke | count | Medium |
| **Juggle** | bounce 1–3 balls, keep them alive | count | Low |
| **Upside** ★ | gravity-flip corridor platformer (VVVVVV-style), gems | count (≤25) | Medium |
| **Circuit Rush** | 3-lane runner, dodge barriers | count/mono | Low-Med |

### Timing / rhythm / regulation (GD-A, GD-B, GD-E)
| Game | Mechanic | Trust | Effort |
|---|---|---|---|
| **Tempo Tap / BeatDock** | tap on a fixed BPM beat (±35ms) | count (≤90) | Low-Med |
| **Pulse** ★ | visual beat-line rhythm, 100→180 BPM ramp, combo | count (≤60) | Low-Med |
| **Tightwire / WireLine** | drag a dot along a narrowing corridor | count | Low-Med |
| **DropStack / SpoolTower** | tap-to-drop blocks, ±6% alignment = Perfect | count + mono | Medium |
| **Rope Wind / SpoolUp** | hold/release to wind a reel under a temp gauge | count (≤45) | Medium |
| **Reactor** | tap to vent heat, budget coolant | count (≤25) | Low-Med |
| **SignalSwipe / Direction Dash** | swipe the prompted direction, combos | count | Low-Med |

### Puzzle / logic (GD-C)
| Game | Mechanic | Trust | Effort |
|---|---|---|---|
| **Panel (Lights Out)** ★ | toggle cell + neighbors; GF(2) guarantees solvability AND exact min-move floor | time/moves | Low-Med |
| **GridSlice (Nonogram)** | fill cells to match row/col run clues | time | Medium |
| **Net (Pipe Rotation)** | rotate tiles to a fully-connected sealed network | time | Medium |
| **Shikaku** | tile the grid into area-matched rectangles | time | Medium |
| **LaserLoom** | progressive beam-routing ladder, level reached | mono | Med-High |
| **Skyline (Skyscrapers)** | permutations + edge-visibility clues | time | High |

### Word / language (GD-D)
| Game | Mechanic | Trust | Effort |
|---|---|---|---|
| **Word Hunt (Boggle)** ★ | 4×4 grid, tap adjacent letters, long words score more | count + derive | Med-High |
| **Anagram Scramble** | find all words in a jumbled rack | count + derive | Medium |
| **Word Ladder** | one-letter steps word→word (procedural BFS chains) | count | Medium |
| **Spell Flash** | flash a word, retype from memory | count | Low |
| **Definition Match** | pick the right definition card | count | High (content) |
| **Sentence Shuffle** | reorder word tiles to rebuild sentences | count | Medium |

### Memory / misc (GD-E)
| Game | Mechanic | Trust | Effort |
|---|---|---|---|
| **Echo** ★ | Simon-style incremental sequence replay; step N ⇒ N−1 provably done | **mono** | Low |
| **Tightwire cluster** | see above | | |

### Recommended first wave (fills committee-flagged gaps, cheap to ship)
1. **Echo** — sequence memory, mono trust, ~Low effort, genuinely novel.
2. **Pulse** (or Tempo Tap) — sustained rhythm/combo; the roster has only
   one-shot Reaction.
3. **Panel (Lights Out)** — provably fair via GF(2); Low-Med.
4. **Loft** — the "server can prove the score" flagship via re-derivation.
5. **Brickline** — falling-block strategy, the biggest genre gap (Medium).
6. **Word Hunt** or **Anagram** — rotating word content, Medium.

---

## Roadmap

### Phase A — integrity fixes ✅ (shipped)
1. ✅ Fix Reaction soft-lock — `too-soon` now re-arms the trial.
2. ✅ Fix payout deadlock — withdrawal capped at the 20-PEPE/day budget with an
   optional `amount` (1–20 PEPE) in `/api/redeem`; wallet has an amount field.
3. ✅ Fix Snake 180° instant death — direction inputs are queued and consumed
   one per tick.
4. ✅ Distinguish "shared pot earned out today" vs "your personal cap" — the
   server returns `capReason: 'pot' | 'user'`.
5. ✅ Fix Memory dead tiers — formula is `1200 − (moves − 16)·50` so every tier
   (and the 1000 heal threshold) is reachable; `[1, 10]` completion floor.
6. ✅ Restore Queens/Tango completion floors (20 / 15 pts).
7. ✅ Surface heal thresholds on game cards + vault now follows `CHAMBER_ORDER`.
8. ✅ WCAG pass: primary CTA contrast (≥4.5:1), focus management (trap +
   restore on all modals/sheets), `chronicler` copy, haptics gated behind
   reduced-motion, 12px micro-labels.

### Phase B — trust model
- Server-issued play-session nonce (`startedAt` timestamp) required by
  `/api/score`, so `playSeconds` becomes unspoofable.
- Per-IP daily earning cap + registration friction (CAPTCHA/email) to close the
  multi-account bot vector.
- Reconcile FaucetPay sends before refunding on timeout (kill the double-send
  window); unique partial index on `payouts(user_id) WHERE status='pending'`.
- Rotate/expand the Pinpoint pool; re-derive word games via `ScoreDetail`.

### Phase C — new games (pick 4–6 from the catalog)
Echo → Pulse → Panel → Loft → Brickline → Word Hunt, in that order.

### Phase D — engagement
- 18+ gate + soft session-pacing nudge (~30–45 min).
- Featured "cabinet of the day", per-game weekly leaderboards, visible pot state.
- Post-100% hard chambers (prestige thresholds), lifetime-points visibility.
- Show "X pts to next tier / X days to next title" goal-gradient in the Journal.
