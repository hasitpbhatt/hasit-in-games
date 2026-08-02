// Optional committee-evaluation script: uses Mistral's API (MISTRAL_API_KEY) to
// critique the "Last Cabinet" soul layer + proposed new games against the
// economy guardrails. Skips gracefully when no key is configured.
//   npm run evaluate

const API_URL = 'https://api.mistral.ai/v1/chat/completions'
const MODEL = process.env.MISTRAL_MODEL ?? 'mistral-small-latest'

const GUARDRAILS = `
1. 100% skill-based, no chance/luck rewards, no wager framing (India law).
2. Server-authoritative scoring; client never computes awards; PEPE economy,
   daily caps (2,000/user/day, 5,000 pot/day), 5s minimum, undo window intact.
3. "Skill credits"/"Trials"/"cabinets" are copy-only framing; real PEPE economics
   always one glance away (no deception, no dark patterns).
4. No new payout paths: achievements/titles/streaks award 0 points.
5. Every story beat skippable, non-blocking, never slows the play loop.
6. Accessible: WCAG AA, reduced-motion respected (incl. JS effects), honest copy.
`

const TOAD_HOP = `
Toad Hop (SHIPPED): 60s round or 3 falls. 9 lily pads. Hold to charge the frog's
leap, release inside a glowing band (20% -> 12% wide) for a perfect landing that
re-lights a pad; <40% charge = fall (-1 life). Score = perfects. Tier table
max 250 pts. Deterministic, mobile one-thumb, uses existing score pipeline.
`

const CONDUIT = `
The Conduit (DEFERRED proposal): 90s round. Rotate circuit tiles so a flood-fill
path connects a source to a sink; each solved board +1 and regenerates harder.
Score = boards solved. Proposed tier table max 200 pts. Deterministic win-check.
`

const PROMPT = `You are the Economy Guardian on the SkillArcade design committee.

Guardrails:
${GUARDRAILS}

New game concepts:
${TOAD_HOP}
${CONDUIT}

Evaluate ONLY the two new game concepts against the guardrails. Respond with
JSON only, no prose:

{
  "toad_hop": { "verdict": "PASS|RISK", "score": 0-100, "risks": [], "notes": "" },
  "conduit": { "verdict": "PASS|RISK", "score": 0-100, "risks": [], "notes": "" },
  "soul_layer": { "verdict": "PASS|RISK", "score": 0-100, "risks": [], "notes": "" }
}`

const run = async () => {
  if (!process.env.MISTRAL_API_KEY) {
    console.log('MISTRAL_API_KEY not set — skipping committee evaluation.')
    console.log('Set it and re-run:  npm run evaluate')
    return
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: PROMPT }],
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`Mistral API ${res.status}: ${text}`)
    process.exit(1)
  }
  const data = await res.json()
  console.log('Committee evaluation via Mistral:')
  console.log(data.choices?.[0]?.message?.content ?? JSON.stringify(data))
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
