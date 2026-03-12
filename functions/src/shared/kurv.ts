export interface KurvChargePayload {
  amount: number;
  currency: string;
  customer_first_name: string;
  customer_last_name: string;
  email?: string;
  mobile_number?: string;
  reference_number: string;
  merchant_id: string;
  branding_mode: "blind" | "merchant";
  template_id: number;
  redirect_url?: string;
  cancel_url?: string;
  payment_type: "DB" | "PA";
  payment_frequency: string;
  surcharge_fee_enabled: boolean;
  expiry_date: string;
  response_url: string;
}

export interface KurvChargeResponse {
  payment_id: string;
  payment_link: string;
  qrcode_link: string;
  status: "pending";
  amount: number;
  currency: string;
  expiry_date: string;
}

export interface KurvWebhookPayload {
  payment_id: string;
  reference_number: string;
  status: "paid" | "failed" | "cancelled";
  amount: number;
  currency: string;
  card_brand: string;
  card_last4: string;
  paid_at: string;
}

function mockKurvId(): string {
  return "kurv_" + Math.random().toString(36).slice(2, 18).toUpperCase();
}

const CHECKOUT_BASE = process.env.CHECKOUT_BASE_URL || 'http://localhost:3001/kurv';

function mockPaymentLink(kurvId: string, amount: number): string {
  return `${CHECKOUT_BASE}/checkout/${kurvId}?amount=${amount}&bb=true`;
}

function mockQrCode(link: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
}

export class MockKurvClient {
  async createPaymentRequest(payload: KurvChargePayload): Promise<KurvChargeResponse> {
    await new Promise(r => setTimeout(r, 150 + Math.random() * 100));
    const kurvId = mockKurvId();
    const link = mockPaymentLink(kurvId, payload.amount);
    return {
      payment_id: kurvId,
      payment_link: link,
      qrcode_link: mockQrCode(link),
      status: "pending",
      amount: payload.amount,
      currency: payload.currency,
      expiry_date: payload.expiry_date
    };
  }

  generateMockWebhook(kurvPaymentId: string, amount: number, reference: string): KurvWebhookPayload {
    const brands = ["Visa", "Mastercard", "Amex", "Discover"];
    return {
      payment_id: kurvPaymentId,
      reference_number: reference,
      status: "paid",
      amount,
      currency: "USD",
      card_brand: brands[Math.floor(Math.random() * brands.length)],
      card_last4: String(Math.floor(1000 + Math.random() * 9000)),
      paid_at: new Date().toISOString()
    };
  }
}

export const kurvClient = new MockKurvClient();

export function buildKurvPayload(params: {
  amount: number;
  currency: string;
  customerName: string;
  email?: string;
  phone?: string;
  reference: string;
  merchantId: string;
  brandingMode: "blind" | "merchant";
  templateBlind: number;
  templateOwn: number;
  successUrl?: string;
  cancelUrl?: string;
  preAuth?: boolean;
  recurring?: { frequency: string; start_date?: string; total_payments?: number };
  passSurcharge?: boolean;
  webhookBase: string;
}): KurvChargePayload {
  const [firstName, ...rest] = (params.customerName ?? "Customer").split(" ");
  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 16).replace("T", " ");

  return {
    amount: params.amount,
    currency: params.currency ?? "USD",
    customer_first_name: firstName,
    customer_last_name: rest.join(" ") || "",
    email: params.email,
    mobile_number: params.phone,
    reference_number: params.reference,
    merchant_id: params.merchantId,
    branding_mode: params.brandingMode,
    template_id: params.brandingMode === "blind" ? params.templateBlind : params.templateOwn,
    redirect_url: params.successUrl,
    cancel_url: params.cancelUrl,
    payment_type: params.preAuth ? "PA" : "DB",
    payment_frequency: params.recurring?.frequency ?? "ONE-TIME",
    surcharge_fee_enabled: params.passSurcharge ?? true,
    expiry_date: expiryDate,
    response_url: `${params.webhookBase}/webhooks/${params.merchantId}`
  };
}
