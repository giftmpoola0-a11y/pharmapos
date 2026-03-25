import type { PageId, AppInfo, DbHealth, DbStats, User } from '../../../shared/types'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  currentPage: PageId
  currentUser: User
  ipcStatus: 'checking' | 'connected' | 'failed'
  appInfo: AppInfo | null
  dbHealth: DbHealth | null
  dbStats: DbStats | null
  onNavigate: (page: PageId) => void
  onLock: () => void
  children: React.ReactNode
}
export function Layout({
  currentPage,
  currentUser,
  ipcStatus,
  appInfo,
  dbHealth,
  dbStats,
  onNavigate,
  onLock,
  children,
}: LayoutProps) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        currentPage={currentPage}
        userRole={currentUser.role}
        userName={currentUser.fullName}
        appVersion={appInfo?.version ?? '1.0.0'}
        onNavigate={onNavigate}
        onLock={onLock}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header currentPage={currentPage} ipcStatus={ipcStatus} dbHealth={dbHealth} dbStats={dbStats} />

        <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
      </main>
    </div>
  )
}