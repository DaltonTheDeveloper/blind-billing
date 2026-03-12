import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { validateApiKey } from "../shared/auth.js";
import { getSupabaseClient } from "../shared/supabase.js";

function res(status: number, body: object) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const bbKey = event.headers?.["x-blind-billing-key"] ?? "";
  const merchant = await validateApiKey(bbKey);
  if (!merchant) return res(401, { error: "Invalid API key" });

  const paymentId = event.pathParameters?.id;
  if (!paymentId) return res(400, { error: "Missing payment ID" });

  const db = await getSupabaseClient();
  const { data: txn } = await db
    .from("transactions")
    .select("payment_id, reference, amount, currency, status, card_brand, card_last4, created_at, settled_at, payment_link, qr_code_url")
    .eq("payment_id", paymentId)
    .eq("merchant_id", merchant.id)
    .single();

  if (!txn) return res(404, { error: "Transaction not found" });

  return res(200, txn);
};
