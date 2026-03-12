interface BrandingToggleProps {
  value: 'blind' | 'merchant'
  onChange: (mode: 'blind' | 'merchant') => void
  businessName?: string
}

export default function BrandingToggle({ value, onChange, businessName }: BrandingToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onChange('blind')}
        className={`p-4 rounded-lg border text-left transition-all ${
          value === 'blind'
            ? 'border-bb-lime bg-bb-lime/5'
            : 'border-bb-border hover:border-bb-muted'
        }`}
      >
        <p className="text-sm font-medium text-bb-text">Blind Billing</p>
        <p className="text-xs text-bb-muted mt-1">Payment pages show our branding</p>
        <div className="mt-3 bg-bb-surface rounded p-2 text-xs text-bb-muted font-mono">
          From: Blind Billing
        </div>
      </button>
      <button
        onClick={() => onChange('merchant')}
        className={`p-4 rounded-lg border text-left transition-all ${
          value === 'merchant'
            ? 'border-bb-lime bg-bb-lime/5'
            : 'border-bb-border hover:border-bb-muted'
        }`}
      >
        <p className="text-sm font-medium text-bb-text">Your brand</p>
        <p className="text-xs text-bb-muted mt-1">Payment pages show your name</p>
        <div className="mt-3 bg-bb-surface rounded p-2 text-xs text-bb-muted font-mono">
          From: {businessName || 'Your Business'}
        </div>
      </button>
    </div>
  )
}
