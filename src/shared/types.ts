export interface IpcApi {
  ping: () => Promise<{ success: true; timestamp: string }>
  getAppInfo: () => Promise<AppInfo>
  getDbHealth: () => Promise<DbHealth>
  getDbStats: () => Promise<DbStats>
  verifyPin: (input: VerifyPinInput) => Promise<VerifyPinResult>
}

export interface AppInfo {
  version: string
  dataPath: string
  platform: NodeJS.Platform
  arch: string
}

export interface DbHealth {
  ok: boolean
  result: string
  dbPath: string
}

export interface DbStats {
  userCount: number
  productCount: number
  batchCount: number
  lowStockCount: number
  expiredBatchCount: number
}

export type UserRole = 'owner' | 'cashier'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface VerifyPinInput {
  pin: string
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface VerifyPinSuccess {
  success: true
  user: AuthUser
}

export interface VerifyPinError {
  success: false
  error: string
}

export type VerifyPinResult = VerifyPinSuccess | VerifyPinError

export type PageId =
  | 'pos'
  | 'products'
  | 'inventory'
  | 'reports'
  | 'backup-sync'
  | 'settings'

export interface NavItem {
  id: PageId
  label: string
  ownerOnly: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'pos', label: 'POS', ownerOnly: false },
  { id: 'products', label: 'Products', ownerOnly: true },
  { id: 'inventory', label: 'Inventory', ownerOnly: true },
  { id: 'reports', label: 'Reports', ownerOnly: true },
  { id: 'backup-sync', label: 'Backup & Sync', ownerOnly: true },
  { id: 'settings', label: 'Settings', ownerOnly: true },
]