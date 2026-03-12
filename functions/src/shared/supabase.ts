import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSecret } from "./secrets.js";

let _client: SupabaseClient | null = null;

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL ?? "https://vmijjzvizuokvemyiovq.supabase.co";
  const key = await getSecret("supabase-service-key").catch(
    () => process.env.SUPABASE_SERVICE_KEY ?? ""
  );
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _client;
}
