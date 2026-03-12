import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

// Mock modules
vi.mock('../shared/auth.js', () => ({
  validateApiKey: vi.fn(),
}))

vi.mock('../shared/supabase.js', () => ({
  getSupabaseClient: vi.fn(),
}))

vi.mock('../shared/kurv.js', () => ({
  kurvClient: {
    createPaymentRequest: vi.fn(),
  },
  buildKurvPayload: vi.fn(() => ({
    amount: 149.99,
    currency: 'USD',
    customer_first_name: 'Jane',
    customer_last_name: 'Smith',
    reference_number: 'ORD-001',
    merchant_id: 'merch_123',
    branding_mode: 'blind',
    template_id: 1,
    payment_type: 'DB',
    payment_frequency: 'ONE-TIME',
    surcharge_fee_enabled: true,
    expiry_date: '2026-03-12 00:00',
    response_url: 'http://localhost:3001/webhooks/merch_123',
  })),
}))

import { handler } from './index.js'
import { validateApiKey } from '../shared/auth.js'
import { getSupabaseClient } from '../shared/supabase.js'
import { kurvClient } from '../shared/kurv.js'

const mockMerchant = {
  id: 'merch_123',
  business_name: 'Test Corp',
  email: 'test@test.com',
  plan: 'starter',
  branding_mode: 'blind' as const,
  kurv_template_blind: 1,
  kurv_template_own: 2,
  webhook_url: null,
  active: true,
}

function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /v1/charge',
    rawPath: '/v1/charge',
    rawQueryString: '',
    headers: {
      'x-blind-billing-key': 'bb_live_test123',
      'content-type': 'application/json',
      ...overrides.headers,
    },
    requestContext: {
      accountId: '123',
      apiId: 'api123',
      domainName: 'test.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'test',
      http: { method: 'POST', path: '/v1/charge', protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'test' },
      requestId: 'req_1',
      routeKey: 'POST /v1/charge',
      stage: '$default',
      time: '2026-03-11T00:00:00Z',
      timeEpoch: 0,
    },
    body: JSON.stringify({
      amount: 149.99,
      currency: 'USD',
      customer_name: 'Jane Smith',
    }),
    isBase64Encoded: false,
    ...overrides,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb: any = {
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  eq: vi.fn(),
  neq: vi.fn(),
  gte: vi.fn(),
  single: vi.fn(() => ({ data: null, error: null })),
}
mockDb.from.mockReturnValue(mockDb)
mockDb.select.mockReturnValue(mockDb)
mockDb.insert.mockReturnValue(mockDb)
mockDb.eq.mockReturnValue(mockDb)
mockDb.neq.mockReturnValue(mockDb)
mockDb.gte.mockReturnValue(mockDb)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSupabaseClient).mockResolvedValue(mockDb as never)
})

describe('charge handler', () => {
  it('returns 401 when API key is missing', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(null)
    const event = makeEvent({ headers: {} })
    const result = await handler(event, {} as never, {} as never) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(401)
    expect(JSON.parse(result.body).error).toBe('Invalid API key')
  })

  it('returns 401 when key does not match', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(null)
    const result = await handler(makeEvent(), {} as never, {} as never) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(401)
  })

  it('returns 422 when amount is missing', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(mockMerchant)
    const event = makeEvent({ body: JSON.stringify({ currency: 'USD', customer_name: 'Jane' }) })
    const result = await handler(event, {} as never, {} as never) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(422)
    expect(JSON.parse(result.body).missing_fields).toContain('amount')
  })

  it('returns 422 when amount is negative', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(mockMerchant)
    const event = makeEvent({ body: JSON.stringify({ amount: -10, currency: 'USD', customer_name: 'Jane' }) })
    const result = await handler(event, {} as never, {} as never) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(422)
    expect(JSON.parse(result.body).error).toContain('positive')
  })

  it('returns 422 when currency is not in whitelist', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(mockMerchant)
    const event = makeEvent({ body: JSON.stringify({ amount: 10, currency: 'XYZ', customer_name: 'Jane' }) })
    const result = await handler(event, {} as never, {} as never) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(422)
    expect(JSON.parse(result.body).error).toContain('currency')
  })

  it('returns 409 when reference already exists', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(mockMerchant)
    mockDb.single.mockResolvedValueOnce({ data: { id: 'existing', status: 'paid' }, error: null }) // reference check

    const event = makeEvent({
      body: JSON.stringify({ amount: 10, currency: 'USD', customer_name: 'Jane', reference: 'DUP-001' }),
    })
    const result = await handler(event, {} as never, {} as never) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(409)
  })

  it('returns 200 with cached response for duplicate idempotency key', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(mockMerchant)
    mockDb.single.mockResolvedValueOnce({
      data: { payment_link: 'https://pay.test', qr_code_url: 'https://qr.test', payment_id: 'bb_pay_cached' },
      error: null,
    })

    const event = makeEvent({
      headers: {
        'x-blind-billing-key': 'bb_live_test123',
        'x-idempotency-key': 'idem_123',
      },
    })
    const result = await handler(event, {} as never, {} as never) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body).cached).toBe(true)
  })

  it('returns 200 on success', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(mockMerchant)
    vi.mocked(kurvClient.createPaymentRequest).mockResolvedValue({
      payment_id: 'kurv_TEST123',
      payment_link: 'https://pay.test/checkout/kurv_TEST123',
      qrcode_link: 'https://qr.test/kurv_TEST123',
      status: 'pending',
      amount: 149.99,
      currency: 'USD',
      expiry_date: '2026-03-12 00:00',
    })

    const result = await handler(makeEvent(), {} as never, {} as never) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.payment_link).toBeTruthy()
    expect(body.payment_id).toMatch(/^bb_pay_/)
  })

  it('returns 502 when Kurv client throws', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(mockMerchant)
    vi.mocked(kurvClient.createPaymentRequest).mockRejectedValue(new Error('Network error'))

    const result = await handler(makeEvent(), {} as never, {} as never) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(502)
    expect(JSON.parse(result.body).error).toContain('unavailable')
  })
})
