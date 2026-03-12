import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createClient } from "@supabase/supabase-js";
import { generateApiKey, validateApiKey } from "../shared/auth.js";
import { getSupabaseClient } from "../shared/supabase.js";

function res(status: number, body: object) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

async function getUserFromToken(authHeader: string) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const url = process.env.SUPABASE_URL ?? "https://vmijjzvizuokvemyiovq.supabase.co";
  const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
  const client = createClient(url, anonKey);
  const { data } = await client.auth.getUser(token);
  return data?.user ?? null;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const method = event.requestContext?.http?.method ?? "GET";
  const path = event.rawPath || "";

  // POST /v1/merchants — create merchant
  if (method === "POST" && path.endsWith("/merchants")) {
    const user = await getUserFromToken(event.headers?.authorization ?? "");
    if (!user) return res(401, { error: "Authentication required" });

    let body: Record<string, unknown>;
    try { body = JSON.parse(event.body ?? "{}"); }
    catch { return res(400, { error: "Invalid JSON" }); }

    if (!body.business_name) return res(422, { error: "business_name is required" });

    const db = await getSupabaseClient();

    // Check if merchant already exists
    const { data: existing } = await db
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (existing) return res(409, { error: "Merchant already exists" });

    const { key, hash, preview } = generateApiKey();

    const { data: merchant, error } = await db
      .from("merchants")
      .insert({
        user_id: user.id,
        business_name: String(body.business_name),
        email: String(body.email || user.email || ""),
        webhook_url: body.webhook_url ? String(body.webhook_url) : null,
        branding_mode: body.branding_mode === "merchant" ? "merchant" : "blind",
        api_key_hash: hash,
        api_key_preview: preview,
      })
      .select()
      .single();

    if (error) return res(500, { error: "Failed to create merchant" });

    await db.from("audit_log").insert({
      merchant_id: merchant.id,
      action: "merchant.created",
      lambda_fn: "merchant",
      status_code: 200,
      metadata: { business_name: merchant.business_name }
    });

    return res(200, {
      merchant_id: merchant.id,
      api_key: key,
      api_key_preview: preview,
      business_name: merchant.business_name,
    });
  }

  // POST /v1/merchants/rotate-key
  if (method === "POST" && path.endsWith("/rotate-key")) {
    const bbKey = event.headers?.["x-blind-billing-key"] ?? "";
    const merchant = await validateApiKey(bbKey);
    if (!merchant) return res(401, { error: "Invalid API key" });

    const { key, hash, preview } = generateApiKey();
    const db = await getSupabaseClient();

    await db
      .from("merchants")
      .update({ api_key_hash: hash, api_key_preview: preview })
      .eq("id", merchant.id);

    await db.from("audit_log").insert({
      merchant_id: merchant.id,
      action: "merchant.key_rotated",
      lambda_fn: "merchant",
      status_code: 200,
      metadata: {}
    });

    return res(200, { key, preview });
  }

  // GET /v1/merchants/me
  if (method === "GET" && path.endsWith("/me")) {
    const bbKey = event.headers?.["x-blind-billing-key"] ?? "";
    const user = await getUserFromToken(event.headers?.authorization ?? "");

    let merchant = null;
    if (bbKey) {
      merchant = await validateApiKey(bbKey);
    } else if (user) {
      const db = await getSupabaseClient();
      const { data } = await db
        .from("merchants")
        .select("*")
        .eq("user_id", user.id)
        .single();
      merchant = data;
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

    const updates: Record<string, unknown> = {};
    if (body.business_name) updates.business_name = String(body.business_name);
    if (body.webhook_url !== undefined) updates.webhook_url = body.webhook_url ? String(body.webhook_url) : null;
    if (body.branding_mode === "blind" || body.branding_mode === "merchant") {
      updates.branding_mode = body.branding_mode;
    }

    if (Object.keys(updates).length === 0) return res(400, { error: "No valid fields to update" });

    const db = await getSupabaseClient();
    await db.from("merchants").update(updates).eq("id", merchant.id);

    await db.from("audit_log").insert({
      merchant_id: merchant.id,
      action: "merchant.updated",
      lambda_fn: "merchant",
      status_code: 200,
      metadata: { fields: Object.keys(updates) }
    });

    return res(200, { updated: true });
  }

  return res(405, { error: "Method not allowed" });
};
