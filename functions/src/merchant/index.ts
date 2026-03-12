import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import crypto from "crypto";
import { generateApiKey, validateApiKey, validateToken } from "../shared/auth.js";
import { dynamo, TABLES, PutCommand, QueryCommand, UpdateCommand } from "../shared/dynamo.js";

function res(status: number, body: object) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const method = event.requestContext?.http?.method ?? "GET";
  const path = event.rawPath || "";

  // POST /v1/merchants — create merchant
  if (method === "POST" && path.endsWith("/merchants")) {
    const user = await validateToken(event.headers?.authorization ?? "");
    if (!user) return res(401, { error: "Authentication required" });

    let body: Record<string, unknown>;
    try { body = JSON.parse(event.body ?? "{}"); }
    catch { return res(400, { error: "Invalid JSON" }); }

    if (!body.business_name) return res(422, { error: "business_name is required" });

    // Check if merchant already exists (query user_id-index)
    const { Items: existing } = await dynamo.send(new QueryCommand({
      TableName: TABLES.merchants,
      IndexName: "user_id-index",
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: { ":uid": user.sub },
    }));
    if (existing && existing.length > 0) return res(409, { error: "Merchant already exists" });

    const { key, hash, preview } = generateApiKey();
    const merchantId = crypto.randomUUID();
    const now = new Date().toISOString();

    const merchantItem = {
      id: merchantId,
      user_id: user.sub,
      business_name: String(body.business_name),
      email: String(body.email || user.email || ""),
      webhook_url: body.webhook_url ? String(body.webhook_url) : null,
      branding_mode: body.branding_mode === "merchant" ? "merchant" : "blind",
      api_key_hash: hash,
      api_key_preview: preview,
      plan: "free",
      active: true,
      kurv_template_blind: 1,
      kurv_template_own: 2,
      created_at: now,
    };

    await dynamo.send(new PutCommand({
      TableName: TABLES.merchants,
      Item: merchantItem,
    }));

    await dynamo.send(new PutCommand({
      TableName: TABLES.audit,
      Item: {
        id: crypto.randomUUID(),
        merchant_id: merchantId,
        action: "merchant.created",
        lambda_fn: "merchant",
        status_code: 200,
        metadata: { business_name: merchantItem.business_name },
        created_at: now,
      },
    }));

    return res(200, {
      merchant_id: merchantId,
      api_key: key,
      api_key_preview: preview,
      business_name: merchantItem.business_name,
    });
  }

  // POST /v1/merchants/rotate-key
  if (method === "POST" && path.endsWith("/rotate-key")) {
    const bbKey = event.headers?.["x-blind-billing-key"] ?? "";
    const merchant = await validateApiKey(bbKey);
    if (!merchant) return res(401, { error: "Invalid API key" });

    const { key, hash, preview } = generateApiKey();

    await dynamo.send(new UpdateCommand({
      TableName: TABLES.merchants,
      Key: { id: merchant.id },
      UpdateExpression: "SET api_key_hash = :hash, api_key_preview = :preview",
      ExpressionAttributeValues: {
        ":hash": hash,
        ":preview": preview,
      },
    }));

    await dynamo.send(new PutCommand({
      TableName: TABLES.audit,
      Item: {
        id: crypto.randomUUID(),
        merchant_id: merchant.id,
        action: "merchant.key_rotated",
        lambda_fn: "merchant",
        status_code: 200,
        metadata: {},
        created_at: new Date().toISOString(),
      },
    }));

    return res(200, { key, preview });
  }

  // GET /v1/merchants/me
  if (method === "GET" && path.endsWith("/me")) {
    const bbKey = event.headers?.["x-blind-billing-key"] ?? "";
    const user = await validateToken(event.headers?.authorization ?? "");

    let merchant = null;
    if (bbKey) {
      merchant = await validateApiKey(bbKey);
    } else if (user) {
      const { Items } = await dynamo.send(new QueryCommand({
        TableName: TABLES.merchants,
        IndexName: "user_id-index",
        KeyConditionExpression: "user_id = :uid",
        ExpressionAttributeValues: { ":uid": user.sub },
      }));
      merchant = Items?.[0] || null;
    }

    if (!merchant) return res(404, { error: "Merchant not found" });

    return res(200, {
      id: merchant.id,
      business_name: merchant.business_name,
      email: merchant.email,
      plan: merchant.plan,
      branding_mode: merchant.branding_mode,
      webhook_url: merchant.webhook_url,
      api_key_preview: merchant.api_key_preview,
      monthly_volume: merchant.monthly_volume,
      transaction_count: merchant.transaction_count,
      created_at: merchant.created_at,
    });
  }

  // PATCH /v1/merchants/me
  if (method === "PATCH" && path.endsWith("/me")) {
    const bbKey = event.headers?.["x-blind-billing-key"] ?? "";
    const merchant = await validateApiKey(bbKey);
    if (!merchant) return res(401, { error: "Invalid API key" });

    let body: Record<string, unknown>;
    try { body = JSON.parse(event.body ?? "{}"); }
    catch { return res(400, { error: "Invalid JSON" }); }

    const updateExpressions: string[] = [];
    const expressionValues: Record<string, unknown> = {};

    if (body.business_name) {
      updateExpressions.push("business_name = :bname");
      expressionValues[":bname"] = String(body.business_name);
    }
    if (body.webhook_url !== undefined) {
      updateExpressions.push("webhook_url = :wurl");
      expressionValues[":wurl"] = body.webhook_url ? String(body.webhook_url) : null;
    }
    if (body.branding_mode === "blind" || body.branding_mode === "merchant") {
      updateExpressions.push("branding_mode = :bmode");
      expressionValues[":bmode"] = body.branding_mode;
    }

    if (updateExpressions.length === 0) return res(400, { error: "No valid fields to update" });

    await dynamo.send(new UpdateCommand({
      TableName: TABLES.merchants,
      Key: { id: merchant.id },
      UpdateExpression: "SET " + updateExpressions.join(", "),
      ExpressionAttributeValues: expressionValues,
    }));

    await dynamo.send(new PutCommand({
      TableName: TABLES.audit,
      Item: {
        id: crypto.randomUUID(),
        merchant_id: merchant.id,
        action: "merchant.updated",
        lambda_fn: "merchant",
        status_code: 200,
        metadata: { fields: updateExpressions.map(e => e.split(" = ")[0]) },
        created_at: new Date().toISOString(),
      },
    }));

    return res(200, { updated: true });
  }

  return res(405, { error: "Method not allowed" });
};
