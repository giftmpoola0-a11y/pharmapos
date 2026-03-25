export interface IpcApi {
  ping: () => Promise<{ success: true; timestamp: string }>
  getAppInfo: () => Promise<AppInfo>
  getDbHealth: () => Promise<DbHealth>
  getDbStats: () => Promise<DbStats>
  verifyPin: (input: VerifyPinInput) => Promise<VerifyPinResult>
  searchProducts: (term: string) => Promise<PosProduct[]>
  getProductByBarcode: (barcode: string) => Promise<PosProduct | null>
  checkout: (payload: CheckoutPayload) => Promise<CheckoutResult>
  getSalesHistory: (input: GetSalesHistoryInput) => Promise<SaleHistoryItem[]>
  getSaleById: (saleId: string) => Promise<SaleDetail | null>
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

export interface PosProduct {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  availableStock: number
  requiresPrescription: boolean
}

export interface CartItem {
  product: PosProduct
  quantity: number
  subtotal: number
}

export type PaymentMethod = 'cash' | 'visa_card' | 'mobile_money'

export interface CheckoutItemInput {
  productId: string
  quantity: number
}

export interface CheckoutPayload {
  cashierId: string
  paymentMethod: PaymentMethod
  items: CheckoutItemInput[]
  amountTendered?: number | null
}

export interface CheckoutFailedItem {
  productId: string
  name: string
  requested: number
  available: number
}

export interface CheckoutSuccess {
  success: true
  saleId: string
  saleNumber: number
  changeGiven: number
}

export interface CheckoutError {
  success: false
  error: string
  failedItems: CheckoutFailedItem[]
}

export type CheckoutResult = CheckoutSuccess | CheckoutError

export interface GetSalesHistoryInput {
  limit?: number
  saleNumber?: number | null
}

export interface SaleHistoryItem {
  id: string
  saleNumber: number
  cashierName: string
  paymentMethod: PaymentMethod
  totalAmount: number
  itemCount: number
  createdAt: string
}

export interface SaleLineItem {
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface SaleDetail {
  id: string
  saleNumber: number
  cashierName: string
  paymentMethod: PaymentMethod
  subtotal: number
  totalAmount: number
  amountTendered: number | null
  changeGiven: number
  createdAt: string
  items: SaleLineItem[]
}

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