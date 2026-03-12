import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

interface Transaction {
  id: string
  reference: string | null
  payment_id: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  payment_link: string | null
  card_brand: string | null
  card_last4: string | null
  created_at: string
  isNew?: boolean
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-bb-amber/10 text-bb-amber',
  paid: 'bg-green-500/10 text-green-400',
  failed: 'bg-bb-red/10 text-bb-red',
  refunded: 'bg-bb-blue/10 text-bb-blue',
  cancelled: 'bg-bb-surface text-bb-muted',
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function TransactionRow({ txn }: { txn: Transaction }) {
  return (
    <motion.div
      layout
      initial={txn.isNew ? { opacity: 0, y: -20, backgroundColor: 'rgba(147,51,234,0.1)' } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between px-4 py-3 border-b border-bb-border/50 hover:bg-bb-surface/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm text-bb-text font-mono truncate">
            {txn.reference || txn.payment_id}
          </p>
          {txn.card_brand && (
            <p className="text-xs text-bb-muted">
              {txn.card_brand} ····{txn.card_last4}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-mono text-bb-text">
          ${Number(txn.amount).toFixed(2)}
        </span>
        <span className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[txn.status] || STATUS_STYLES.cancelled}`}>
          {txn.status === 'pending' && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              {txn.status}
            </motion.span>
          )}
          {txn.status !== 'pending' && txn.status}
        </span>
        <span className="text-xs text-bb-muted w-16 text-right">{timeAgo(txn.created_at)}</span>
        {txn.payment_link && (
          <a
            href={txn.payment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bb-muted hover:text-bb-text"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  )
}
