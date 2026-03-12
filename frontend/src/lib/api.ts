import { getIdToken, refreshSession, clearTokens } from './cognito'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

interface ChargePayload {
  amount: number
  currency?: string
  customer_name: string
  email?: string
  phone?: string
  reference?: string
  success_url?: string
  cancel_url?: string
  pre_auth?: boolean
  pass_surcharge?: boolean
}

interface ChargeResponse {
  payment_link: string
  qr_code: string
  payment_id: string
  expires_at: string
  cached?: boolean
}

interface MerchantSetupPayload {
  business_name: string
  email: string
  webhook_url?: string
  branding_mode?: 'blind' | 'merchant'
}

interface Transaction {
  id: string
  merchant_id: string
  reference: string | null
  payment_id: string
  kurv_payment_id: string | null
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  payment_link: string | null
  qr_code_url: string | null
  card_brand: string | null
  card_last4: string | null
  created_at: string
  settled_at: string | null
}

class BlindBillingAPI {
  private getKey(): string {
    return localStorage.getItem('bb_api_key') || ''
  }

  private async getAuthToken(): Promise<string> {
    let token = getIdToken()
    if (!token) {
      token = await refreshSession()
    }
    return token || ''
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Blind-Billing-Key': this.getKey(),
      ...((options.headers as Record<string, string>) || {}),
    }

    const authToken = await this.getAuthToken()
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (res.status === 401) {
      clearTokens()
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'API Error')
    return data as T
  }

  async charge(payload: ChargePayload): Promise<ChargeResponse> {
    return this.request('/v1/charge', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async getPayment(id: string) {
    return this.request(`/v1/payments/${id}`)
  }

  async setupMerchant(data: MerchantSetupPayload) {
    return this.request('/v1/merchants', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMe() {
    return this.request('/v1/merchants/me')
  }

  async updateMe(data: Partial<MerchantSetupPayload>) {
    return this.request('/v1/merchants/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async rotateKey() {
    return this.request<{ key: string; preview: string }>('/v1/merchants/rotate-key', {
      method: 'POST',
    })
  }

  async mockPay(paymentId: string) {
    return this.request(`/v1/mock-pay/${paymentId}`, {
      method: 'POST',
    })
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.request<Transaction[]>('/v1/transactions')
  }
}

export const api = new BlindBillingAPI()
