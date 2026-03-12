import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import crypto from "crypto";
import { validateApiKey } from "../shared/auth.js";
import { getSupabaseClient } from "../shared/supabase.js";
import { kurvClient, buildKurvPayload } from "../shared/kurv.js";

const WEBHOOK_BASE = process.env.WEBHOOK_BASE_URL ?? "http://localhost:3001";
const MAX_AMOUNT = 50_000;
const ALLOWED_CURRENCIES = new Set(["USD", "CAD", "GBP", "EUR", "AUD"]);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const bbKey = event.headers?.["x-blind-billing-key"] ?? "";
  const idempotencyKey = event.headers?.["x-idempotency-key"] ?? "";

  const merchant = await validateApiKey(bbKey);
  if (!merchant) return res(401, { error: "Invalid API key" });

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body ?? "{}"); }
  catch { return res(400, { error: "Invalid JSON body" }); }

  const missing: string[] = [];
  if (!body.amount) missing.push("amount");
  if (!body.currency) missing.push("currency");
  if (!body.customer_name) missing.push("customer_name");
  if (missing.length) return res(422, { error: "Missing required fields", missing_fields: missing });

  const amount = Number(body.amount);
  const currency = String(body.currency).toUpperCase();

  if (isNaN(amount) || amount <= 0) return res(422, { error: "amount must be a positive number" });
  if (amount > MAX_AMOUNT) return res(422, { error: `amount exceeds maximum of ${MAX_AMOUNT}` });
  if (!ALLOWED_CURRENCIES.has(currency)) return res(422, { error: `currency must be one of: ${[...ALLOWED_CURRENCIES].join(", ")}` });

  const db = await getSupabaseClient();

  if (idempotencyKey) {
    const { data: existing } = await db
      .from("transactions")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();
    if (existing) {
      return res(200, {
        payment_link: existing.payment_link,
        qr_code: existing.qr_code_url,
        payment_id: existing.payment_id,
        cached: true
      });
    }
  }

  const reference = body.reference ? String(body.reference) : null;
  if (reference) {
    const { data: dup } = await db
      .from("transactions")
      .select("id, status")
      .eq("merchant_id", merchant.id)
      .eq("reference", reference)
      .neq("status", "failed")
      .single();
    if (dup) return res(409, { error: `Reference '${reference}' already exists`, payment_id: dup.id });
  }

  const kurvPayload = buildKurvPayload({
    amount,
    currency,
    customerName: String(body.customer_name),
    email: body.email ? String(body.email) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    reference: reference ?? crypto.randomUUID(),
    merchantId: merchant.id,
    brandingMode: merchant.branding_mode,
    templateBlind: merchant.kurv_template_blind,
    templateOwn: merchant.kurv_template_own,
    successUrl: body.success_url ? String(body.success_url) : undefined,
    cancelUrl: body.cancel_url ? String(body.cancel_url) : undefined,
    preAuth: Boolean(body.pre_auth),
    passSurcharge: body.pass_surcharge !== false,
    webhookBase: WEBHOOK_BASE
  });

  let kurvResponse;
  try {
    kurvResponse = await kurvClient.createPaymentRequest(kurvPayload);
  } catch {
    const bbPaymentId = "bb_pay_" + crypto.randomBytes(8).toString("hex");
    await db.from("transactions").insert({
      merchant_id: merchant.id, reference, payment_id: bbPaymentId,
      amount, currency, status: "failed",
      idempotency_key: idempotencyKey || null
    });
    return res(502, { error: "Payment processor temporarily unavailable" });
  }

  const bbPaymentId = "bb_pay_" + crypto.randomBytes(8).toString("hex");

  await db.from("transactions").insert({
    merchant_id: merchant.id,
    reference,
    payment_id: bbPaymentId,
    kurv_payment_id: kurvResponse.payment_id,
    amount,
    currency,
    status: "pending",
    payment_link: kurvResponse.payment_link,
    qr_code_url: kurvResponse.qrcode_link,
    idempotency_key: idempotencyKey || null
  });

  await db.from("audit_log").insert({
    merchant_id: merchant.id,
    action: "charge.created",
    lambda_fn: "charge",
    status_code: 200,
    metadata: { payment_id: bbPaymentId, amount, currency, reference }
  });

  return res(200, {
    payment_link: kurvResponse.payment_link,
    qr_code: kurvResponse.qrcode_link,
    payment_id: bbPaymentId,
    expires_at: kurvResponse.expiry_date
  });
};

function res(status: number, body: object) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", "X-Powered-By": "BlindBilling/1.0" },
    body: JSON.stringify(body)
  };
}
