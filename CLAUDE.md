# Blind Billing — Project Reference

## Architecture
- **Frontend**: Vite 5 + React 18 + TailwindCSS 3 + TypeScript 5, port 5173
- **Backend**: AWS Lambda (Serverless Framework v3), Node.js 20, ESM
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Payment Processor**: Kurv (fully mocked — no real HTTP calls)

## Design System
- Background: `#060807`, Surface: `#0d0f0c`, Card: `#141714`, Border: `#1f221e`
- Text: `#e2e4e0`, Muted: `#6b6f68`, Accent (lime): `#a3e635`
- Fonts: Instrument Serif (display), DM Sans (body), Departure Mono (code)
- Accent dim: `rgba(163,230,53,0.08)`

## Key Patterns
- API keys: `bb_live_` prefix, bcrypt-hashed in DB, preview stored as `bb_live_...XXXX`
- Auth: Supabase magic link (email OTP), no passwords
- RLS: merchants see own rows, transactions scoped to merchant
- Realtime: transactions table subscribed for live updates
- Mock mode: `VITE_MOCK_MODE=true` enables demo panel + mock Kurv responses
- Idempotency: `X-Idempotency-Key` header, 24h window
- Webhook signing: HMAC-SHA256 with `X-BlindBilling-Signature` header

## File Structure
```
blind-billing/
├── frontend/          Vite + React SPA
│   └── src/
│       ├── pages/     Landing, Login, Onboard, Dashboard, Transactions, APIKeys, Settings
│       ├── components/ AnimatedHero, PayloadComparison, FlowWalkthrough, PayoutTimeline, etc.
│       ├── hooks/     useTransactions, useMerchant
│       └── lib/       supabase.ts, api.ts
├── functions/         AWS Lambda handlers
│   └── src/
│       ├── shared/    secrets, supabase, auth, kurv (mock), webhook
│       ├── charge/    POST /v1/charge
│       ├── webhook/   POST /webhooks/:merchantId, POST /v1/mock-pay/:paymentId
│       ├── status/    GET /v1/payments/:id
│       └── merchant/  CRUD merchant endpoints
├── infra/             serverless.yml
└── supabase/          migrations
```

## Security
- No plaintext AWS credentials in code
- Secrets fetched from AWS Secrets Manager (fallback to env vars)
- Supabase service_role key never exposed to frontend
- Zero cardholder PII stored in transactions table
- CSP headers block all third-party scripts

## Commands
- `npm run dev` — start frontend dev server
- `npm test` — run function tests (vitest)
- `npm run build` — production frontend build
- `npm run deploy` — deploy lambdas (serverless)
