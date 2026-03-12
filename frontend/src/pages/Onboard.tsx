import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Copy, Eye, EyeOff, AlertTriangle, Check } from 'lucide-react'
import { api } from '../lib/api'

type Step = 1 | 2 | 3

export default function Onboard() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [brandingMode, setBrandingMode] = useState<'blind' | 'merchant'>('blind')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSetup = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.setupMerchant({
        business_name: businessName,
        email,
        webhook_url: webhookUrl || undefined,
        branding_mode: brandingMode,
      }) as { api_key: string }
      setApiKey(result.api_key)
      localStorage.setItem('bb_api_key', result.api_key)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    }
    setLoading(false)
  }

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    localStorage.setItem('bb_api_key', apiKey)
    setTimeout(() => setCopied(false), 2000)
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  }

  return (
    <div className="min-h-screen bg-bb-bg flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-instrument text-3xl text-bb-text">
            Blind Billing
            <span className="inline-block w-2 h-2 bg-bb-lime rounded-full ml-1 animate-pulse" />
          </h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s <= step ? 'bg-bb-lime text-bb-bg' : 'bg-bb-surface text-bb-muted border border-bb-border'
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-px ${s < step ? 'bg-bb-lime' : 'bg-bb-border'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card p-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={step}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-semibold text-bb-text">Business details</h2>
                  <p className="text-bb-muted text-sm mt-1">Tell us about your business</p>
                </div>
                <div>
                  <label className="block text-sm text-bb-muted mb-1.5">Business name *</label>
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-bb-surface border border-bb-border rounded-lg px-4 py-3 text-bb-text focus:outline-none focus:border-bb-lime/50"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm text-bb-muted mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bb-surface border border-bb-border rounded-lg px-4 py-3 text-bb-text focus:outline-none focus:border-bb-lime/50"
                    placeholder="billing@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-bb-muted mb-1.5">
                    Webhook URL
                    <span className="text-bb-muted/50 ml-1">(optional)</span>
                  </label>
                  <input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-bb-surface border border-bb-border rounded-lg px-4 py-3 text-bb-text focus:outline-none focus:border-bb-lime/50"
                    placeholder="https://api.acme.com/webhooks/billing"
                  />
                  <p className="text-xs text-bb-muted/50 mt-1">We'll POST payment results here</p>
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!businessName}
                  className="w-full btn-lime flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-semibold text-bb-text">Branding</h2>
                  <p className="text-bb-muted text-sm mt-1">How should payment pages appear?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBrandingMode('blind')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      brandingMode === 'blind'
                        ? 'border-bb-lime bg-bb-lime/5'
                        : 'border-bb-border hover:border-bb-muted'
                    }`}
                  >
                    <p className="text-sm font-medium text-bb-text">Blind Billing</p>
                    <p className="text-xs text-bb-muted mt-1">Payment pages show our branding</p>
                    <div className="mt-3 bg-bb-surface rounded p-2 text-xs text-bb-muted font-mono">
                      From: Blind Billing
                    </div>
                  </button>
                  <button
                    onClick={() => setBrandingMode('merchant')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      brandingMode === 'merchant'
                        ? 'border-bb-lime bg-bb-lime/5'
                        : 'border-bb-border hover:border-bb-muted'
                    }`}
                  >
                    <p className="text-sm font-medium text-bb-text">Your brand</p>
                    <p className="text-xs text-bb-muted mt-1">Payment pages show your name</p>
                    <div className="mt-3 bg-bb-surface rounded p-2 text-xs text-bb-muted font-mono">
                      From: {businessName || 'Your Business'}
                    </div>
                  </button>
                </div>
                <p className="text-xs text-bb-muted">You can change this any time in Settings.</p>
                {error && <p className="text-bb-red text-sm">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-ghost flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleSetup}
                    disabled={loading}
                    className="flex-1 btn-lime flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Setting up...' : 'Create account'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-semibold text-bb-text">Your API Key</h2>
                  <p className="text-bb-muted text-sm mt-1">This is the only time you'll see this key</p>
                </div>
                <div className="bg-bb-surface rounded-lg p-4 border border-bb-border">
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 font-mono text-sm text-bb-lime break-all ${!showKey ? 'blur-sm select-none' : ''}`}>
                      {apiKey}
                    </code>
                    <button onClick={() => setShowKey(!showKey)} className="text-bb-muted hover:text-bb-text p-1">
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={copyKey} className="text-bb-muted hover:text-bb-text p-1">
                      {copied ? <Check className="w-4 h-4 text-bb-lime" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-bb-amber/10 border border-bb-amber/20 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-bb-amber mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-bb-amber">
                    Save this key now. We hash it immediately. You can rotate it later but this is the only time you'll see this exact key.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  disabled={!copied && !showKey}
                  className="w-full btn-lime flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  I've saved my key — Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
