import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Field {
  key: string
  value: string
  label: 'PII' | 'SENSITIVE' | 'SAFE'
  redacted: boolean
}

const INITIAL_FIELDS: Field[] = [
  { key: 'customer_email', value: '"jane@example.com"', label: 'PII', redacted: false },
  { key: 'customer_name', value: '"Jane Smith"', label: 'PII', redacted: false },
  { key: 'billing_address', value: '"123 Main St..."', label: 'PII', redacted: false },
  { key: 'card_number', value: '"4111 1111..."', label: 'SENSITIVE', redacted: false },
  { key: 'amount', value: '149.99', label: 'SAFE', redacted: false },
  { key: 'reference', value: '"ORD-8821"', label: 'SAFE', redacted: false },
]

export default function AnimatedHero() {
  const [fields, setFields] = useState<Field[]>([])
  const [phase, setPhase] = useState<'typing' | 'redacting' | 'done'>('typing')
  const [typingIndex, setTypingIndex] = useState(0)
  const [redactingIndex, setRedactingIndex] = useState(0)

  useEffect(() => {
    setFields([])
    setPhase('typing')
    setTypingIndex(0)
    setRedactingIndex(0)

    const cycle = () => {
      setFields([])
      setPhase('typing')
      setTypingIndex(0)
      setRedactingIndex(0)
    }

    const interval = setInterval(cycle, 12000)
    return () => clearInterval(interval)
  }, [])

  // Typing phase
  useEffect(() => {
    if (phase !== 'typing') return
    if (typingIndex >= INITIAL_FIELDS.length) {
      const timer = setTimeout(() => setPhase('redacting'), 1000)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      setFields((prev) => [...prev, INITIAL_FIELDS[typingIndex]])
      setTypingIndex((i) => i + 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [phase, typingIndex])

  // Redacting phase
  useEffect(() => {
    if (phase !== 'redacting') return
    const piiFields = fields.filter((f) => f.label !== 'SAFE')
    if (redactingIndex >= piiFields.length) {
      const timer = setTimeout(() => setPhase('done'), 500)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      const targetKey = piiFields[redactingIndex].key
      setFields((prev) =>
        prev.map((f) => (f.key === targetKey ? { ...f, redacted: true } : f))
      )
      setRedactingIndex((i) => i + 1)
    }, 400)
    return () => clearTimeout(timer)
  }, [phase, redactingIndex, fields])

  const allRedacted = fields.length > 0 && fields.filter((f) => f.label !== 'SAFE').every((f) => f.redacted)

  return (
    <div className="relative">
      <div className="glass-card p-6 max-w-md mx-auto border-bb-lime/20 shadow-[0_0_40px_rgba(163,230,53,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-bb-muted">payment_payload.json</span>
          <AnimatePresence mode="wait">
            {allRedacted ? (
              <motion.span
                key="safe"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-mono px-2 py-0.5 rounded-full bg-bb-lime/10 text-bb-lime"
              >
                Zero PII
              </motion.span>
            ) : fields.length > 0 ? (
              <motion.span
                key="unsafe"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-mono px-2 py-0.5 rounded-full bg-bb-red/10 text-bb-red"
              >
                Contains PII
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="font-mono text-sm space-y-1">
          <span className="text-bb-muted">{'{'}</span>
          <AnimatePresence>
            {fields.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="pl-4 flex items-center gap-2"
              >
                <span className="text-bb-blue">"{field.key}"</span>
                <span className="text-bb-muted">:</span>
                {field.redacted ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 1.2 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1"
                  >
                    <span className="text-bb-red/60">██████</span>
                    <span className="text-[10px] px-1 py-px rounded bg-bb-red/10 text-bb-red uppercase">
                      redacted
                    </span>
                  </motion.span>
                ) : (
                  <span className={field.label === 'SAFE' ? 'text-bb-lime' : 'text-bb-text'}>
                    {field.value}
                  </span>
                )}
                {i < fields.length - 1 && <span className="text-bb-muted">,</span>}
                <span
                  className={`text-[10px] ml-auto px-1 py-px rounded ${
                    field.label === 'SAFE'
                      ? 'bg-bb-lime/10 text-bb-lime'
                      : field.label === 'PII'
                      ? 'bg-bb-red/10 text-bb-red'
                      : 'bg-bb-amber/10 text-bb-amber'
                  }`}
                >
                  {field.label}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {fields.length > 0 && <span className="text-bb-muted">{'}'}</span>}
        </div>
      </div>
    </div>
  )
}
