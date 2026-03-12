import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { handler as chargeHandler } from './charge/index.js'
import { handler as webhookHandler } from './webhook/index.js'
import { handler as statusHandler } from './status/index.js'
import { handler as merchantHandler } from './merchant/index.js'
import { dynamo, TABLES, QueryCommand, GetCommand } from './shared/dynamo.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3001')

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Lambda → Express adapter ──────────────────────────────────────────
type LambdaResult = { statusCode: number; headers?: Record<string, string | boolean>; body?: string }
type LambdaFn = (event: Record<string, unknown>) => Promise<LambdaResult>

function adapt(handler: LambdaFn) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const event = {
        requestContext: { http: { method: req.method, path: req.path } },
        rawPath: req.path,
        headers: req.headers as Record<string, string>,
        body: req.body && Object.keys(req.body).length > 0
          ? JSON.stringify(req.body) : null,
        pathParameters: req.params,
        queryStringParameters: req.query as Record<string, string>,
      }

      const result = await handler(event)

      if (result.headers) {
        for (const [k, v] of Object.entries(result.headers)) {
          if (k.toLowerCase() !== 'content-type') res.setHeader(k, String(v))
        }
      }

      res.status(result.statusCode)
      if (result.body) {
        res.setHeader('Content-Type', 'application/json')
        res.send(result.body)
      } else {
        res.end()
      }
    } catch (err) {
      console.error('[error]', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// ── API Routes ────────────────────────────────────────────────────────
app.post('/v1/charge', adapt(chargeHandler as unknown as LambdaFn))
app.get('/v1/payments/:id', adapt(statusHandler as unknown as LambdaFn))
app.get('/v1/transactions', adapt(statusHandler as unknown as LambdaFn))
app.post('/v1/merchants', adapt(merchantHandler as unknown as LambdaFn))
app.get('/v1/merchants/me', adapt(merchantHandler as unknown as LambdaFn))
app.patch('/v1/merchants/me', adapt(merchantHandler as unknown as LambdaFn))
app.post('/v1/merchants/rotate-key', adapt(merchantHandler as unknown as LambdaFn))
app.post('/v1/mock-pay/:paymentId', adapt(webhookHandler as unknown as LambdaFn))
app.post('/webhooks/:merchantId', adapt(webhookHandler as unknown as LambdaFn))

// ── Fake Kurv Checkout ────────────────────────────────────────────────
app.get('/kurv/checkout/:kurvPaymentId', async (req, res) => {
  try {
    const { kurvPaymentId } = req.params

    const { Items } = await dynamo.send(new QueryCommand({
      TableName: TABLES.transactions,
      IndexName: 'kurv_payment_id-index',
      KeyConditionExpression: 'kurv_payment_id = :kpid',
      ExpressionAttributeValues: { ':kpid': kurvPaymentId },
    }))

    const txn = Items?.[0]
    if (!txn) return res.status(404).send(errorPage('Transaction not found'))
    if (txn.status !== 'pending') return res.send(successPage(txn.amount))

    const merchantResult = await dynamo.send(new GetCommand({
      TableName: TABLES.merchants,
      Key: { id: txn.merchant_id },
    }))

    const merchant = merchantResult.Item
    const name = merchant?.branding_mode === 'merchant' ? merchant.business_name : 'Blind Billing'
    res.send(checkoutPage(kurvPaymentId, txn.amount, txn.currency, txn.reference, name))
  } catch (err) {
    console.error('[checkout]', err)
    res.status(500).send(errorPage('Something went wrong'))
  }
})

app.post('/kurv/checkout/:kurvPaymentId', async (req, res) => {
  try {
    const { kurvPaymentId } = req.params

    const { Items } = await dynamo.send(new QueryCommand({
      TableName: TABLES.transactions,
      IndexName: 'kurv_payment_id-index',
      KeyConditionExpression: 'kurv_payment_id = :kpid',
      ExpressionAttributeValues: { ':kpid': kurvPaymentId },
    }))

    const txn = Items?.[0]
    if (!txn) return res.status(404).send(errorPage('Transaction not found'))
    if (txn.status !== 'pending') return res.send(successPage(txn.amount))

    // Derive card info from form
    const cardNum = String(req.body.card_number || '4242424242424242').replace(/\s/g, '')
    const last4 = cardNum.slice(-4)
    const first = cardNum[0]
    const brand = first === '4' ? 'Visa' : first === '5' ? 'Mastercard' : first === '3' ? 'Amex' : 'Discover'

    // Simulate Kurv calling back to our webhook
    await fetch(`http://localhost:${PORT}/webhooks/${txn.merchant_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: kurvPaymentId,
        status: 'paid',
        amount: txn.amount,
        currency: txn.currency,
        card_brand: brand,
        card_last4: last4,
        reference_number: txn.reference,
        paid_at: new Date().toISOString(),
      }),
    })

    res.send(successPage(txn.amount))
  } catch (err) {
    console.error('[checkout-pay]', err)
    res.status(500).send(errorPage('Payment processing failed'))
  }
})

// ── HTML Templates ────────────────────────────────────────────────────
function checkoutPage(kurvId: string, amount: number, currency: string, ref: string | null, merchant: string) {
  return `<!DOCTYPE html><html><head>
<title>Pay ${merchant}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0c0a14;color:#f0eef5;font-family:-apple-system,system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
.c{max-width:420px;width:100%;margin:20px;background:#13111c;border:1px solid #2d2940;border-radius:16px;padding:32px}
.brand{text-align:center;margin-bottom:24px;font-size:18px;font-weight:500;color:#a09bb8}
.amt{text-align:center;font-size:36px;font-weight:700;margin-bottom:8px;background:linear-gradient(135deg,#9333ea,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.ref{text-align:center;font-size:12px;color:#6b6580;margin-bottom:24px}
label{display:block;font-size:12px;color:#a09bb8;margin-bottom:6px;margin-top:16px}
input{width:100%;background:#0c0a14;border:1px solid #2d2940;border-radius:8px;padding:12px 14px;font-size:14px;color:#f0eef5;outline:none}
input:focus{border-color:#9333ea}
.row{display:flex;gap:12px}.row>div{flex:1}
button{width:100%;margin-top:24px;padding:14px;border:none;border-radius:8px;background:linear-gradient(135deg,#9333ea,#7c3aed);color:#fff;font-size:16px;font-weight:600;cursor:pointer}
button:hover{opacity:.9}
.sec{text-align:center;font-size:11px;color:#6b6580;margin-top:16px}
.pow{text-align:center;font-size:10px;color:#6b6580;margin-top:20px;padding-top:16px;border-top:1px solid #2d2940}
</style></head><body>
<div class="c">
<div class="brand">${merchant}</div>
<div class="amt">$${Number(amount).toFixed(2)} ${currency}</div>
${ref ? `<div class="ref">Ref: ${ref}</div>` : ''}
<form method="POST">
<label>Card number</label>
<input name="card_number" placeholder="4242 4242 4242 4242" value="4242424242424242" required>
<div class="row"><div><label>Expiry</label><input name="expiry" placeholder="MM/YY" value="12/28" required></div>
<div><label>CVV</label><input name="cvv" placeholder="123" value="123" required></div></div>
<label>Cardholder name</label>
<input name="cardholder" placeholder="Jane Smith" value="Test Customer" required>
<button type="submit">Pay $${Number(amount).toFixed(2)}</button>
</form>
<div class="sec">Card data never reaches the merchant.</div>
<div class="pow">Powered by Kurv (Sandbox)</div>
</div></body></html>`
}

function successPage(amount: number) {
  return `<!DOCTYPE html><html><head>
<title>Payment Complete</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0c0a14;color:#f0eef5;font-family:-apple-system,system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
.s{max-width:420px;width:100%;margin:20px;background:#13111c;border:1px solid #2d2940;border-radius:16px;padding:48px 32px;text-align:center}
.chk{width:64px;height:64px;background:rgba(34,197,94,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:28px}
h1{font-size:24px;margin-bottom:8px}
.amt{font-size:18px;color:#a09bb8;margin-bottom:24px}
</style></head><body>
<div class="s">
<div class="chk">✓</div>
<h1>Payment Successful</h1>
<div class="amt">$${Number(amount).toFixed(2)}</div>
<p style="color:#6b6580;font-size:13px">You can close this window.</p>
</div></body></html>`
}

function errorPage(msg: string) {
  return `<!DOCTYPE html><html><head><title>Error</title>
<style>body{background:#0c0a14;color:#f0eef5;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh}
.e{background:#13111c;border:1px solid #2d2940;border-radius:16px;padding:48px;text-align:center}
h1{color:#ef4444;margin-bottom:8px}</style></head><body>
<div class="e"><h1>Error</h1><p>${msg}</p></div></body></html>`
}

// ── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('')
  console.log('  \x1b[35m●\x1b[0m Blind Billing API')
  console.log(`  ➜ API:      http://localhost:${PORT}`)
  console.log(`  ➜ Checkout: http://localhost:${PORT}/kurv/checkout/:id`)
  console.log('')
})
