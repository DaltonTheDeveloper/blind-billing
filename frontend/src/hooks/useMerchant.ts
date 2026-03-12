import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { isAuthenticated } from '../lib/cognito'

interface Merchant {
  id: string
  business_name: string
  email: string
  plan: string
  branding_mode: 'blind' | 'merchant'
  webhook_url: string | null
  api_key_preview: string
  monthly_volume: number
  transaction_count: number
  created_at: string
}

export function useMerchant() {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMerchant = useCallback(async () => {
    if (!isAuthenticated() && !localStorage.getItem('bb_api_key')) {
      setMerchant(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await api.getMe() as Merchant
      setMerchant(data)
    } catch {
      setMerchant(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMerchant()
  }, [fetchMerchant])

  const update = async (updates: Record<string, unknown>) => {
    try {
      await api.updateMe(updates as Parameters<typeof api.updateMe>[0])
      await fetchMerchant()
    } catch (err) {
      throw err
    }
  }

  const rotateKey = async () => {
    const result = await api.rotateKey()
    await fetchMerchant()
    return result
  }

  return { merchant, loading, update, rotateKey, refetch: fetchMerchant }
}
