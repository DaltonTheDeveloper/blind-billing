# Blind Billing

Privacy-first payment infrastructure. Zero cardholder PII on your servers. T+1 direct settlement.

## Quick Start

```bash
npm install
npm run dev        # Start frontend at localhost:5173
npm test           # Run Lambda function tests
npm run deploy     # Deploy Lambdas to AWS
```

## Architecture

- **Frontend**: Vite + React 18 + TailwindCSS
- **Backend**: AWS Lambda (Serverless Framework)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Processor**: Kurv (mocked for development)

## Environment Setup

1. Copy `.env.example` files and fill in your credentials
2. Run `supabase db push` to apply migrations
3. Run `npm install` at the root
4. Run `npm run dev` to start the frontend

## Security

- Zero cardholder PII stored
- AES-256 encryption for sensitive data
- HMAC-SHA256 webhook signatures
- Row Level Security on all tables
- SAQ A PCI compliance (hosted payment page)
