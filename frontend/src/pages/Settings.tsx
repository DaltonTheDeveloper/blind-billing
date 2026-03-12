import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Send, AlertTriangle, Trash2 } from 'lucide-react'
import { useMerchant } from '../hooks/useMerchant'
import BrandingToggle from '../components/BrandingToggle'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { merchant, update, loading } = useMerchant()
  const [businessName, setBusinessName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [brandingMode, setBrandingMode] = useState<'blind' | 'merchant'>('blind')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    if (merchant) {
      setBusinessName(merchant.business_name)
      setWebhookUrl(merchant.webhook_url || '')
      setBrandingMode(merchant.branding_mode)
    }
  }, [merchant])

  const handleSave = async () => {
    setSaving(true)
    try {
      await update({
        business_name: businessName,
        webhook_url: webhookUrl || null,
        branding_mode: brandingMode,
      } as Parameters<typeof update>[0])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('bb_api_key')
    window.location.href = '/login'
  }

  if (loading) return <div className="text-bb-muted text-sm p-8">Loading...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-bb-text">Settings</h1>

      {/* Business Details */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-medium text-bb-text">Business Details</h2>
        <div>
          <label className="block text-xs text-bb-muted mb-1.5">Business name</label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full bg-bb-surface border border-bb-border rounded-lg px-4 py-2.5 text-sm text-bb-text focus:outline-none focus:border-bb-lime/50"
          />
        </div>
        <div>
          <label className="block text-xs text-bb-muted mb-1.5">Email</label>
          <input
            value={merchant?.email || ''}
            disabled
            className="w-full bg-bb-surface border border-bb-border rounded-lg px-4 py-2.5 text-sm text-bb-muted cursor-not-allowed"
          />
        </div>
      </div>

      {/* Branding */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-medium text-bb-text">Branding</h2>
        <BrandingToggle
          value={brandingMode}
          onChange={setBrandingMode}
          businessName={businessName}
        />
      </div>

      {/* Webhook */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-medium text-bb-text">Webhook</h2>
        <div>
          <label className="block text-xs text-bb-muted mb-1.5">Webhook URL</label>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://api.yoursite.com/webhooks/billing"
            className="w-full bg-bb-surface border border-bb-border rounded-lg px-4 py-2.5 text-sm text-bb-text placeholder:text-bb-muted/50 focus:outline-none focus:border-bb-lime/50"
          />
        </div>
        <button className="btn-ghost !py-2 text-sm flex items-center gap-2">
          <Send className="w-3.5 h-3.5" /> Send Test Webhook
        </button>
      </div>

      {/* Plan */}
      <div className="glass-card p-6 space-y-2">
        <h2 className="text-sm font-medium text-bb-text">Plan</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-bb-text capitalize">{merchant?.plan || 'Starter'}</span>
          <span className="text-[10px] bg-bb-lime/10 text-bb-lime px-2 py-0.5 rounded-full uppercase">Active</span>
        </div>
        <button className="text-xs text-bb-lime hover:underline">Upgrade plan →</button>
      </div>

      {/* Save */}
      <motion.button
        onClick={handleSave}
        disabled={saving}
        className="btn-lime flex items-center gap-2 disabled:opacity-50"
        whileTap={{ scale: 0.98 }}
      >
        {saved ? <><Save className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
      </motion.button>

      {/* Danger Zone */}
      <div className="glass-card border-bb-red/30 p-6 space-y-4">
        <h2 className="text-sm font-medium text-bb-red">Danger Zone</h2>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="text-sm text-bb-red hover:text-bb-red/80 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-bb-red/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-bb-red mt-0.5 flex-shrink-0" />
              <p className="text-xs text-bb-red">
                This will permanently delete your account, API keys, and all transaction history. Type your business name to confirm.
              </p>
            </div>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={merchant?.business_name || 'Business name'}
              className="w-full bg-bb-surface border border-bb-red/30 rounded-lg px-4 py-2.5 text-sm text-bb-text focus:outline-none focus:border-bb-red/50"
            />
            <div className="flex gap-3">
              <button
                disabled={deleteConfirm !== merchant?.business_name}
                className="text-sm text-bb-red hover:text-bb-red/80 font-medium disabled:opacity-30"
              >
                Delete my account
              </button>
              <button onClick={() => { setShowDelete(false); setDeleteConfirm('') }} className="text-sm text-bb-muted">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="text-sm text-bb-muted hover:text-bb-text">
        Sign out
      </button>
    </div>
  )
}
