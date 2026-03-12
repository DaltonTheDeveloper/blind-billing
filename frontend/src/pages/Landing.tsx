import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Banknote, Smartphone, Wallet, RefreshCw, Shield, Lock,
  ArrowRight, Check, X, AlertTriangle, Eye, EyeOff
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
        ctx.fillStyle = `rgba(147,51,234,${p.o})`
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
            ctx.strokeStyle = `rgba(147,51,234,${0.04 * (1 - dist / 120)})`
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

const FEATURES = [
  { icon: Banknote, title: 'T+1 Direct Settlement', desc: 'Funds land in your bank next business day. No holding period. No middleman.' },
  { icon: Smartphone, title: 'SMS, Email, QR, NFC', desc: 'Every payment method your customers want, in one API call.' },
  { icon: Wallet, title: 'Apple Pay & Google Pay', desc: 'Native digital wallets. Zero extra configuration.' },
  { icon: RefreshCw, title: 'Recurring Billing', desc: 'Weekly, monthly, quarterly, yearly. Subscription management built in.' },
  { icon: Shield, title: 'Pre-Authorization', desc: 'Hold funds, capture later. Perfect for reservations and deposits.' },
  { icon: Lock, title: 'HIPAA-Eligible Infra', desc: 'Built on AWS HIPAA-eligible services. BAA available for healthcare.' },
]

const COMPARISON = [
  { feature: 'Transaction fee', stripe: '2.9% + $0.30', square: '2.6% + $0.10', bb: '2.65% + $0.12', bbWins: true },
  { feature: 'Settlement speed', stripe: 'T+2 (7-14 days new)', square: 'T+1 to T+2', bb: 'T+1 always', bbWins: true },
  { feature: 'Customer PII stored', stripe: 'Full name, email, address, card', square: 'Full name, email, card', bb: 'Zero. Nothing.', bbWins: true },
  { feature: 'PCI compliance', stripe: 'SAQ A-EP', square: 'SAQ A', bb: 'SAQ A (lightest)', bbWins: true },
  { feature: 'Data breach risk', stripe: 'High — stores everything', square: 'Medium — stores PII', bb: 'None — nothing to leak', bbWins: true },
  { feature: 'Right to erasure (GDPR)', stripe: 'Complex — data scattered', square: 'Manual process', bb: 'Automatic — nothing stored', bbWins: true },
  { feature: 'Setup time', stripe: '~30 min + KYB', square: '~20 min + KYB', bb: '5 min, one API key', bbWins: true },
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

const STEPS = [
  {
    num: '01',
    title: 'Merchant sends a charge request',
    desc: 'Your server calls POST /v1/charge with the amount, reference, and customer name. Card details never touch your server.',
    detail: 'One API call replaces Stripe\'s Payment Intents, Checkout Sessions, and Payment Methods.',
  },
  {
    num: '02',
    title: 'We strip all PII and route to the processor',
    desc: 'Blind Billing encrypts the customer identity, replaces it with a one-way blind token, and forwards only the amount to our payment processor.',
    detail: 'The processor never sees who paid. You never see the card. The customer\'s identity exists nowhere except in encrypted, isolated storage.',
  },
  {
    num: '03',
    title: 'Customer pays on a hosted page',
    desc: 'The customer completes payment on a PCI-compliant hosted page. Card data is tokenized at the processor level — it never touches Blind Billing or your servers.',
    detail: 'Supports card, Apple Pay, Google Pay, ACH. SAQ A compliance — the lightest PCI tier possible.',
  },
  {
    num: '04',
    title: 'You get a clean webhook + T+1 settlement',
    desc: 'We send you a webhook with the payment status, amount, and your reference ID. No customer email. No name. No card details. Funds settle to your bank next business day.',
    detail: 'If you\'re ever breached, attackers find payment amounts and order IDs. That\'s it. No customer data to steal.',
  },
]

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-bb-bg bg-dot-grid">
      <ParticleCanvas />

      {/* Gradient glow at top */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(147,51,234,0.12) 0%, transparent 60%)' }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bb-bg/80 backdrop-blur-xl border-b border-bb-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-instrument text-xl text-bb-text flex items-center gap-1">
            Blind Billing
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-bb-muted hover:text-bb-text transition-colors">How it works</a>
            <a href="#compare" className="text-sm text-bb-muted hover:text-bb-text transition-colors">Compare</a>
            <a href="#pricing" className="text-sm text-bb-muted hover:text-bb-text transition-colors">Pricing</a>
            <Link to="/login" className="btn-lime text-sm !px-4 !py-2">Request Early Access</Link>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs mb-6">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                Coming Soon
              </div>
              <h1 className="font-instrument text-5xl md:text-7xl leading-[1.1] text-bb-text">
                Mind your
                <br />
                <em className="gradient-text">business.</em>
              </h1>
              <p className="text-lg text-bb-muted mt-6 max-w-lg leading-relaxed">
                We'll mind your payments. Zero customer data stored. Cheaper than Stripe.
                Faster settlement. The payment processor that can't spy on your customers
                — because it never sees them.
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

      {/* ═══════ WHY BLIND BILLING — THE PROBLEM ═══════ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-instrument text-4xl text-bb-text">
              Every payment processor <em className="gradient-text">knows too much.</em>
            </h2>
            <p className="text-bb-muted mt-4 max-w-2xl mx-auto leading-relaxed">
              Stripe, Square, PayPal — they all store your customer's full name, email, billing address,
              and card details on their servers. When they get breached (and they do), your customers pay the price.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4 mt-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="glass-card p-6 text-left">
              <Eye className="w-6 h-6 text-red-400 mb-3" />
              <h3 className="text-sm font-semibold text-bb-text">Stripe sees everything</h3>
              <p className="text-xs text-bb-muted mt-2">Customer name, email, address, IP, device fingerprint, browsing behavior. All stored indefinitely.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="glass-card p-6 text-left">
              <AlertTriangle className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-sm font-semibold text-bb-text">Breaches are inevitable</h3>
              <p className="text-xs text-bb-muted mt-2">Payment processors are prime targets. When breached, millions of customer records are exposed.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="glass-card p-6 text-left">
              <EyeOff className="w-6 h-6 text-purple-400 mb-3" />
              <h3 className="text-sm font-semibold text-bb-text">Blind Billing sees nothing</h3>
              <p className="text-xs text-bb-muted mt-2">We strip PII before processing. A breach of our system reveals zero customer information. By design.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS — 4 STEPS ═══════ */}
      <section id="how-it-works" className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="font-instrument text-4xl text-bb-text">
              How the <em className="gradient-text">blind payment protocol</em> works
            </h2>
            <p className="text-bb-muted mt-3">Four steps. Zero PII. Your customers stay invisible.</p>
          </motion.div>

          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 md:p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03]">
                  <span className="font-instrument text-8xl text-purple-400">{step.num}</span>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-400">{step.num}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-bb-text">{step.title}</h3>
                    <p className="text-sm text-bb-muted mt-2 leading-relaxed">{step.desc}</p>
                    <p className="text-xs text-purple-400/80 mt-3 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PAYOUT SPEED ═══════ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-instrument text-4xl text-bb-text">Your money. <em className="gradient-text">Faster.</em></h2>
            <p className="text-bb-muted mt-3">Stripe holds your money for days. We settle direct to your bank, next business day.</p>
          </motion.div>
          <PayoutTimeline />
        </div>
      </section>

      {/* ═══════ DATA COMPARISON ═══════ */}
      <section id="privacy" className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-instrument text-4xl text-bb-text">
              Their webhook vs. <em className="gradient-text">ours.</em>
            </h2>
            <p className="text-bb-muted mt-3">See what data you're forced to handle with Stripe — and what we send instead.</p>
          </motion.div>
          <PayloadComparison />
        </div>
      </section>

      {/* ═══════ FULL COMPARISON TABLE ═══════ */}
      <section id="compare" className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-instrument text-4xl text-bb-text">
              Side by side with <em className="gradient-text">the competition.</em>
            </h2>
          </motion.div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bb-border">
                    <th className="text-left px-5 py-4 text-xs text-bb-muted uppercase tracking-wider"></th>
                    <th className="text-center px-5 py-4 text-xs text-bb-muted uppercase tracking-wider">Stripe</th>
                    <th className="text-center px-5 py-4 text-xs text-bb-muted uppercase tracking-wider">Square</th>
                    <th className="text-center px-5 py-4 text-xs text-purple-400 uppercase tracking-wider font-semibold">Blind Billing</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <motion.tr
                      key={row.feature}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-bb-border/50"
                    >
                      <td className="px-5 py-3.5 text-sm text-bb-text font-medium">{row.feature}</td>
                      <td className="px-5 py-3.5 text-center text-sm text-bb-muted">{row.stripe}</td>
                      <td className="px-5 py-3.5 text-center text-sm text-bb-muted">{row.square}</td>
                      <td className="px-5 py-3.5 text-center text-sm text-purple-400 font-medium">{row.bb}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* The Obvious Choice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="font-instrument text-3xl md:text-5xl text-bb-text">
              <em className="gradient-text">The obvious choice.</em>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════ INTERACTIVE WALKTHROUGH ═══════ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-instrument text-4xl text-bb-text">See it in action.</h2>
          </motion.div>
          <FlowWalkthrough />
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-instrument text-4xl text-bb-text">Everything you need. <em className="gradient-text">Nothing you don't.</em></h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -4 }}
                className="glass-card p-6 hover:border-purple-500/30 transition-colors cursor-default"
              >
                <f.icon className="w-6 h-6 text-purple-400 mb-3" />
                <h3 className="text-sm font-semibold text-bb-text">{f.title}</h3>
                <p className="text-xs text-bb-muted mt-1.5 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-instrument text-4xl text-bb-text">Simple pricing.</h2>
            <p className="text-bb-muted mt-3">Monthly platform fee + per-transaction margin. No hidden fees. No surprises.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card p-6 relative ${
                  plan.highlighted ? 'border-purple-500/50 shadow-[0_0_30px_rgba(147,51,234,0.1)]' : ''
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-bb-text">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-bb-text">{plan.price}</span>
                  <span className="text-bb-muted text-sm">/mo</span>
                </div>
                <p className="text-xs text-purple-400 font-mono mt-1">{plan.rate}/txn</p>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-bb-muted">
                      <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
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

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-12 text-center shadow-2xl shadow-purple-500/20">
          <h2 className="font-instrument text-3xl md:text-4xl text-white">
            Ready to stop storing things you shouldn't?
          </h2>
          <p className="text-white/70 mt-3">Set up in 5 minutes. No contracts. No customer data on your servers. Ever.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-8 py-3 rounded-full mt-6 hover:bg-purple-50 transition-colors"
          >
            Request Early Access <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="relative z-10 border-t border-bb-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-1">
            <span className="font-instrument text-lg text-bb-text">Blind Billing</span>
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
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
          &copy; 2026 Blind Billing. Not affiliated with Stripe, Square, or PayPal.
        </div>
      </footer>
    </div>
  )
}
