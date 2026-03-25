import { WifiOff, Loader2, CheckCircle2, XCircle, Database, Package, AlertTriangle, ShieldAlert } from 'lucide-react'
import type { PageId, DbHealth, DbStats } from '../../../shared/types'
import { NAV_ITEMS } from '../../../shared/types'

interface HeaderProps {
  currentPage: PageId
  ipcStatus: 'checking' | 'connected' | 'failed'
  dbHealth: DbHealth | null
  dbStats: DbStats | null
}

const STATUS_CONFIG = {
  checking: { icon: Loader2, color: 'var(--orange)', label: 'Connecting...', spin: true },
  connected: { icon: CheckCircle2, color: 'var(--green)', label: 'System Ready', spin: false },
  failed: { icon: XCircle, color: 'var(--red)', label: 'IPC Failed', spin: false },
} as const

export function Header({ currentPage, ipcStatus, dbHealth, dbStats }: HeaderProps) {
  const pageLabel = NAV_ITEMS.find((n) => n.id === currentPage)?.label ?? 'PharmaPOS'
  const status = STATUS_CONFIG[ipcStatus]
  const StatusIcon = status.icon

  const dbOk = dbHealth?.ok ?? false

  return (
    <header
      style={{
        height: 56,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        flexShrink: 0,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
        {pageLabel}
      </h1>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12 }}>
        {/* DB health */}
        <div
          title={dbHealth?.result ?? 'Database not checked yet'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: dbOk ? 'var(--green)' : 'var(--red)',
          }}
        >
          <Database size={15} />
          <span style={{ fontWeight: 500 }}>{dbOk ? 'DB OK' : 'DB Error'}</span>
        </div>

        {/* Seeded stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--text-secondary)',
          }}
          title='Seeded active product count'
        >
          <Package size={15} />
          <span>{dbStats ? `${dbStats.productCount} products` : 'Products --'}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--orange)',
          }}
          title='Low stock products'
        >
          <AlertTriangle size={15} />
          <span>{dbStats ? `${dbStats.lowStockCount} low stock` : 'Low stock --'}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--red)',
          }}
          title='Expired active batches'
        >
          <ShieldAlert size={15} />
          <span>{dbStats ? `${dbStats.expiredBatchCount} expired` : 'Expired --'}</span>
        </div>

        {/* IPC status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: status.color,
          }}
        >
          <StatusIcon
            size={15}
            style={status.spin ? { animation: 'spin 1s linear infinite' } : undefined}
          />
          <span style={{ fontWeight: 500 }}>{status.label}</span>
        </div>

        {/* Sync placeholder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--text-secondary)',
          }}
        >
          <WifiOff size={15} />
          <span>Offline</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  )
}