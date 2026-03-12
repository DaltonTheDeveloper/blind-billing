import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getSupabaseClient } from "./supabase.js";

export interface Merchant {
  id: string;
  business_name: string;
  email: string;
  plan: string;
  branding_mode: "blind" | "merchant";
  kurv_template_blind: number;
  kurv_template_own: number;
  webhook_url: string | null;
  active: boolean;
}

export async function validateApiKey(key: string): Promise<Merchant | null> {
  if (!key || !key.startsWith("bb_live_")) return null;
  const db = await getSupabaseClient();
  const { data: merchants } = await db
    .from("merchants")
    .select("*")
    .eq("active", true);
  if (!merchants) return null;
  for (const m of merchants) {
    const match = await bcrypt.compare(key, m.api_key_hash);
    if (match) return m as Merchant;
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
