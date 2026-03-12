import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

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
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMerchant(null)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setMerchant(data as Merchant | null)
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
