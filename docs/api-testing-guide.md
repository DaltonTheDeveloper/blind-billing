# Blind Billing API Testing Guide

**Base URL:** `https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev`

---

## 1. Create an Account (Cognito)

Sign up via the dashboard at [blindbilling.vercel.app](https://blindbilling.vercel.app) or use the API directly:

```bash
# Sign up
aws cognito-idp sign-up \
  --client-id 7dkhgnrc1134s2nhdikk61kf2t \
  --username your@email.com \
  --password YourPassword123 \
  --region us-east-1

# Confirm with the code emailed to you
aws cognito-idp confirm-sign-up \
  --client-id 7dkhgnrc1134s2nhdikk61kf2t \
  --username your@email.com \
  --confirmation-code 123456 \
  --region us-east-1

# Sign in to get tokens
aws cognito-idp initiate-auth \
  --client-id 7dkhgnrc1134s2nhdikk61kf2t \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=your@email.com,PASSWORD=YourPassword123 \
  --region us-east-1
```

Save the `IdToken` from the response — you'll need it for the next step.

---

## 2. Create a Merchant (get your API key)

```bash
export TOKEN="your-id-token-here"

curl -X POST https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/merchants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "business_name": "My Test Shop",
    "email": "merchant@example.com",
    "branding_mode": "blind"
  }'
```

**Response:**
```json
{
  "merchant_id": "uuid-here",
  "api_key": "bb_live_abc123...",
  "api_key_preview": "bb_live_...ab12",
  "business_name": "My Test Shop"
}
```

**Save your `api_key` — it's shown only once!**

---

## 3. Create a Charge

```bash
export API_KEY="bb_live_your-key-here"

curl -X POST https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/charge \
  -H "Content-Type: application/json" \
  -H "X-Blind-Billing-Key: $API_KEY" \
  -d '{
    "amount": 49.99,
    "currency": "USD",
    "customer_name": "Jane Smith",
    "reference": "ORDER-001"
  }'
```

**Response:**
```json
{
  "payment_link": "https://...",
  "qr_code": "https://...",
  "payment_id": "bb_pay_a1b2c3d4e5f6g7h8",
  "expires_at": "2026-03-13 00:00"
}
```

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Customer email |
| `phone` | string | Customer phone |
| `reference` | string | Your order/invoice ID (deduped) |
| `success_url` | string | Redirect after payment |
| `cancel_url` | string | Redirect on cancel |
| `pre_auth` | boolean | Pre-authorize instead of capture |
| `pass_surcharge` | boolean | Pass processing fee to customer (default: true) |

### Idempotency

Add `X-Idempotency-Key` header to safely retry requests within 24 hours:

```bash
curl -X POST https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/charge \
  -H "Content-Type: application/json" \
  -H "X-Blind-Billing-Key: $API_KEY" \
  -H "X-Idempotency-Key: order-001-attempt-1" \
  -d '{ "amount": 49.99, "currency": "USD", "customer_name": "Jane Smith" }'
```

Retrying with the same idempotency key returns the cached response with `"cached": true`.

---

## 4. Mock a Payment (sandbox testing)

Mark a pending charge as paid without going through the checkout:

```bash
curl -X POST https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/mock-pay/bb_pay_a1b2c3d4e5f6g7h8
```

**Response:**
```json
{
  "status": "paid",
  "payment_id": "bb_pay_a1b2c3d4e5f6g7h8"
}
```

---

## 5. Check Payment Status

```bash
curl https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/payments/bb_pay_a1b2c3d4e5f6g7h8 \
  -H "X-Blind-Billing-Key: $API_KEY"
```

**Response:**
```json
{
  "payment_id": "bb_pay_a1b2c3d4e5f6g7h8",
  "reference": "ORDER-001",
  "amount": 49.99,
  "currency": "USD",
  "status": "paid",
  "card_brand": "Visa",
  "card_last4": "4242",
  "created_at": "2026-03-12T06:20:00.000Z",
  "settled_at": "2026-03-12T06:21:00.000Z"
}
```

---

## 6. List All Transactions

```bash
curl https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/transactions \
  -H "X-Blind-Billing-Key: $API_KEY"
```

Returns up to 50 transactions, sorted newest first.

---

## 7. Get Merchant Profile

```bash
# With API key
curl https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/merchants/me \
  -H "X-Blind-Billing-Key: $API_KEY"

# Or with JWT token
curl https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/merchants/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 8. Update Merchant Settings

```bash
curl -X PATCH https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/merchants/me \
  -H "Content-Type: application/json" \
  -H "X-Blind-Billing-Key: $API_KEY" \
  -d '{
    "business_name": "Updated Name",
    "webhook_url": "https://myserver.com/webhooks/blind-billing",
    "branding_mode": "merchant"
  }'
```

---

## 9. Rotate API Key

```bash
curl -X POST https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev/v1/merchants/rotate-key \
  -H "X-Blind-Billing-Key: $API_KEY"
```

**Response:**
```json
{
  "key": "bb_live_new-key-here...",
  "preview": "bb_live_...xy34"
}
```

Your old key is immediately invalidated. Update your integration.

---

## Full End-to-End Test Script

```bash
#!/bin/bash
BASE="https://f7asrnx86f.execute-api.us-east-1.amazonaws.com/dev"
API_KEY="bb_live_your-key-here"

echo "=== Creating charge ==="
CHARGE=$(curl -s -X POST "$BASE/v1/charge" \
  -H "Content-Type: application/json" \
  -H "X-Blind-Billing-Key: $API_KEY" \
  -d '{"amount":25.00,"currency":"USD","customer_name":"Test User","reference":"E2E-TEST-001"}')
echo "$CHARGE" | python3 -m json.tool

PAYMENT_ID=$(echo "$CHARGE" | python3 -c "import sys,json; print(json.load(sys.stdin)['payment_id'])")
echo "Payment ID: $PAYMENT_ID"

echo ""
echo "=== Checking status (should be pending) ==="
curl -s "$BASE/v1/payments/$PAYMENT_ID" \
  -H "X-Blind-Billing-Key: $API_KEY" | python3 -m json.tool

echo ""
echo "=== Mocking payment ==="
curl -s -X POST "$BASE/v1/mock-pay/$PAYMENT_ID" | python3 -m json.tool

echo ""
echo "=== Checking status (should be paid) ==="
curl -s "$BASE/v1/payments/$PAYMENT_ID" \
  -H "X-Blind-Billing-Key: $API_KEY" | python3 -m json.tool

echo ""
echo "=== Listing all transactions ==="
curl -s "$BASE/v1/transactions" \
  -H "X-Blind-Billing-Key: $API_KEY" | python3 -m json.tool
```

---

## Error Codes Reference

| Code | Meaning |
|------|---------|
| 400 | Bad request (invalid JSON, missing path params) |
| 401 | Invalid or missing API key / JWT token |
| 404 | Resource not found |
| 409 | Duplicate reference (charge already exists) |
| 422 | Validation error (missing fields, invalid amount/currency) |
| 502 | Payment processor unavailable |

## Supported Currencies

`USD`, `CAD`, `GBP`, `EUR`, `AUD`

## Rate Limits

2,000 requests per 5 minutes per IP (enforced by AWS WAF).
