import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code, ArrowRight, Smartphone, Banknote } from 'lucide-react'

const STEPS = [
  {
    num: 1,
    title: 'Create a charge',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500',
    caption: 'One API call. No card form to build. No PCI scope on your server.',
  },
  {
    num: 2,
    title: 'We route it',
    color: 'text-bb-blue',
    bgColor: 'bg-bb-blue',
    caption: 'Your merchants only have a Blind Billing key. You own the relationship.',
  },
  {
    num: 3,
    title: 'Customer pays',
    color: 'text-bb-amber',
    bgColor: 'bg-bb-amber',
    caption: 'Card data never touches your servers. PCI compliance: SAQ A — the lightest tier.',
  },
  {
    num: 4,
    title: 'You get paid',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500',
    caption: 'Clean webhook. No PII. Funds in your bank next business day.',
  },
]

function StepContent({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="glass-card p-4 font-mono text-sm overflow-x-auto">
        <div className="text-purple-400">POST /v1/charge</div>
        <div className="text-bb-muted">X-Blind-Billing-Key: bb_live_...</div>
        <div className="mt-2 text-bb-muted">{'{'}</div>
        <div className="pl-4">
          <span className="text-bb-blue">"amount"</span>: <span className="text-bb-amber">149.99</span>,
        </div>
        <div className="pl-4">
          <span className="text-bb-blue">"reference"</span>: <span className="text-purple-400">"ORD-8821"</span>,
        </div>
        <div className="pl-4">
          <span className="text-bb-blue">"customer_name"</span>: <span className="text-purple-400">"Jane Smith"</span>,
        </div>
        <div className="pl-4">
          <span className="text-bb-blue">"email"</span>: <span className="text-purple-400">"jane@acme.com"</span>
        </div>
        <div className="text-bb-muted">{'}'}</div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="flex items-center justify-center gap-4 py-6">
        <div className="glass-card px-4 py-3 text-center">
          <Code className="w-5 h-5 text-bb-muted mx-auto mb-1" />
          <span className="text-xs text-bb-text">Your Server</span>
        </div>
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <svg width="60" height="2" className="overflow-visible">
            <motion.line
              x1="0" y1="1" x2="60" y2="1"
              stroke="#6b6f68"
              strokeWidth="2"
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -16] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </svg>
        </motion.div>
        <div className="glass-card px-4 py-3 text-center border-purple-500/30 relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
          >
            <span className="text-bb-bg text-[10px]">🔒</span>
          </motion.div>
          <span className="text-xs text-purple-400 font-medium">Blind Billing</span>
        </div>
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <svg width="60" height="2" className="overflow-visible">
            <motion.line
              x1="0" y1="1" x2="60" y2="1"
              stroke="#6b6f68"
              strokeWidth="2"
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -16] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </svg>
        </motion.div>
        <div className="glass-card px-4 py-3 text-center">
          <span className="text-xs text-bb-muted">Processor</span>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-48 bg-bb-surface rounded-2xl border border-bb-border p-4 relative">
          <div className="w-16 h-1 bg-bb-border rounded-full mx-auto mb-3" />
          <div className="text-center space-y-3">
            <Smartphone className="w-5 h-5 text-bb-muted mx-auto" />
            <div className="text-sm font-medium text-bb-text">Pay $149.99</div>
            <div className="space-y-2">
              <div className="bg-bb-bg rounded-lg px-3 py-2 text-xs text-bb-muted text-left">Card Number</div>
              <div className="flex gap-2">
                <div className="bg-bb-bg rounded-lg px-3 py-2 text-xs text-bb-muted flex-1">Expiry</div>
                <div className="bg-bb-bg rounded-lg px-3 py-2 text-xs text-bb-muted flex-1">CVV</div>
              </div>
            </div>
            <div className="bg-bb-card border border-bb-border rounded-lg px-3 py-2 text-xs text-bb-muted">
              Apple Pay
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-4">
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-3 font-mono text-xs"
      >
        <span className="text-bb-muted">{'{ '}</span>
        <span className="text-bb-blue">status</span>: <span className="text-purple-400">"paid"</span>,{' '}
        <span className="text-bb-blue">amount</span>: <span className="text-bb-amber">149.99</span>,{' '}
        <span className="text-bb-blue">reference</span>: <span className="text-purple-400">"ORD-8821"</span>
        <span className="text-bb-muted">{' }'}</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex items-center justify-center gap-3"
      >
        <Banknote className="w-5 h-5 text-purple-400" />
        <ArrowRight className="w-4 h-4 text-bb-muted" />
        <motion.span
          animate={{ color: ['#e2e4e0', '#9333ea', '#e2e4e0'] }}
          transition={{ duration: 1, delay: 1 }}
          className="text-sm font-medium"
        >
          Your bank: +$149.99
        </motion.span>
      </motion.div>
    </div>
  )
}

export default function FlowWalkthrough() {
  const [activeStep, setActiveStep] = useState(0)
  const [paused, setPaused] = useState(false)

  const advance = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % 4)
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(advance, 4000)
    return () => clearInterval(timer)
  }, [paused, advance])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress bar */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((s, i) => (
          <button
            key={s.num}
            onClick={() => setActiveStep(i)}
            className="flex-1 group"
          >
            <div className="h-1 rounded-full bg-bb-surface overflow-hidden">
              <motion.div
                className={`h-full ${i <= activeStep ? 'bg-purple-500' : 'bg-bb-border'}`}
                initial={false}
                animate={{ scaleX: i <= activeStep ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ originX: 0 }}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === activeStep ? `${s.bgColor} text-bb-bg` : 'bg-bb-surface text-bb-muted'
                }`}
              >
                {s.num}
              </span>
              <span className={`text-xs ${i === activeStep ? s.color : 'text-bb-muted'}`}>
                {s.title}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <StepContent step={activeStep + 1} />
          <p className="text-sm text-bb-muted mt-4 text-center">{STEPS[activeStep].caption}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
