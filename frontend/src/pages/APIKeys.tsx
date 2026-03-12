import { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, Copy, Check, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useMerchant } from '../hooks/useMerchant'

export default function APIKeys() {
  const { merchant, rotateKey } = useMerchant()
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)

  const handleRotate = async () => {
    setRotating(true)
    try {
      const result = await rotateKey()
      setNewKey(result.key)
      localStorage.setItem('bb_api_key', result.key)
      setConfirmRotate(false)
    } catch (err) {
      console.error(err)
    }
    setRotating(false)
  }

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const curlExample = `curl -X POST https://api.blindbilling.com/v1/charge \\
  -H "X-Blind-Billing-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":149.99,"currency":"USD","reference":"ORD-001","customer_name":"Jane Smith"}'`

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-bb-text">API Keys</h1>

      {/* Current Key */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-bb-lime" />
          <span className="text-sm font-medium text-bb-text">Active API Key</span>
        </div>

        <div className="bg-bb-surface rounded-lg p-4 border border-bb-border">
          <div className="flex items-center gap-3">
            <code className="flex-1 font-mono text-sm text-bb-muted">
              {merchant?.api_key_preview || 'bb_live_...****'}
            </code>
          </div>
        </div>

        <div className="bg-bb-blue/5 border border-bb-blue/20 rounded-lg p-3 flex items-start gap-2">
          <span className="text-xs text-bb-blue leading-relaxed">
            Your full key is stored only in your browser. We store only a bcrypt hash.
          </span>
        </div>

        {/* New Key Display */}
        {newKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="bg-bb-surface rounded-lg p-4 border border-bb-lime/30">
              <p className="text-xs text-bb-lime mb-2">New API Key (save this now)</p>
              <div className="flex items-center gap-2">
                <code className={`flex-1 font-mono text-sm text-bb-lime break-all ${!showKey ? 'blur-sm select-none' : ''}`}>
                  {newKey}
                </code>
                <button onClick={() => setShowKey(!showKey)} className="text-bb-muted hover:text-bb-text p-1">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => copyToClipboard(newKey, setCopied)} className="text-bb-muted hover:text-bb-text p-1">
                  {copied ? <Check className="w-4 h-4 text-bb-lime" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-bb-amber/10 border border-bb-amber/20 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-bb-amber mt-0.5 flex-shrink-0" />
              <p className="text-xs text-bb-amber">
                This is the only time you'll see this key. Save it securely.
              </p>
            </div>
          </motion.div>
        )}

        {/* Rotate */}
        {!confirmRotate ? (
          <button
            onClick={() => setConfirmRotate(true)}
            className="btn-ghost !py-2 text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Rotate Key
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-xs text-bb-amber">This will invalidate your current key. Continue?</p>
            <button onClick={handleRotate} disabled={rotating} className="text-xs text-bb-red hover:text-bb-red/80 font-medium">
              {rotating ? 'Rotating...' : 'Yes, rotate'}
            </button>
            <button onClick={() => setConfirmRotate(false)} className="text-xs text-bb-muted hover:text-bb-text">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Integration Example */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-medium text-bb-text">Integration Example</h2>
        <div className="relative">
          <pre className="bg-bb-surface rounded-lg p-4 font-mono text-xs text-bb-muted overflow-x-auto border border-bb-border">
            {curlExample}
          </pre>
          <button
            onClick={() => copyToClipboard(curlExample, setCopiedCurl)}
            className="absolute top-3 right-3 text-bb-muted hover:text-bb-text"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-bb-lime" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
