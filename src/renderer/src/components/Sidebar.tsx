import { useState } from 'react'
import {
  Monitor, Package, LayoutGrid, BarChart3, HardDrive,
  Settings, Lock, ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { PageId, UserRole } from '../../../shared/types'
import { NAV_ITEMS } from '../../../shared/types'

interface SidebarProps {
  currentPage: PageId
  userRole: UserRole
  userName: string
  appVersion: string
  onNavigate: (page: PageId) => void
  onLock: () => void
}

const PAGE_ICONS: Record<PageId, typeof Monitor> = {
  pos: Monitor,
  products: Package,
  inventory: LayoutGrid,
  reports: BarChart3,
  'backup-sync': HardDrive,
  settings: Settings,
}

export function Sidebar({
  currentPage,
  userRole,
  userName,
  appVersion,
  onNavigate,
  onLock,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = NAV_ITEMS.filter(
    item => !item.ownerOnly || userRole === 'owner'
  )

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside
      style={{
        width: collapsed ? 64 : 220,
        background: 'var(--bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
      }}
    >
      {/* ─── Logo ──────────────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '20px 12px 20px' : '20px 20px 20px',
          borderBottom: '1px solid #252836',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 72,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Rx</span>
        </div>
        {!collapsed && (
          <div style={{ animation: 'fadeIn 0.15s ease' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
              PharmaPOS
            </div>
            <div style={{ color: 'var(--text-sidebar)', fontSize: 11 }}>
              v{appVersion}
            </div>
          </div>
        )}
      </div>

      {/* ─── Nav Items ─────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visibleItems.map(item => {
          const Icon = PAGE_ICONS[item.id]
          const active = currentPage === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'var(--bg-sidebar-active)' : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                width: '100%',
                color: active ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-sidebar-hover)'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* ─── Collapse Toggle ───────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          margin: '0 8px 8px',
          background: 'transparent',
          border: '1px solid #252836',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'var(--text-sidebar)',
          fontFamily: 'inherit',
          fontSize: 12,
          gap: 6,
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        {!collapsed && 'Collapse'}
      </button>

      {/* ─── User + Lock ───────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '16px 8px' : '16px 16px',
          borderTop: '1px solid #252836',
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          gap: collapsed ? 8 : 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#252836',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3B4',
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </div>
            <div style={{ color: 'var(--text-sidebar)', fontSize: 11, textTransform: 'capitalize' }}>
              {userRole}
            </div>
          </div>
        )}
        <button
          onClick={onLock}
          title="Lock (Ctrl+L)"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-sidebar)',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={16} />
        </button>
      </div>
    </aside>
  )
}
