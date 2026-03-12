import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Banknote, Smartphone, Wallet, RefreshCw, Shield, Lock,
  ArrowRight, Check
} from 'lucide-react'
import AnimatedHero from '../components/AnimatedHero'
import PayoutTimeline from '../components/PayoutTimeline'
import PayloadComparison from '../components/PayloadComparison'
import FlowWalkthrough from '../components/FlowWalkthrough'

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random(),
        o: 0.06 + Math.random() * 0.09,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(163,230,53,${p.o})`
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(163,230,53,${0.03 * (1 - dist / 120)})`
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

const FEATURES = [
  { icon: Banknote, title: 'T+1 Direct Settlement', desc: 'Funds go straight to your bank. No Stripe middleman.' },
  { icon: Smartphone, title: 'SMS, Email, QR, NFC', desc: 'All payment methods in one API call.' },
  { icon: Wallet, title: 'Apple Pay & Google Pay', desc: 'Native digital wallets. No extra config.' },
  { icon: RefreshCw, title: 'Recurring Billing', desc: 'Weekly, monthly, quarterly, yearly. Built in.' },
  { icon: Shield, title: 'Pre-Authorization', desc: 'Hold funds, capture later. Perfect for reservations.' },
  { icon: Lock, title: 'HIPAA-Eligible Infra', desc: 'Built on AWS HIPAA-eligible services. BAA available.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$49',
    rate: '2.65% + $0.15',
    features: ['Up to $10k/mo volume', 'Email + SMS payments', 'API access', 'Standard support'],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$99',
    rate: '2.65% + $0.12',
    features: ['Up to $50k/mo volume', 'Everything in Starter', 'QR code payments', 'Priority support', 'Custom branding'],
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '$249',
    rate: '2.60% + $0.10',
    features: ['Unlimited volume', 'Everything in Growth', 'White-label option', 'Dedicated support', 'SLA guarantee'],
    highlighted: false,
  },
]

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-bb-bg">
      <ParticleCanvas />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bb-bg/80 backdrop-blur-xl border-b border-bb-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-instrument text-xl text-bb-text flex items-center gap-1">
            Blind Billing
            <span className="w-1.5 h-1.5 bg-bb-lime rounded-full animate-pulse" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-bb-muted hover:text-bb-text transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-bb-muted hover:text-bb-text transition-colors">Pricing</a>
            <Link to="/login" className="btn-lime text-sm !px-4 !py-2">Request Early Access</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-instrument text-5xl md:text-7xl leading-[1.1] text-bb-text">
                Payments that don't
                <br />
                <em className="text-bb-lime">know too much.</em>
              </h1>
              <p className="text-lg text-bb-muted mt-6 max-w-lg">
                Privacy-first payment infrastructure. T+1 direct settlement.
                Zero cardholder data on your servers.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link to="/login" className="btn-lime flex items-center gap-2">
                  Request Early Access <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#how-it-works" className="btn-ghost">
                  See how it works →
                </a>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <AnimatedHero />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Payout Comparison */}
      <section id="how-it-works" className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-instrument text-4xl text-bb-text">Your money. Faster.</h2>
            <p className="text-bb-muted mt-3">
              Stripe holds your money for 2–7 business days. We settle direct to your bank.
            </p>
          </motion.div>
          <PayoutTimeline />
        </div>
      </section>

      {/* Privacy Story */}
      <section id="privacy" className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-instrument text-4xl text-bb-text">
              Your data. <em className="text-bb-lime">Gone.</em>
            </h2>
            <p className="text-bb-muted mt-3">
              We store zero cardholder PII. A breach of our system reveals nothing about your customers.
            </p>
          </motion.div>
          <PayloadComparison />
        </div>
      </section>

      {/* Flow Walkthrough */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-instrument text-4xl text-bb-text">Four steps. Zero PII.</h2>
          </motion.div>
          <FlowWalkthrough />
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -4 }}
                className="glass-card p-6 hover:border-bb-lime/30 transition-colors cursor-default"
              >
                <f.icon className="w-6 h-6 text-bb-lime mb-3" />
                <h3 className="text-sm font-semibold text-bb-text">{f.title}</h3>
                <p className="text-xs text-bb-muted mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-instrument text-4xl text-bb-text">Simple pricing.</h2>
            <p className="text-bb-muted mt-3">Monthly platform fee + small per-transaction margin. No hidden fees.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card p-6 relative ${
                  plan.highlighted ? 'border-bb-lime/50 shadow-[0_0_30px_rgba(163,230,53,0.08)]' : ''
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-bb-lime text-bb-bg px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-bb-text">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-bb-text">{plan.price}</span>
                  <span className="text-bb-muted text-sm">/mo</span>
                </div>
                <p className="text-xs text-bb-lime font-mono mt-1">{plan.rate}/txn</p>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-bb-muted">
                      <Check className="w-3.5 h-3.5 text-bb-lime flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`block text-center mt-6 ${
                    plan.highlighted ? 'btn-lime' : 'btn-ghost'
                  } !py-2.5 text-sm`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto bg-bb-lime rounded-2xl p-12 text-center">
          <h2 className="font-instrument text-3xl md:text-4xl text-bb-bg">
            Ready to stop storing things you shouldn't?
          </h2>
          <p className="text-bb-bg/70 mt-3">Set up in 5 minutes. No contracts.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-bb-bg text-bb-text font-semibold px-8 py-3 rounded-full mt-6 hover:bg-bb-surface transition-colors"
          >
            Request Early Access <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-bb-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-1">
            <span className="font-instrument text-lg text-bb-text">Blind Billing</span>
            <span className="w-1.5 h-1.5 bg-bb-lime rounded-full" />
          </div>
          <div className="flex gap-6 text-sm text-bb-muted">
            <a href="#" className="hover:text-bb-text transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-bb-text transition-colors">Terms</a>
            <a href="#" className="hover:text-bb-text transition-colors">Docs</a>
            <a href="#" className="hover:text-bb-text transition-colors">Contact</a>
          </div>
          <div className="text-xs text-bb-muted">
            Built on AWS &middot; Powered by Kurv
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 text-center text-xs text-bb-muted/50">
          &copy; 2026 Blind Billing. Not affiliated with Stripe.
        </div>
      </footer>
    </div>
  )
}
