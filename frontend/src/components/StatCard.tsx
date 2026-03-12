import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  prefix?: string
  isAnimated?: boolean
  accentColor?: string
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])
  return value
}

export default function StatCard({ title, value, subtitle, prefix = '', isAnimated = true, accentColor }: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
  const animated = useCountUp(isAnimated ? numericValue : 0)
  const display = isAnimated && typeof value === 'number'
    ? `${prefix}${animated.toLocaleString()}`
    : `${prefix}${value}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <p className="text-xs text-bb-muted uppercase tracking-wider">{title}</p>
      <p className={`text-2xl font-semibold mt-1 font-mono ${accentColor || 'text-bb-text'}`}>
        {display}
      </p>
      {subtitle && (
        <p className="text-xs text-bb-muted mt-1">{subtitle}</p>
      )}
    </motion.div>
  )
}
