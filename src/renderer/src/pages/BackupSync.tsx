import { HardDrive, RefreshCw, Usb, WifiOff, FolderArchive } from 'lucide-react'

export function BackupSync() {
  return (
    <div style={{ padding: 20, overflow: 'auto', height: '100%', maxWidth: 680 }}>
      {/* Sync Status */}
      <Section title="Sync Status" icon={WifiOff}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--text-secondary)',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Offline</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
          Last synced: —
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Pending records: 0
        </div>
        <button
          disabled
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'not-allowed',
            fontFamily: 'inherit',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RefreshCw size={14} /> Sync Now
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
          Sync engine — Phase 11
        </div>
      </Section>

      {/* Local Backups */}
      <Section title="Local Backups" icon={FolderArchive}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
          Last backup: —
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Available backups: none yet
        </div>
        <button
          disabled
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'not-allowed',
            fontFamily: 'inherit',
            opacity: 0.6,
          }}
        >
          Backup Now
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
          Auto-backup system — Phase 10
        </div>
      </Section>

      {/* USB Backup */}
      <Section title="USB Backup" icon={Usb}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          USB drive: not configured
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          USB drive backup will be configurable in Phase 10.
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof HardDrive
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: 20,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        marginBottom: 12,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Icon size={16} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
