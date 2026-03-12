import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bb-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-block">
            <h1 className="font-instrument text-3xl text-bb-text">
              Blind Billing
              <span className="inline-block w-2 h-2 bg-bb-lime rounded-full ml-1 animate-pulse" />
            </h1>
          </button>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-bb-lime/10 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-bb-lime" />
              </div>
              <h2 className="text-xl font-semibold text-bb-text">Check your email</h2>
              <p className="text-bb-muted text-sm">
                We sent a magic link to <span className="text-bb-text">{email}</span>
              </p>
              <p className="text-bb-muted text-xs">Click the link in the email to sign in.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-bb-text mb-1">Sign in</h2>
                <p className="text-bb-muted text-sm">No password needed. Just your email.</p>
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bb-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-bb-surface border border-bb-border rounded-lg pl-10 pr-4 py-3 text-bb-text placeholder:text-bb-muted/50 focus:outline-none focus:border-bb-lime/50 transition-colors"
                  required
                />
              </div>

              {error && (
                <p className="text-bb-red text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full btn-lime flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
