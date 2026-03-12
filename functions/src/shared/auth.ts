import bcrypt from "bcryptjs";
import crypto from "crypto";
import { dynamo, TABLES, ScanCommand, QueryCommand } from "./dynamo.js";

export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  email: string;
  plan: string;
  branding_mode: "blind" | "merchant";
  kurv_template_blind: number;
  kurv_template_own: number;
  webhook_url: string | null;
  active: boolean;
  api_key_hash: string;
  api_key_preview: string;
  monthly_volume?: number;
  transaction_count?: number;
  created_at?: string;
}

export async function validateApiKey(key: string): Promise<Merchant | null> {
  if (!key || !key.startsWith("bb_live_")) return null;

  const result = await dynamo.send(new ScanCommand({
    TableName: TABLES.merchants,
    FilterExpression: "active = :active",
    ExpressionAttributeValues: { ":active": true },
  }));

  if (!result.Items) return null;

  for (const m of result.Items) {
    const match = await bcrypt.compare(key, m.api_key_hash);
    if (match) return m as unknown as Merchant;
  }
  return null;
}

export function generateApiKey(): { key: string; hash: string; preview: string } {
  const raw = crypto.randomBytes(24).toString("hex");
  const key = `bb_live_${raw}`;
  const hash = bcrypt.hashSync(key, 12);
  const preview = `bb_live_...${key.slice(-4)}`;
  return { key, hash, preview };
}

export async function validateToken(authHeader: string): Promise<{ sub: string; email: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  try {
    // Decode JWT payload (middle part)
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url decode the payload
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));

    if (process.env.NODE_ENV === "production") {
      // In production, verify against Cognito JWKS
      // Check issuer matches Cognito User Pool
      const issuer = decoded.iss;
      if (!issuer || !issuer.includes("cognito-idp")) return null;

      // Check token expiry
      if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;

      // TODO: Full JWKS signature verification for production
      // For now, validate issuer and expiry
    }

    if (!decoded.sub) return null;

    return {
      sub: decoded.sub,
      email: decoded.email || "",
    };
  } catch {
    return null;
  }
}
