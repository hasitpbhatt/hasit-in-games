// D1-backed sliding-window rate limiting.
// Bucket key is `kind:key`, bucket = floor(now / windowSeconds). The atomic
// conditional increment is what makes this race-safe: concurrent requests in
// the same bucket can't both pass a read-then-write check.

export type RateLimitKind = 'score' | 'auth' | 'redeem'

const LIMITS: Record<RateLimitKind, { max: number; windowSeconds: number }> = {
  score: { max: 4, windowSeconds: 60 }, // submissions / min / user
  auth: { max: 5, windowSeconds: 60 }, // login or register attempts / min / IP
  redeem: { max: 2, windowSeconds: 3600 }, // withdraws / hour / user
}

export async function rateLimitOk(
  db: D1Database,
  kind: RateLimitKind,
  key: string,
): Promise<boolean> {
  const limit = LIMITS[kind]
  const bucket = Math.floor(Date.now() / 1000 / limit.windowSeconds)
  const res = await db
    .prepare(
      `INSERT INTO rate_limits (key, bucket, count) VALUES (?1, ?2, 1)
       ON CONFLICT(key, bucket) DO UPDATE SET count = count + 1
       WHERE count < ?3`,
    )
    .bind(`${kind}:${key}`, bucket, limit.max)
    .run()
  // changes === 1 → first hit in this bucket, or increment succeeded under the
  // cap. changes === 0 → the WHERE blocked the increment (cap reached).
  return res.meta.changes === 1
}
