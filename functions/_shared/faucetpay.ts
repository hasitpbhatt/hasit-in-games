// FaucetPay REST API client. API key comes from env (never client-side).
// Docs: https://faucetpay.io/page/api-documentation

interface FaucetPayResponse {
  status: number
  message: string
  [key: string]: unknown
}

export interface SendResult {
  payoutId: string
  balance: number
}

function form(params: Record<string, string>): BodyInit {
  const entries = Object.entries(params)
  const body = new URLSearchParams()
  for (const [k, v] of entries) body.append(k, v)
  return body
}

export async function faucetSend(apiKey: string, amountSuns: number, to: string): Promise<SendResult> {
  const res = await fetch('https://faucetpay.io/api/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form({
      api_key: apiKey,
      amount: String(amountSuns),
      to,
      currency: 'TRX',
    }),
  })
  const data = (await res.json()) as FaucetPayResponse
  if (data.status !== 200) {
    throw new Error(`FaucetPay error ${data.status}: ${data.message}`)
  }
  return {
    payoutId: String(data.payout_id ?? ''),
    balance: Number(data.balance ?? 0),
  }
}

// Validate that a FaucetPay username exists (returns its user hash or null).
export async function faucetCheckUser(apiKey: string, to: string): Promise<string | null> {
  const res = await fetch('https://faucetpay.io/api/v1/checkaddress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form({ api_key: apiKey, address: to }),
  })
  const data = (await res.json()) as FaucetPayResponse
  if (data.status !== 200) return null
  return String(data.payout_user_hash ?? '') || null
}
