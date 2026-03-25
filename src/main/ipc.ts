import { ipcMain, app } from 'electron'
import {
  getDbHealth,
  getDbStats,
  verifyUserPin,
  searchProducts,
  getProductByBarcode,
  processCheckout,
} from './db'

export function registerIpcHandlers(): void {
  ipcMain.handle('system:ping', async () => {
    return {
      success: true,
      timestamp: new Date().toISOString(),
    }
  })

  ipcMain.handle('system:get-app-info', async () => {
    return {
      version: app.getVersion(),
      dataPath: app.getPath('userData'),
      platform: process.platform,
      arch: process.arch,
    }
  })

  ipcMain.handle('db:get-health', async () => {
    return getDbHealth()
  })

  ipcMain.handle('db:get-stats', async () => {
    return getDbStats()
  })

  ipcMain.handle('auth:verify-pin', async (_event, input: { pin: string }) => {
    return verifyUserPin(input)
  })

  ipcMain.handle('pos:search-products', async (_event, term: string) => {
    return searchProducts(term)
  })

  ipcMain.handle('pos:get-product-by-barcode', async (_event, barcode: string) => {
    return getProductByBarcode(barcode)
  })

  ipcMain.handle('pos:checkout', async (_event, payload) => {
    return processCheckout(payload)
  })

  console.log('[IPC] All handlers registered')
}