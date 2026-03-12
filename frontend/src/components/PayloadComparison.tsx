import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface PayloadField {
  key: string
  value: string
  indicator: 'red' | 'yellow' | 'green'
  label: string
}

const STRIPE_FIELDS: PayloadField[] = [
  { key: 'customer_email', value: '"j***@example.com"', indicator: 'red', label: 'PII' },
  { key: 'customer_name', value: '"Jane S."', indicator: 'red', label: 'PII' },
  { key: 'billing_address', value: '"1** Main St"', indicator: 'red', label: 'PII' },
  { key: 'customer_id', value: '"cus_Nffrb8yCLxq8s"', indicator: 'red', label: 'Linkable' },
  { key: 'payment_method_id', value: '"pm_1Pxxx..."', indicator: 'red', label: 'Linkable' },
  { key: 'card_last4', value: '"4242"', indicator: 'yellow', label: 'Partial' },
  { key: 'amount', value: '14999', indicator: 'green', label: 'Safe' },
]

const BB_FIELDS: PayloadField[] = [
  { key: 'payment_id', value: '"bb_pay_8xKj2..."', indicator: 'green', label: 'Internal' },
  { key: 'reference', value: '"ORD-9821"', indicator: 'green', label: 'Your ID' },
  { key: 'amount', value: '149.99', indicator: 'green', label: 'Safe' },
  { key: 'currency', value: '"USD"', indicator: 'green', label: 'Safe' },
  { key: 'status', value: '"paid"', indicator: 'green', label: 'Safe' },
  { key: 'card_brand', value: '"Visa"', indicator: 'green', label: 'Non-PII' },
  { key: 'card_last4', value: '"4242"', indicator: 'green', label: 'Non-PII' },
]

function CodePanel({
  title,
  fields,
  variant,
  delay,
}: {
  title: string
  fields: PayloadField[]
  variant: 'red' | 'lime'
  delay: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const dotColor = variant === 'red' ? 'bg-bb-red' : 'bg-bb-lime'
  const headerBg = variant === 'red' ? 'bg-bb-red/10' : 'bg-bb-lime/10'
  const headerText = variant === 'red' ? 'text-bb-red' : 'text-bb-lime'

  return (
    <div ref={ref} className="glass-card overflow-hidden">
      <div className={`px-4 py-2 ${headerBg} flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className={`text-xs font-mono ${headerText}`}>{title}</span>
      </div>
      <div className="p-4 font-mono text-sm">
        <span className="text-bb-muted">{'{'}</span>
        {fields.map((field, i) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: delay + i * 0.15, duration: 0.3 }}
            className="pl-4 flex items-center gap-2 py-0.5"
          >
            <span className="text-bb-blue whitespace-nowrap">"{field.key}"</span>
            <span className="text-bb-muted">:</span>
            <span className="text-bb-text">{field.value}</span>
            {i < fields.length - 1 && <span className="text-bb-muted">,</span>}
            <span
              className={`text-[10px] ml-auto px-1.5 py-px rounded whitespace-nowrap ${
                field.indicator === 'red'
                  ? 'bg-bb-red/10 text-bb-red'
                  : field.indicator === 'yellow'
                  ? 'bg-bb-amber/10 text-bb-amber'
                  : 'bg-bb-lime/10 text-bb-lime'
              }`}
            >
              {field.indicator === 'red' ? '🔴' : field.indicator === 'yellow' ? '🟡' : '✅'} {field.label}
            </span>
          </motion.div>
        ))}
        <span className="text-bb-muted">{'}'}</span>
      </div>
    </div>
  )
}

export default function PayloadComparison() {
  const bannerRef = useRef(null)
  const bannerInView = useInView(bannerRef, { once: true, margin: '-50px' })

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <CodePanel title="Typical Stripe webhook" fields={STRIPE_FIELDS} variant="red" delay={0} />
        <CodePanel title="Blind Billing webhook" fields={BB_FIELDS} variant="lime" delay={0.3} />
      </div>
      <motion.div
        ref={bannerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={bannerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="text-center bg-bb-lime/5 border border-bb-lime/20 rounded-xl p-4"
      >
        <p className="text-sm text-bb-lime">
          Zero customer PII ever enters your system. Right to erasure? Nothing to delete.
        </p>
      </motion.div>
    </div>
  )
}
