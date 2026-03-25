import { LayoutGrid, AlertTriangle, Clock, XCircle, Package } from 'lucide-react'

const STAT_CARDS = [
  { label: 'Total Products', value: '—', icon: Package, color: 'var(--accent)', bg: 'var(--accent-light)' },
  { label: 'Low Stock', value: '—', icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-light)' },
  { label: 'Expiring Soon', value: '—', icon: Clock, color: 'var(--orange)', bg: 'var(--orange-light)' },
  { label: 'Expired', value: '—', icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)' },
]

export function Inventory() {
  return (
    <div style={{ padding: 20, overflow: 'auto', height: '100%' }}>
      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {STAT_CARDS.map(stat => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              style={{
                padding: 16,
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {stat.label}
                </span>
                <span
                  style={{
                    background: stat.bg,
                    color: stat.color,
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{stat.value}</div>
            </div>
          )
        })}
      </div>

      {/* Attention List Placeholder */}
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Items Requiring Attention</h3>
      <div
        style={{
          padding: 48,
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <LayoutGrid size={32} strokeWidth={1.5} style={{ margin: '0 auto 8px' }} />
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
          Inventory dashboard — Phase 8
        </div>
        <div style={{ fontSize: 12 }}>
          Low stock, expiring, and expired batch alerts will be computed from SQLite batch data.
        </div>
      </div>
    </div>
  )
}
