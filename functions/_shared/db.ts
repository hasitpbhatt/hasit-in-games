import type { Env } from './types'

export interface UserRow {
  id: number
  username: string
  password_hash: string
  salt: string
  faucetpay_username: string | null
  balance: number
  created_at: string
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

export async function todayEarned(db: D1Database, userId: number): Promise<number> {
  const day = new Date().toISOString().slice(0, 10)
  const res = await db
    .prepare("SELECT COALESCE(SUM(points), 0) AS total FROM score_events WHERE user_id = ?1 AND date(created_at) = ?2")
    .bind(userId, day)
    .first<{ total: number }>()
  return res?.total ?? 0
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

export function sessionCookie(token: string, maxAge = SESSION_TTL_SECONDS): string {
  return `hasit_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

export function clearSessionCookie(): string {
  return `hasit_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export type { Env }
