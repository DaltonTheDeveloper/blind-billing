import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Zap, Send } from 'lucide-react'
import { useMerchant } from '../hooks/useMerchant'
import { useTransactions } from '../hooks/useTransactions'
import StatCard from '../components/StatCard'
import TransactionRow from '../components/TransactionRow'
import { api } from '../lib/api'

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

function getDayLabel(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export default function Dashboard() {
  const { merchant } = useMerchant()
  const { transactions, loading } = useTransactions(merchant?.id)

  const [demoAmount, setDemoAmount] = useState('149.99')
  const [demoRef, setDemoRef] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`)
  const [demoName, setDemoName] = useState('Demo Customer')
  const [demoResult, setDemoResult] = useState<{ payment_id: string; payment_link: string } | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(true)

  const paidTxns = transactions.filter((t) => t.status === 'paid')
  const totalVolume = paidTxns.reduce((sum, t) => sum + Number(t.amount), 0)
  const successRate = transactions.length > 0
    ? Math.round((paidTxns.length / transactions.filter((t) => t.status !== 'failed').length) * 100)
    : 0

  // Chart data: last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i
    const dayStart = new Date()
    dayStart.setDate(dayStart.getDate() - daysAgo)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dayTxns = paidTxns.filter((t) => {
      const d = new Date(t.created_at)
      return d >= dayStart && d < dayEnd
    })
    return {
      day: getDayLabel(daysAgo),
      volume: dayTxns.reduce((s, t) => s + Number(t.amount), 0),
    }
  })

  const handleCreateCharge = async () => {
    setDemoLoading(true)
    setDemoResult(null)
    try {
      const result = await api.charge({
        amount: parseFloat(demoAmount),
        currency: 'USD',
        customer_name: demoName,
        reference: demoRef,
      })
      setDemoResult(result)
      setDemoRef(`ORD-${Math.floor(1000 + Math.random() * 9000)}`)
    } catch (err) {
      console.error(err)
    }
    setDemoLoading(false)
  }

  const handleMockPay = async () => {
    if (!demoResult) return
    setDemoLoading(true)
    try {
      await api.mockPay(demoResult.payment_id)
      setDemoResult(null)
    } catch (err) {
      console.error(err)
    }
    setDemoLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Volume This Month"
          value={totalVolume}
          prefix="$"
          subtitle="Direct T+1 settlement"
          isAnimated
        />
        <StatCard
          title="Transactions"
          value={transactions.length}
          isAnimated
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          isAnimated={false}
        />
        <StatCard
          title="Settlement"
          value="T+1"
          subtitle="Next batch tomorrow"
          isAnimated={false}
          accentColor="text-bb-lime"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Transactions Feed */}
        <div className="lg:col-span-3 glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-bb-border flex items-center gap-2">
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-bb-lime rounded-full"
            />
            <span className="text-sm font-medium text-bb-text">Live transactions</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-bb-muted text-sm">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-bb-muted text-sm">No transactions yet.</p>
                <p className="text-bb-muted text-xs mt-2">Make your first charge using the demo panel or the API.</p>
              </div>
            ) : (
              <AnimatePresence>
                {transactions.slice(0, 20).map((txn) => (
                  <TransactionRow key={txn.id} txn={txn} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-4">
          <p className="text-sm font-medium text-bb-text mb-4">Volume — last 7 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fill: '#6b6f68', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6f68', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#141714', border: '1px solid #1f221e', borderRadius: 8, color: '#e2e4e0', fontSize: 12 }}
                cursor={{ fill: 'rgba(163,230,53,0.05)' }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Volume']}
              />
              <Bar dataKey="volume" fill="#a3e635" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demo Panel */}
      {MOCK_MODE && (
        <div className="glass-card border-bb-amber/30">
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="w-full px-4 py-3 flex items-center gap-2 text-left"
          >
            <Zap className="w-4 h-4 text-bb-amber" />
            <span className="text-sm font-medium text-bb-amber">Demo Mode</span>
            <span className="text-[10px] bg-bb-amber/10 text-bb-amber px-2 py-0.5 rounded-full">MOCK</span>
            <span className="ml-auto text-bb-muted text-xs">{showDemo ? 'Hide' : 'Show'}</span>
          </button>
          {showDemo && (
            <div className="px-4 pb-4 border-t border-bb-border/50 pt-4">
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-bb-muted mb-1">Amount</label>
                  <input
                    value={demoAmount}
                    onChange={(e) => setDemoAmount(e.target.value)}
                    className="w-full bg-bb-surface border border-bb-border rounded px-3 py-2 text-sm text-bb-text focus:outline-none focus:border-bb-lime/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-bb-muted mb-1">Reference</label>
                  <input
                    value={demoRef}
                    onChange={(e) => setDemoRef(e.target.value)}
                    className="w-full bg-bb-surface border border-bb-border rounded px-3 py-2 text-sm text-bb-text focus:outline-none focus:border-bb-lime/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-bb-muted mb-1">Customer</label>
                  <input
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    className="w-full bg-bb-surface border border-bb-border rounded px-3 py-2 text-sm text-bb-text focus:outline-none focus:border-bb-lime/50"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateCharge}
                  disabled={demoLoading}
                  className="btn-lime !py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Create Charge
                </button>
                {demoResult && (
                  <button
                    onClick={handleMockPay}
                    disabled={demoLoading}
                    className="btn-ghost !py-2 text-sm flex items-center gap-2 disabled:opacity-50 !border-bb-lime/30 !text-bb-lime"
                  >
                    Mark as Paid →
                  </button>
                )}
              </div>
              {demoResult && (
                <div className="mt-3 bg-bb-surface rounded p-3 font-mono text-xs text-bb-muted">
                  <span className="text-bb-lime">payment_id:</span> {demoResult.payment_id}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
