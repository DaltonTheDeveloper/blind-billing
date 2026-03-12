import { useEffect, useState, ReactNode } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, ArrowLeftRight, Key, Settings as SettingsIcon, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useMerchant } from './hooks/useMerchant'
import type { User } from '@supabase/supabase-js'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboard from './pages/Onboard'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import APIKeys from './pages/APIKeys'
import SettingsPage from './pages/Settings'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-bb-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-bb-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function MerchantRequired({ children }: { children: ReactNode }) {
  const { merchant, loading } = useMerchant()

  if (loading) {
    return (
      <div className="min-h-screen bg-bb-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-bb-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!merchant) return <Navigate to="/onboard" replace />
  return <>{children}</>
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

function DashboardLayout() {
  const location = useLocation()
  const { merchant } = useMerchant()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('bb_api_key')
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-bb-bg flex">
      {/* Sidebar */}
      <aside className="w-60 bg-bb-surface border-r border-bb-border flex flex-col fixed h-full">
        <div className="p-5">
          <Link to="/dashboard" className="font-instrument text-lg text-bb-text flex items-center gap-1">
            Blind Billing
            <span className="w-1.5 h-1.5 bg-bb-lime rounded-full animate-pulse" />
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-bb-lime/10 text-bb-lime'
                    : 'text-bb-muted hover:text-bb-text hover:bg-bb-card'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-bb-border space-y-3">
          {merchant && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-bb-lime/10 text-bb-lime px-2 py-0.5 rounded-full uppercase">
                {merchant.plan}
              </span>
              <span className="text-xs text-bb-muted truncate">{merchant.business_name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-bb-muted hover:text-bb-text w-full"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  {
    path: '/onboard',
    element: (
      <ProtectedRoute>
        <Onboard />
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <MerchantRequired>
          <DashboardLayout />
        </MerchantRequired>
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/transactions', element: <Transactions /> },
      { path: '/api-keys', element: <APIKeys /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
