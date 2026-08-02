import type { Env } from './types'

export interface UserRow {
  id: number
  username: string
  password_hash: string
  salt: string
  faucetpay_username: string | null
  balance: number
  created_at: string
  kdf_iterations: number
  last_used_at: string
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

export async function findUserByUsername(db: D1Database, username: string): Promise<UserRow | null> {
  const res = await db.prepare('SELECT * FROM users WHERE username = ?1').bind(username).first<UserRow>()
  return res ?? null
}

export async function findUserById(db: D1Database, id: number): Promise<UserRow | null> {
  const res = await db.prepare('SELECT * FROM users WHERE id = ?1').bind(id).first<UserRow>()
  return res ?? null
}

export async function createSession(db: D1Database, userId: number, token: string): Promise<void> {
  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()
  await db
    .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?1, ?2, ?3)')
    .bind(token, userId, expires)
    .run()
}

export async function getUserByToken(db: D1Database, token: string | null): Promise<UserRow | null> {
  if (!token) return null
  const res = await db
    .prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?1 AND sessions.expires_at > ?2')
    .bind(token, new Date().toISOString())
    .first<UserRow>()
  return res ?? null
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?1').bind(token).run()
}

// Bump the last-used timestamp so stale guest accounts can be reaped later.
export async function touchUser(db: D1Database, userId: number): Promise<void> {
  await db.prepare('UPDATE users SET last_used_at = datetime(\'now\') WHERE id = ?1').bind(userId).run()
}

// Reclaim abandoned guest accounts so the table can't grow unbounded. Only
// guests who haven't been seen in `maxAgeDays` days are eligible — that
// threshold is deliberately well past the 30-day session TTL, so any
// row that still has an active session is never caught here. Runs inline
// on guest creation (a rare path) instead of a scheduled Worker, keeping
// it free of any cron/Worker resource.
export async function purgeStaleGuests(db: D1Database, maxAgeDays = 90): Promise<number> {
  const res = await db
    .prepare('DELETE FROM users WHERE username LIKE ?1 AND last_used_at < datetime(\'now\', ?2)')
    .bind('guest_%', `-${maxAgeDays} days`)
    .run()
  return res.meta.changes
}

export async function todayEarned(db: D1Database, userId: number): Promise<number> {
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    .toISOString()
    .slice(0, 10)
  // Range predicate instead of date(created_at) = ? — keeps the
  // idx_score_events_user_date index usable.
  const res = await db
    .prepare('SELECT COALESCE(SUM(points), 0) AS total FROM score_events WHERE user_id = ?1 AND created_at >= ?2 AND created_at < ?3')
    .bind(userId, day, next)
    .first<{ total: number }>()
  return res?.total ?? 0
}

// Expire stale sessions on login so the sessions table doesn't grow forever.
export async function purgeExpiredSessions(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE expires_at <= ?1').bind(new Date().toISOString()).run()
}

export function readSessionCookie(req: Request): string | null {
  const header = req.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === 'hasit_session') return rest.join('=')
  }
  return null
}

// Client IP for per-IP daily caps. Cloudflare Pages always sets this header in
// production; local dev (wrangler) usually doesn't, so callers treat null as
// "cap not applicable" rather than failing the round.
export function clientIp(req: Request): string | null {
  return req.headers.get('cf-connecting-ip')
}

export function sessionCookie(token: string, maxAge = SESSION_TTL_SECONDS, secure = false): string {
  return `hasit_session=${token}; Path=/; HttpOnly; SameSite=Lax;${secure ? ' Secure;' : ''} Max-Age=${maxAge}`
}

export function clearSessionCookie(secure = false): string {
  return `hasit_session=; Path=/; HttpOnly; SameSite=Lax;${secure ? ' Secure;' : ''} Max-Age=0`
}

export type { Env }
