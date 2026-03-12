import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const cache = new Map<string, string>();

export async function getSecret(name: string): Promise<string> {
  const envKey = name.toUpperCase().replace(/-/g, "_");
  const cacheKey = `/blind-billing/${name}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  // In development, skip AWS Secrets Manager entirely
  if (process.env.NODE_ENV !== 'production') {
    const envVal = process.env[envKey];
    if (envVal) {
      cache.set(cacheKey, envVal);
      return envVal;
    }
    throw new Error(`Secret ${cacheKey} not found — set ${envKey} in your .env`);
  }

  try {
    const res = await client.send(new GetSecretValueCommand({ SecretId: cacheKey }));
    const value = res.SecretString ?? "";
    cache.set(cacheKey, value);
    return value;
  } catch {
    const envVal = process.env[envKey];
    if (envVal) return envVal;
    throw new Error(`Secret ${cacheKey} not found`);
  }
}
