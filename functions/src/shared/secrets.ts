import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const cache = new Map<string, string>();

export async function getSecret(name: string): Promise<string> {
  const key = `/blind-billing/${name}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const res = await client.send(new GetSecretValueCommand({ SecretId: key }));
    const value = res.SecretString ?? "";
    cache.set(key, value);
    return value;
  } catch {
    const envVal = process.env[name.toUpperCase().replace(/-/g, "_")];
    if (envVal) return envVal;
    throw new Error(`Secret ${key} not found`);
  }
}
