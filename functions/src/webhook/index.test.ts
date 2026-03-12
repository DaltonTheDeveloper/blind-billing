import { describe, it, expect } from 'vitest'
import { signPayload, verifyWebhookSignature } from '../shared/webhook.js'

describe('webhook signing', () => {
  const secret = 'test-secret-key'
  const payload = '{"event":"payment.completed","amount":149.99}'

  it('signPayload produces consistent HMAC-SHA256', () => {
    const sig1 = signPayload(payload, secret)
    const sig2 = signPayload(payload, secret)
    expect(sig1).toBe(sig2)
    expect(sig1).toMatch(/^sha256=[a-f0-9]{64}$/)
  })

  it('verifyWebhookSignature returns true for valid signature', () => {
    const sig = signPayload(payload, secret)
    expect(verifyWebhookSignature(payload, sig, secret)).toBe(true)
  })

  it('verifyWebhookSignature returns false for tampered payload', () => {
    const sig = signPayload(payload, secret)
    const tampered = payload + ' tampered'
    expect(verifyWebhookSignature(tampered, sig, secret)).toBe(false)
  })

  it('verifyWebhookSignature returns false for wrong secret', () => {
    const sig = signPayload(payload, secret)
    expect(verifyWebhookSignature(payload, sig, 'wrong-secret')).toBe(false)
  })
})
