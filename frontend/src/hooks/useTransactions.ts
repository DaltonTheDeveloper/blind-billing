import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'

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
  isNew?: boolean
}

export function useTransactions(merchantId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const prevIds = useRef<Set<string>>(new Set())

  const fetchTransactions = useCallback(async () => {
    if (!merchantId) return
    try {
      const data = await api.getTransactions()
      // Mark new transactions
      const newTxns = data.map((t) => ({
        ...t,
        isNew: !prevIds.current.has(t.id) && prevIds.current.size > 0,
      }))
      setTransactions(newTxns)
      prevIds.current = new Set(data.map((t) => t.id))
      // Clear isNew after animation
      if (newTxns.some((t) => t.isNew)) {
        setTimeout(() => {
          setTransactions((prev) => prev.map((t) => ({ ...t, isNew: false })))
        }, 2500)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [merchantId])

  useEffect(() => {
    fetchTransactions()
    const interval = setInterval(fetchTransactions, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [fetchTransactions])

  return { transactions, loading, error: null, refetch: fetchTransactions }
}
