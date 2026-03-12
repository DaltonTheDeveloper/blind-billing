import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { validateApiKey } from "../shared/auth.js";
import { dynamo, TABLES, QueryCommand } from "../shared/dynamo.js";

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

  const path = event.rawPath || "";

  // GET /v1/transactions — list transactions for merchant
  if (path.endsWith("/transactions")) {
    const { Items } = await dynamo.send(new QueryCommand({
      TableName: TABLES.transactions,
      IndexName: "merchant_id-created_at-index",
      KeyConditionExpression: "merchant_id = :mid",
      ExpressionAttributeValues: { ":mid": merchant.id },
      ScanIndexForward: false,
      Limit: 50,
    }));

    const transactions = (Items || []).map((txn) => ({
      payment_id: txn.payment_id,
      reference: txn.reference,
      amount: txn.amount,
      currency: txn.currency,
      status: txn.status,
      card_brand: txn.card_brand,
      card_last4: txn.card_last4,
      created_at: txn.created_at,
      settled_at: txn.settled_at,
      payment_link: txn.payment_link,
      qr_code_url: txn.qr_code_url,
    }));

    return res(200, { transactions });
  }

  // GET /v1/payments/:id — lookup single payment
  const paymentId = event.pathParameters?.id;
  if (!paymentId) return res(400, { error: "Missing payment ID" });

  const { Items } = await dynamo.send(new QueryCommand({
    TableName: TABLES.transactions,
    IndexName: "payment_id-index",
    KeyConditionExpression: "payment_id = :pid",
    ExpressionAttributeValues: { ":pid": paymentId },
  }));

  const txn = Items?.[0];
  if (!txn || txn.merchant_id !== merchant.id) return res(404, { error: "Transaction not found" });

  return res(200, {
    payment_id: txn.payment_id,
    reference: txn.reference,
    amount: txn.amount,
    currency: txn.currency,
    status: txn.status,
    card_brand: txn.card_brand,
    card_last4: txn.card_last4,
    created_at: txn.created_at,
    settled_at: txn.settled_at,
    payment_link: txn.payment_link,
    qr_code_url: txn.qr_code_url,
  });
};
