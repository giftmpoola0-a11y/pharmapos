import { contextBridge, ipcRenderer } from 'electron'
import type { IpcApi } from '../shared/types'

const api: IpcApi = {
  ping: () => ipcRenderer.invoke('system:ping'),

  getAppInfo: () => ipcRenderer.invoke('system:get-app-info'),

  getDbHealth: () => ipcRenderer.invoke('db:get-health'),

  getDbStats: () => ipcRenderer.invoke('db:get-stats'),

  verifyPin: (input) => ipcRenderer.invoke('auth:verify-pin', input),

  searchProducts: (term) => ipcRenderer.invoke('pos:search-products', term),

  getProductByBarcode: (barcode) => ipcRenderer.invoke('pos:get-product-by-barcode', barcode),

  checkout: (payload) => ipcRenderer.invoke('pos:checkout', payload),
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api