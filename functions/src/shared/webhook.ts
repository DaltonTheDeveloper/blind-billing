import crypto from "crypto";

export function signPayload(payload: string, secret: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret);
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function forwardWebhook(
  url: string,
  payload: object,
  signingSecret: string
): Promise<void> {
  const body = JSON.stringify(payload);
  const sig = signPayload(body, signingSecret);
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BlindBilling-Signature": sig,
        "X-BlindBilling-Version": "1.0"
      },
      body,
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    console.log(`[webhook] Forward to ${url} failed`);
  }
}
