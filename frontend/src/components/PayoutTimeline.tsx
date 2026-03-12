import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function PayoutTimeline() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-8">
      {/* Stripe Timeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-bb-text">Stripe</span>
          <span className="text-xs text-bb-muted">Traditional processor</span>
        </div>
        <div className="relative">
          <div className="flex items-center gap-1">
            {/* Day 1 */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-white" />
              <span className="text-[10px] text-bb-muted mt-1">Day 1</span>
            </div>
            {/* Hold bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="flex-1 h-3 rounded-full bg-bb-red/30 origin-left relative overflow-hidden"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-bb-red/20"
              />
            </motion.div>
            {/* Day 7+ */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-bb-muted" />
              <span className="text-[10px] text-bb-muted mt-1">Day 7+</span>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-bb-text">Customer pays</span>
            <span className="text-xs text-bb-muted">Finally in your bank</span>
          </div>
          <div className="mt-3 text-center">
            <span className="text-[10px] text-bb-red bg-bb-red/10 px-2 py-1 rounded-full">
              T+2 standard &middot; 7-14 days for new accounts
            </span>
          </div>
        </div>
      </div>

      {/* Blind Billing Timeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-purple-400">Blind Billing</span>
          <span className="text-xs text-bb-muted">Direct settlement</span>
        </div>
        <div className="relative">
          <div className="flex items-center gap-1">
            {/* Day 1 */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-[10px] text-bb-muted mt-1">Day 1</span>
            </div>
            {/* Fast bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-16 h-3 rounded-full bg-purple-500/30 origin-left"
            />
            {/* Day 2 */}
            <div className="flex flex-col items-center">
              <motion.div
                animate={inView ? { boxShadow: ['0 0 0px #9333ea', '0 0 12px #9333ea', '0 0 0px #9333ea'] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-purple-500"
              />
              <span className="text-[10px] text-bb-muted mt-1">Day 2</span>
            </div>
            <div className="flex-1" />
          </div>
          <div className="flex gap-8 mt-2">
            <span className="text-xs text-bb-text">Customer pays</span>
            <span className="text-xs text-purple-400 font-medium">In YOUR bank</span>
          </div>
          <div className="mt-3 text-center">
            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
              T+1 direct settlement &middot; No holds &middot; No middleman
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
