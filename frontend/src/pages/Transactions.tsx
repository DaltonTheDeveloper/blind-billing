import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Download, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useMerchant } from '../hooks/useMerchant'
import { useTransactions } from '../hooks/useTransactions'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-bb-amber/10 text-bb-amber',
  paid: 'bg-bb-lime/10 text-bb-lime',
  failed: 'bg-bb-red/10 text-bb-red',
  refunded: 'bg-bb-blue/10 text-bb-blue',
  cancelled: 'bg-bb-surface text-bb-muted',
}

const PAGE_SIZE = 25

export default function Transactions() {
  const { merchant } = useMerchant()
  const { transactions, loading } = useTransactions(merchant?.id)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          (t.reference?.toLowerCase().includes(q)) ||
          t.payment_id.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
        )
      }
      return true
    })
  }, [transactions, search, statusFilter])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const exportCsv = () => {
    const headers = ['reference', 'payment_id', 'amount', 'currency', 'status', 'card_brand', 'card_last4', 'created_at']
    const rows = filtered.map((t) =>
      headers.map((h) => JSON.stringify((t as unknown as Record<string, unknown>)[h] ?? '')).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-bb-text">Transactions</h1>
        <button onClick={exportCsv} className="btn-ghost !py-2 text-sm flex items-center gap-2">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bb-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search by reference or ID..."
            className="w-full bg-bb-surface border border-bb-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-bb-text placeholder:text-bb-muted/50 focus:outline-none focus:border-bb-lime/50"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bb-muted" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
            className="bg-bb-surface border border-bb-border rounded-lg pl-10 pr-8 py-2.5 text-sm text-bb-text appearance-none focus:outline-none focus:border-bb-lime/50"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bb-border">
                <th className="text-left px-4 py-3 text-xs text-bb-muted uppercase tracking-wider font-medium">Reference</th>
                <th className="text-left px-4 py-3 text-xs text-bb-muted uppercase tracking-wider font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-xs text-bb-muted uppercase tracking-wider font-medium">Currency</th>
                <th className="text-left px-4 py-3 text-xs text-bb-muted uppercase tracking-wider font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-bb-muted uppercase tracking-wider font-medium">Date</th>
                <th className="text-left px-4 py-3 text-xs text-bb-muted uppercase tracking-wider font-medium w-8"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-bb-muted text-sm">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-bb-muted text-sm">No transactions found</td></tr>
              ) : (
                paginated.map((txn) => (
                  <motion.tr
                    key={txn.id}
                    layout
                    className="border-b border-bb-border/50 hover:bg-bb-surface/50 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === txn.id ? null : txn.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-bb-text">{txn.reference || txn.payment_id}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-bb-text">${Number(txn.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-bb-muted">{txn.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[txn.status]}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-bb-muted">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {txn.payment_link && (
                          <a href={txn.payment_link} target="_blank" rel="noopener noreferrer" className="text-bb-muted hover:text-bb-text" onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {expandedId === txn.id ? <ChevronUp className="w-3.5 h-3.5 text-bb-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-bb-muted" />}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded details rendered outside table for layout */}
        {expandedId && (() => {
          const txn = paginated.find(t => t.id === expandedId)
          if (!txn) return null
          return (
            <div className="px-4 py-3 bg-bb-surface/50 border-t border-bb-border/50 text-xs font-mono text-bb-muted space-y-1">
              <div><span className="text-bb-text">Payment ID:</span> {txn.payment_id}</div>
              {txn.card_brand && <div><span className="text-bb-text">Card:</span> {txn.card_brand} ····{txn.card_last4}</div>}
              {txn.settled_at && <div><span className="text-bb-text">Settled:</span> {new Date(txn.settled_at).toLocaleString()}</div>}
            </div>
          )
        })()}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-bb-border">
            <span className="text-xs text-bb-muted">
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="text-xs text-bb-muted hover:text-bb-text disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-xs text-bb-muted">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="text-xs text-bb-muted hover:text-bb-text disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
