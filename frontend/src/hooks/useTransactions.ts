import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!merchantId) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (err) {
      setError(err.message)
    } else {
      setTransactions((data || []) as Transaction[])
    }
    setLoading(false)
  }, [merchantId])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    if (!merchantId) return

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `merchant_id=eq.${merchantId}`,
        },
        (payload) => {
          const newTxn = { ...payload.new, isNew: true } as Transaction
          setTransactions((prev) => [newTxn, ...prev])
          setTimeout(() => {
            setTransactions((prev) =>
              prev.map((t) => (t.id === newTxn.id ? { ...t, isNew: false } : t))
            )
          }, 2500)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `merchant_id=eq.${merchantId}`,
        },
        (payload) => {
          setTransactions((prev) =>
            prev.map((t) =>
              t.id === payload.new.id ? { ...payload.new, isNew: true } as Transaction : t
            )
          )
          setTimeout(() => {
            setTransactions((prev) =>
              prev.map((t) => (t.id === payload.new.id ? { ...t, isNew: false } : t))
            )
          }, 2500)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [merchantId])

  return { transactions, loading, error, refetch: fetchTransactions }
}
