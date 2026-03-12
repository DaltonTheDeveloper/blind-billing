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

class BlindBillingAPI {
  private getKey(): string {
    return localStorage.getItem('bb_api_key') || ''
  }

  private getAuthToken(): string {
    const raw = localStorage.getItem('sb-vmijjzvizuokvemyiovq-auth-token')
    if (!raw) return ''
    try {
      const parsed = JSON.parse(raw)
      return parsed?.access_token || ''
    } catch {
      return ''
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Blind-Billing-Key': this.getKey(),
      ...((options.headers as Record<string, string>) || {}),
    }

    const authToken = this.getAuthToken()
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (res.status === 401) {
      localStorage.removeItem('bb_api_key')
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
}

export const api = new BlindBillingAPI()
