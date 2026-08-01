import { clearSessionCookie, deleteSession, readSessionCookie } from '../_shared/db'
import { json, type Env } from '../_shared/http'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const token = readSessionCookie(context.request)
  if (token) {
    await deleteSession(context.env.DB, token)
  }
  const res = json({ ok: true })
  res.headers.append('Set-Cookie', clearSessionCookie())
  return res
}
