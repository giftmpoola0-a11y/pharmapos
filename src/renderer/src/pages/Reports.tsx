import { BarChart3, DollarSign, ShoppingBag, Users } from 'lucide-react'

const STAT_CARDS = [
  { label: "Today's Revenue", value: '—', sub: '0 transactions', icon: DollarSign, color: 'var(--green)', bg: 'var(--green-light)' },
  { label: 'Items Sold', value: '—', sub: 'across all sales', icon: ShoppingBag, color: 'var(--accent)', bg: 'var(--accent-light)' },
  { label: 'Active Cashiers', value: '—', sub: 'on shift today', icon: Users, color: 'var(--accent)', bg: 'var(--accent-light)' },
]

export function Reports() {
  return (
    <div style={{ padding: 20, overflow: 'auto', height: '100%' }}>
      {/* Date Filter Placeholder */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['Today', 'Yesterday', 'This Week', 'This Month'].map(period => (
          <button
            key={period}
            disabled
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: period === 'Today' ? 'var(--accent)' : 'var(--border)',
              background: period === 'Today' ? 'var(--accent-light)' : 'var(--bg-card)',
              color: period === 'Today' ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'not-allowed',
              fontFamily: 'inherit',
            }}
          >
            {period}
          </button>
        ))}
      </div>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</span>
                <span style={{ background: stat.bg, color: stat.color, width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} />
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{stat.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Transaction Log Placeholder */}
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Transactions</h3>
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
        <BarChart3 size={32} strokeWidth={1.5} style={{ margin: '0 auto 8px' }} />
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
          Sales reports — Phase 9
        </div>
        <div style={{ fontSize: 12 }}>
          Daily summaries, cashier breakdowns, and transaction logs computed from local sale records.
        </div>
      </div>
    </div>
  )
}
