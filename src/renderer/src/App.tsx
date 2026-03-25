import { useState, useEffect, useCallback } from 'react'
import type { PageId, AppInfo, DbHealth, DbStats, User } from '../../shared/types'
import { verifyPin, lock } from './mock/auth'
import { Layout } from './components/Layout'
import { LockScreen } from './pages/LockScreen'
import { POS } from './pages/POS'
import { Products } from './pages/Products'
import { Inventory } from './pages/Inventory'
import { Reports } from './pages/Reports'
import { BackupSync } from './pages/BackupSync'
import { Settings } from './pages/Settings'

interface AppState {
  isLocked: boolean
  currentUser: User | null
  currentPage: PageId
  ipcStatus: 'checking' | 'connected' | 'failed'
  appInfo: AppInfo | null
  dbHealth: DbHealth | null
  dbStats: DbStats | null
}

export default function App() {
  const [state, setState] = useState<AppState>({
    isLocked: true,
    currentUser: null,
    currentPage: 'pos',
    ipcStatus: 'checking',
    appInfo: null,
    dbHealth: null,
    dbStats: null,
  })

  useEffect(() => {
    async function verifyFoundation() {
      try {
        const [pingResult, info, dbHealth, dbStats] = await Promise.all([
          window.api.ping(),
          window.api.getAppInfo(),
          window.api.getDbHealth(),
          window.api.getDbStats(),
        ])

        if (pingResult.success) {
          setState((s) => ({
            ...s,
            ipcStatus: 'connected',
            appInfo: info,
            dbHealth,
            dbStats,
          }))

          console.log('[IPC] Connected:', pingResult.timestamp)
          console.log('[App] Info:', info)
          console.log('[DB] Health:', dbHealth)
          console.log('[DB] Stats:', dbStats)
        }
      } catch (err) {
        console.error('[Foundation] Startup verification failed:', err)
        setState((s) => ({ ...s, ipcStatus: 'failed' }))
      }
    }

    void verifyFoundation()
  }, [])

  const handleUnlock = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const result = await verifyPin(pin)

      if (!result) {
        return false
      }

      setState((s) => ({
        ...s,
        isLocked: false,
        currentUser: result.user,
        currentPage: 'pos',
      }))

      return true
    } catch (err) {
      console.error('[Auth] Unlock failed:', err)
      return false
    }
  }, [])

  const handleLock = useCallback(() => {
    lock()
    setState((s) => ({
      ...s,
      isLocked: true,
      currentPage: 'pos',
    }))
  }, [])

  const handleNavigate = useCallback((page: PageId) => {
    setState((s) => ({ ...s, currentPage: page }))
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault()
        handleLock()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleLock])

  if (state.isLocked) {
    return (
      <LockScreen
        onUnlock={handleUnlock}
        userName={state.currentUser?.fullName ?? null}
        ipcStatus={state.ipcStatus}
        appInfo={state.appInfo}
      />
    )
  }

  const renderPage = () => {
    switch (state.currentPage) {
      case 'pos':
        return <POS cashierId={state.currentUser!.id} />
      case 'products':
        return <Products />
      case 'inventory':
        return <Inventory />
      case 'reports':
        return <Reports />
      case 'backup-sync':
        return <BackupSync />
      case 'settings':
        return <Settings />
      default:
        return <POS cashierId={state.currentUser!.id} />
    }
  }

  return (
    <Layout
      currentPage={state.currentPage}
      currentUser={state.currentUser!}
      ipcStatus={state.ipcStatus}
      appInfo={state.appInfo}
      dbHealth={state.dbHealth}
      dbStats={state.dbStats}
      onNavigate={handleNavigate}
      onLock={handleLock}
    >
      {renderPage()}
    </Layout>
  )
}