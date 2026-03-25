import {
  Building2, Printer, Bell, Users, Info, ChevronRight,
} from 'lucide-react'

const SETTINGS_SECTIONS = [
  {
    title: 'Pharmacy Information',
    desc: 'Name, address, phone, license number, receipt footer',
    icon: Building2,
    status: 'Not configured',
    phase: 12,
  },
  {
    title: 'Printer',
    desc: 'Thermal printer selection, auto-print toggle, test print',
    icon: Printer,
    status: 'Not configured',
    phase: 7,
  },
  {
    title: 'Alerts',
    desc: 'Default low stock threshold, expiry warning window',
    icon: Bell,
    status: 'Defaults',
    phase: 12,
  },
  {
    title: 'Users',
    desc: 'Add cashiers, manage roles, deactivate accounts',
    icon: Users,
    status: '2 users (seed)',
    phase: 13,
  },
  {
    title: 'About',
    desc: 'Version, platform, check for updates',
    icon: Info,
    status: 'v1.0.0',
    phase: 12,
  },
]

export function Settings() {
  return (
    <div style={{ padding: 20, overflow: 'auto', height: '100%', maxWidth: 600 }}>
      {SETTINGS_SECTIONS.map(section => {
        const Icon = section.icon
        return (
          <div
            key={section.title}
            style={{
              padding: '14px 16px',
              background: 'var(--bg-card)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'not-allowed',
              opacity: 0.75,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{section.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {section.desc}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {section.status}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                Phase {section.phase}
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          </div>
        )
      })}
    </div>
  )
}
