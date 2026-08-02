# The Soul of SkillArcade — "The Last Cabinet"

**Status:** Combined committee resolution · implemented in this session

An AI design committee — 5 game designers (GD-A … GD-E) and 5 UX designers
(UX-A … UX-E) — deliberated asynchronously and converged on one vision. This
document is the merged resolution; the codebase is the artifact.

## The vision

> A broke pixel-frog janitor named **Croak** and the ghost of an arcade founder
> hire you to save the last cabinet arcade on Earth — by being really, really
> good at its games.

SkillArcade is the last analog arcade standing. A digital glitch, the
**Nullmoth**, is gnawing the glow out of the cabinets. Each game is a
**Trial/chamber**; every skilled play re-syncs a cabinet and restores a fragment
of the arcade's soul. Players are **Keepers**. Points stay "points"; the coin
stays **PEPE** — the narrative is a warm frame, never a second ledger.

**Tone:** warm, whimsical, lightly comedic, game-first. A frog with a mop saving
a tiny arcade one high score at a time.

## Design pillars (all 10 members' binding constraints)

1. **Skill-only.** 100% skill-based, no chance rewards, no wagers, no gambling
   framing (India law).
2. **Server truth.** `functions/_shared/economy.ts` stays authoritative; the
   client never computes awards. PEPE economy, daily caps (2,000/user/day, 5,000
   pot/day), 5s minimum, undo window, and withdrawal budget are untouched.
3. **Framing, not fiction-as-fact.** "Skill credits", "Trials", "cabinets" are
   copy only. One glance from any screen still reaches the real PEPE economics
   (HelpModal keeps "1,000 points = 1 PEPE", the cap bar keeps real numbers).
4. **Never block a keeper.** Every story beat is skippable, sub-second,
   non-blocking, and never slows the play loop.
5. **Local-first.** Progression lives in localStorage; zero new backend routes,
   zero new balance-mutating paths. Achievements/titles/streaks pay 0 points.
6. **Accessible & honest.** WCAG AA contrast, focus-managed dialogs,
   `prefers-reduced-motion` respected (including JS-driven effects), no
   loss-framing, no fake scarcity, no dark patterns.

## Cast

- **Croak** — Head of Custodial Arts, sole staff. Deadpan, reliable, mop.
  *"I've re-synced cabinets with nothing but a mop and a prayer. You'll do
  better. You have fingers."*
- **The Nullmoth** — a glitch-moth that eats *presence*, not points. It scatters
  when a player genuinely concentrates. It's hungry and slightly pathetic, and
  it always loses to focus (which doubles as the anti-exploit story).
- **Gertie Winkle** — the founder's ghost. Whispers the story of each cabinet.
- **Pixel** — the arcade cat. Not plot-relevant. Naps on warm cabinets.

## The 10 chambers (games as cabinets)

| Ch | Game | Chamber | Accent |
|----|------|---------|--------|
| 1 | Reaction Time | The Surge Capacitor | `#fb7185` |
| 1 | Memory Match | The Trophy Vault | `#f472b6` |
| 2 | Whack-a-Mole | The Mole Den | `#f59e0b` |
| 2 | Snake | The Ghost Line | `#22c55e` |
| 2 | Toad Hop | The Lily Circuit | `#2dd4bf` |
| 3 | Typing Sprint | The Rescue Beacon | `#60a5fa` |
| 3 | Pinpoint | The Lost Signposts | `#34d399` |
| 4 | Queens | The Throne of Founders | `#a78bfa` |
| 4 | Tango | The Balance Core | `#fb923c` |
| 5 | 2048 | The Motherboard Forge | `#d946ef` |

Chapters: **I First Light · II Garden of Moles & Serpents · III The Order's
Tongue · IV Logic Loom · V The Million-Tile Heart.**

A chamber is **Healed** when the best server-accepted run crosses a skill
threshold (e.g. 2048 highestTile ≥ 256, reaction avg ≤ 300ms, queens ≤ 135s).

## Progression (local-first)

- **Arcade Soul %** = `70 · (healed/10) + 30 · (achievements/13)`. A meter with
  Croak riding the fill, in the vault header and the Journal.
- **13 achievements** (per-chamber purifies + first play/first spark + a
  10,000-point ledger seal) and **6 titles** (Novice Keeper → Arcade Legend)
  conferred by Croak, shown as a topbar chip.
- **Ember streak** — consecutive UTC days with an accepted play. Cosmetic only.

## Surfaces shipped

- **Story intro** — one-time, post-login, 4 beats, fully skippable.
- **Welcome-back beat** — once per UTC day, a Croak line under the hero.
- **Journal sheet** — the story hub: soul meter, current chapter + next trial,
  Croak's note, titles & achievements, lore recap.
- **Trial briefings** — one-line Croak hint on first open of each game.
- **Chamber-themed vault** — accent-tinted cards, chapter badges, Healed/Nullmoth
  status, chamber hooks instead of plain descriptions.
- **Game view framing** — chamber title, hook, "Back to The Trials".
- **Unlock toasts** — non-blocking achievement/title celebrations.
- **Re-sync feel** — undo/error copy in Croak's voice.

## New game — Toad Hop: The Lily Circuit

The frog caretaker himself is playable. A lane of 9 lily pads; **hold to charge
the leap, release inside the glowing band for a perfect landing** that re-lights
a pad. Round = 60s or 3 falls; score = perfects. 100% skill, deterministic,
server-validated via a `toadhop` tier table (max 250 pts), mirroring the
existing whack/typing trust model.

## Guardrails enforced in this build

- Progression writes happen only when the server **accepts** a run
  (`res.points > 0 || res.capped`) — garbage/bot scores never advance anything.
- Titles/achievements/streaks mint zero points and never touch the ledger.
- Reduced-motion collapses all celebratory effects; the frog is decorative
  (`aria-hidden`) — its words are real text in live regions.
