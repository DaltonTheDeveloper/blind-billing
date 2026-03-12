import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getSupabaseClient } from "../shared/supabase.js";
import { kurvClient } from "../shared/kurv.js";
import { getSecret } from "../shared/secrets.js";
import { forwardWebhook } from "../shared/webhook.js";

function res(status: number, body: object) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const path = event.rawPath || event.requestContext?.http?.path || "";

  // Mock pay endpoint: POST /v1/mock-pay/:paymentId
  if (path.includes("/mock-pay/")) {
    const paymentId = path.split("/mock-pay/")[1];
    if (!paymentId) return res(400, { error: "Missing payment ID" });

    const db = await getSupabaseClient();
    const { data: txn } = await db
      .from("transactions")
      .select("*")
      .eq("payment_id", paymentId)
      .single();

    if (!txn) return res(404, { error: "Transaction not found" });
    if (txn.status !== "pending") return res(400, { error: `Transaction is already ${txn.status}` });

    const webhook = kurvClient.generateMockWebhook(
      txn.kurv_payment_id || "kurv_mock",
      Number(txn.amount),
      txn.reference || ""
    );

    await db
      .from("transactions")
      .update({
        status: "paid",
        card_brand: webhook.card_brand,
        card_last4: webhook.card_last4,
        settled_at: new Date().toISOString(),
      })
      .eq("payment_id", paymentId);

    await db.from("audit_log").insert({
      merchant_id: txn.merchant_id,
      action: "payment.mock_paid",
      lambda_fn: "webhook",
      status_code: 200,
      metadata: { payment_id: paymentId, amount: txn.amount }
    });

    // Forward to merchant webhook if configured
    const { data: merchant } = await db
      .from("merchants")
      .select("webhook_url")
      .eq("id", txn.merchant_id)
      .single();

    if (merchant?.webhook_url) {
      const secret = await getSecret("webhook-signing-secret").catch(() => "dev-secret");
      await forwardWebhook(merchant.webhook_url, {
        event: "payment.completed",
        payment_id: paymentId,
        reference: txn.reference,
        amount: txn.amount,
        currency: txn.currency,
        status: "paid",
        card_brand: webhook.card_brand,
        card_last4: webhook.card_last4,
      }, secret);
    }

    return res(200, { status: "paid", payment_id: paymentId });
  }

  // Kurv webhook endpoint: POST /webhooks/:merchantId
  const merchantId = event.pathParameters?.merchantId;
  if (!merchantId) return res(400, { error: "Missing merchant ID" });

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body ?? "{}"); }
  catch { return res(400, { error: "Invalid JSON" }); }

  const kurvPaymentId = String(body.payment_id || "");
  const status = String(body.status || "");

  if (!kurvPaymentId) return res(400, { error: "Missing payment_id" });

  const db = await getSupabaseClient();
  const { data: txn } = await db
    .from("transactions")
    .select("*")
    .eq("kurv_payment_id", kurvPaymentId)
    .single();

  if (!txn) return res(404, { error: "Transaction not found" });
  if (txn.status !== "pending") return res(200, { message: "Already processed" });

  const newStatus = status === "paid" ? "paid" : status === "failed" ? "failed" : "cancelled";

  await db
    .from("transactions")
    .update({
      status: newStatus,
      card_brand: body.card_brand ? String(body.card_brand) : null,
      card_last4: body.card_last4 ? String(body.card_last4) : null,
      settled_at: newStatus === "paid" ? new Date().toISOString() : null,
    })
    .eq("kurv_payment_id", kurvPaymentId);

  await db.from("audit_log").insert({
    merchant_id: merchantId,
    action: `payment.${newStatus}`,
    lambda_fn: "webhook",
    status_code: 200,
    metadata: { kurv_payment_id: kurvPaymentId, status: newStatus }
  });

  return res(200, { received: true });
};
