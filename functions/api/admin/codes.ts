import { error, json, readBody, type Env } from '../../_shared/http'

const CODE_RE = /^[A-Za-z0-9]{3,30}$/

// Admin auth: require x-admin-secret header to match ADMIN_SECRET env var.
// Constant-time compare so timing can't leak the secret length/prefix.
function secretEquals(a: string, b: string): boolean {
  const ba = new TextEncoder().encode(a)
  const bb = new TextEncoder().encode(b)
  if (ba.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i]
  return diff === 0
}

function unauthorized(env: Env, req: Request): boolean {
  const secret = env.ADMIN_SECRET
  if (!secret) return true
  const provided = req.headers.get('x-admin-secret') ?? ''
  return !secretEquals(provided, secret)
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (unauthorized(context.env, context.request)) return error('Unauthorized', 401)
  const db = context.env.DB

  let body: { code?: string; points?: number; maxUses?: number }
  try {
    body = await readBody<{ code?: string; points?: number; maxUses?: number }>(context.request)
  } catch {
    return error('Invalid JSON body')
  }

  const code = body.code?.trim().toUpperCase() ?? ''
  const points = Number(body.points)
  const maxUses = Number(body.maxUses ?? 1)

  if (!CODE_RE.test(code)) return error('Code must be 3-30 letters/numbers')
  if (!Number.isInteger(points) || points <= 0 || points > 100_000) return error('Invalid points value')
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1_000_000) return error('Invalid max uses')

  const existing = await db.prepare('SELECT id FROM promo_codes WHERE code = ?1').bind(code).first()
  if (existing) return error('Code already exists', 409)

  await db
    .prepare('INSERT INTO promo_codes (code, points, max_uses) VALUES (?1, ?2, ?3)')
    .bind(code, points, maxUses)
    .run()

  return json(
    { code, points, maxUses, usedCount: 0 },
    201,
  )
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (unauthorized(context.env, context.request)) return error('Unauthorized', 401)
  const db = context.env.DB

  const rows = await db
    .prepare(
      'SELECT code, points, max_uses, used_count, active, created_at FROM promo_codes ORDER BY created_at DESC LIMIT 100',
    )
    .all<{ code: string; points: number; max_uses: number; used_count: number; active: number; created_at: string }>()

  const codes = rows.results.map((r) => ({
    code: r.code,
    points: r.points,
    maxUses: r.max_uses,
    usedCount: r.used_count,
    active: r.active === 1,
    createdAt: r.created_at,
  }))

  return json({ codes })
}
