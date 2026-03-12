import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
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
              <span className="inline-block w-2 h-2 bg-purple-500 rounded-full ml-1 animate-pulse" />
            </h1>
          </button>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-bb-text mb-1">Sign in</h2>
              <p className="text-bb-muted text-sm">Enter your email and password.</p>
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bb-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-bb-surface border border-bb-border rounded-lg pl-10 pr-4 py-3 text-bb-text placeholder:text-bb-muted/50 focus:outline-none focus:border-purple-500/50 transition-colors"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bb-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-bb-surface border border-bb-border rounded-lg pl-10 pr-4 py-3 text-bb-text placeholder:text-bb-muted/50 focus:outline-none focus:border-purple-500/50 transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-bb-red text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full btn-lime flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-sm text-bb-muted">
              Don't have an account?{' '}
              <Link to="/onboard" className="text-purple-400 hover:underline">
                Create account
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
