import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { runMigrations } from './migrate'
import { runSeedIfNeeded } from './seed'
import type {
  VerifyPinInput,
  VerifyPinResult,
  UserRole,
  PosProduct,
  CheckoutPayload,
  CheckoutResult,
  CheckoutFailedItem,
  GetSalesHistoryInput,
  SaleHistoryItem,
  SaleDetail,
  SaleLineItem,
  PharmacyInfo,
} from '../../shared/types'

let db: Database.Database | null = null

export interface DbStats {
  userCount: number
  productCount: number
  batchCount: number
  lowStockCount: number
  expiredBatchCount: number
}

interface UserRow {
  id: string
  email: string
  full_name: string
  role: UserRole
  pin_hash: string | null
  pin_attempts: number
  is_active: number
  created_at: string
  last_login_at: string | null
}

interface ProductRow {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  available_stock: number
  requires_prescription: number
}

interface CheckoutProductRow {
  id: string
  name: string
  sku: string
  price: number
  available_stock: number
}

interface BatchRow {
  id: string
  quantity: number
  expiry_date: string
  received_at: string
}

interface SettingRow {
  key: string
  value: string
}

const PRODUCT_QUERY = `
  SELECT
    p.id,
    p.name,
    p.sku,
    p.barcode,
    p.price,
    COALESCE(vs.total_stock, 0) AS available_stock,
    p.requires_prescription
  FROM products p
  LEFT JOIN v_product_stock vs ON vs.product_id = p.id
  WHERE p.is_active = 1
`

export function getDbPath(): string {
  const dataDir = app.getPath('userData')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
  return join(dataDir, 'pharmacy.db')
}

export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = getDbPath()
  const instance = new Database(dbPath)

  instance.pragma('journal_mode = WAL')
  instance.pragma('foreign_keys = ON')
  instance.pragma('busy_timeout = 5000')

  runMigrations(instance)
  runSeedIfNeeded(instance)

  db = instance
  return db
}

export function getDb(): Database.Database {
  if (!db) {
    return initDatabase()
  }
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function getDbHealth() {
  const database = getDb()
  const row = database.prepare('PRAGMA integrity_check').get() as Record<string, string>
  const result = Object.values(row)[0] ?? 'unknown'
  return {
    ok: result === 'ok',
    result,
    dbPath: getDbPath(),
  }
}

export function getDbStats(): DbStats {
  const database = getDb()

  const userCount =
    (database.prepare(`SELECT COUNT(*) AS count FROM users WHERE is_active = 1`).get() as { count: number })
      .count ?? 0

  const productCount =
    (database.prepare(`SELECT COUNT(*) AS count FROM products WHERE is_active = 1`).get() as { count: number })
      .count ?? 0

  const batchCount =
    (database.prepare(`SELECT COUNT(*) AS count FROM product_batches WHERE is_active = 1`).get() as {
      count: number
    }).count ?? 0

  const lowStockCount =
    (
      database
        .prepare(
          `
      SELECT COUNT(*) AS count
      FROM (
        SELECT
          p.id
        FROM products p
        LEFT JOIN product_batches pb
          ON pb.product_id = p.id
         AND pb.is_active = 1
        WHERE p.is_active = 1
        GROUP BY p.id, p.low_stock_threshold
        HAVING COALESCE(SUM(pb.quantity), 0) <= p.low_stock_threshold
      ) t
      `
        )
        .get() as { count: number }
    ).count ?? 0

  const expiredBatchCount =
    (
      database
        .prepare(
          `
      SELECT COUNT(*) AS count
      FROM product_batches
      WHERE is_active = 1
        AND quantity > 0
        AND date(expiry_date) <= date('now')
      `
        )
        .get() as { count: number }
    ).count ?? 0

  return {
    userCount,
    productCount,
    batchCount,
    lowStockCount,
    expiredBatchCount,
  }
}

export function verifyUserPin(input: VerifyPinInput): VerifyPinResult {
  const pin = input.pin?.trim()

  if (!pin || !/^\d{4}$/.test(pin)) {
    return {
      success: false,
      error: 'PIN must be exactly 4 digits',
    }
  }

  const database = getDb()

  const users = database
    .prepare(
      `
      SELECT
        id,
        email,
        full_name,
        role,
        pin_hash,
        pin_attempts,
        is_active,
        created_at,
        last_login_at
      FROM users
      `
    )
    .all() as UserRow[]

  const matchedUser = users.find((user) => {
    if (!user.pin_hash || !user.is_active) return false
    return bcrypt.compareSync(pin, user.pin_hash)
  })

  if (!matchedUser) {
    return {
      success: false,
      error: 'Invalid PIN',
    }
  }

  const now = new Date().toISOString()

  database
    .prepare(
      `
      UPDATE users
      SET last_login_at = ?, pin_attempts = 0
      WHERE id = ?
      `
    )
    .run(now, matchedUser.id)

  return {
    success: true,
    user: {
      id: matchedUser.id,
      email: matchedUser.email,
      fullName: matchedUser.full_name,
      role: matchedUser.role,
      isActive: Boolean(matchedUser.is_active),
      createdAt: matchedUser.created_at,
      lastLoginAt: now,
    },
  }
}

function mapProductRow(row: ProductRow): PosProduct {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    price: row.price,
    availableStock: row.available_stock,
    requiresPrescription: Boolean(row.requires_prescription),
  }
}

export function searchProducts(term: string): PosProduct[] {
  const database = getDb()
  const trimmed = term.trim()
  if (!trimmed) return []

  const rows = database
    .prepare(
      `${PRODUCT_QUERY}
        AND (
          p.name LIKE '%' || ? || '%'
          OR p.sku LIKE '%' || ? || '%'
          OR p.barcode LIKE '%' || ? || '%'
        )
       ORDER BY p.name COLLATE NOCASE
       LIMIT 20`
    )
    .all(trimmed, trimmed, trimmed) as ProductRow[]

  return rows.map(mapProductRow)
}

export function getProductByBarcode(barcode: string): PosProduct | null {
  const database = getDb()
  const trimmed = barcode.trim()
  if (!trimmed) return null

  const row = database
    .prepare(`${PRODUCT_QUERY} AND p.barcode = ?`)
    .get(trimmed) as ProductRow | undefined

  return row ? mapProductRow(row) : null
}

export function processCheckout(payload: CheckoutPayload): CheckoutResult {
  const database = getDb()

  if (!payload.cashierId) {
    return {
      success: false,
      error: 'Missing cashier ID',
      failedItems: [],
    }
  }

  if (!payload.items.length) {
    return {
      success: false,
      error: 'Cart is empty',
      failedItems: [],
    }
  }

  const tx = database.transaction((input: CheckoutPayload): CheckoutResult => {
    const failedItems: CheckoutFailedItem[] = []

    const productRows = database.prepare(
      `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.price,
        COALESCE(vs.total_stock, 0) AS available_stock
      FROM products p
      LEFT JOIN v_product_stock vs ON vs.product_id = p.id
      WHERE p.is_active = 1
        AND p.id = ?
      `
    )

    for (const item of input.items) {
      const product = productRows.get(item.productId) as CheckoutProductRow | undefined

      if (!product) {
        failedItems.push({
          productId: item.productId,
          name: 'Unknown product',
          requested: item.quantity,
          available: 0,
        })
        continue
      }

      if (item.quantity < 1 || product.available_stock < item.quantity) {
        failedItems.push({
          productId: product.id,
          name: product.name,
          requested: item.quantity,
          available: product.available_stock,
        })
      }
    }

    if (failedItems.length > 0) {
      return {
        success: false,
        error: 'Some items are no longer available in the requested quantity',
        failedItems,
      }
    }

    const seqRow = database.prepare(`SELECT next_val FROM sale_number_seq LIMIT 1`).get() as {
      next_val: number
    }

    const saleNumber = seqRow.next_val
    const saleId = randomUUID()
    const now = new Date().toISOString()

    const subtotal = input.items.reduce((sum, item) => {
      const product = productRows.get(item.productId) as CheckoutProductRow
      return sum + product.price * item.quantity
    }, 0)

    const total = subtotal

    let amountTendered: number | null = null
    let changeGiven = 0

    if (input.paymentMethod === 'cash') {
      amountTendered = input.amountTendered ?? null

      if (amountTendered === null || !Number.isFinite(amountTendered)) {
        return {
          success: false,
          error: 'Amount received is required for cash payments',
          failedItems: [],
        }
      }

      if (amountTendered < total) {
        return {
          success: false,
          error: 'Amount received is less than the sale total',
          failedItems: [],
        }
      }

      changeGiven = amountTendered - total
    }

    database
      .prepare(
        `
        INSERT INTO sales (
          id,
          sale_number,
          cashier_id,
          subtotal,
          discount_value,
          discount_amount,
          total,
          payment_method,
          amount_tendered,
          change_given,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, 'completed', ?)
        `
      )
      .run(
        saleId,
        saleNumber,
        input.cashierId,
        subtotal,
        total,
        input.paymentMethod,
        amountTendered,
        changeGiven,
        now
      )

    for (const item of input.items) {
      const product = productRows.get(item.productId) as CheckoutProductRow

      const batches = database
        .prepare(
          `
          SELECT
            id,
            quantity,
            expiry_date,
            received_at
          FROM product_batches
          WHERE product_id = ?
            AND is_active = 1
            AND quantity > 0
          ORDER BY date(expiry_date) ASC, datetime(received_at) ASC
          `
        )
        .all(item.productId) as BatchRow[]

      let remainingToDeduct = item.quantity

      for (const batch of batches) {
        if (remainingToDeduct <= 0) break

        const deductQty = Math.min(remainingToDeduct, batch.quantity)
        const newBatchQty = batch.quantity - deductQty

        database
          .prepare(
            `
            UPDATE product_batches
            SET quantity = ?
            WHERE id = ?
            `
          )
          .run(newBatchQty, batch.id)

        database
          .prepare(
            `
            INSERT INTO sale_items (
              id,
              sale_id,
              product_id,
              batch_id,
              product_name,
              product_sku,
              quantity,
              unit_price,
              line_total,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
          )
          .run(
            randomUUID(),
            saleId,
            product.id,
            batch.id,
            product.name,
            product.sku,
            deductQty,
            product.price,
            deductQty * product.price,
            now
          )

        database
          .prepare(
            `
            INSERT INTO stock_movements (
              id,
              product_id,
              batch_id,
              movement_type,
              quantity_change,
              quantity_after,
              reference_id,
              reason,
              performed_by,
              created_at
            ) VALUES (?, ?, ?, 'sale', ?, ?, ?, ?, ?, ?)
            `
          )
          .run(
            randomUUID(),
            product.id,
            batch.id,
            -deductQty,
            newBatchQty,
            saleId,
            `Sale #${saleNumber}`,
            input.cashierId,
            now
          )

        remainingToDeduct -= deductQty
      }

      if (remainingToDeduct > 0) {
        throw new Error(`Stock deduction failed for product ${product.id}`)
      }
    }

    database.prepare(`UPDATE sale_number_seq SET next_val = next_val + 1`).run()

    return {
      success: true,
      saleId,
      saleNumber,
      changeGiven,
    }
  })

  try {
    return tx(payload)
  } catch (error) {
    console.error('[DB] Checkout failed:', error)
    return {
      success: false,
      error: 'Checkout failed. No changes were saved.',
      failedItems: [],
    }
  }
}

// ─── Sales History ───

export function getSalesHistory(input: GetSalesHistoryInput): SaleHistoryItem[] {
  const database = getDb()
  const limit = input.limit ?? 50

  if (input.saleNumber != null) {
    const row = database
      .prepare(
        `
        SELECT
          s.id,
          s.sale_number   AS saleNumber,
          u.full_name     AS cashierName,
          s.payment_method AS paymentMethod,
          s.total          AS totalAmount,
          (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS itemCount,
          s.created_at     AS createdAt
        FROM sales s
        JOIN users u ON u.id = s.cashier_id
        WHERE s.sale_number = ?
        LIMIT 1
        `
      )
      .get(input.saleNumber) as SaleHistoryItem | undefined

    return row ? [row] : []
  }

  return database
    .prepare(
      `
      SELECT
        s.id,
        s.sale_number   AS saleNumber,
        u.full_name     AS cashierName,
        s.payment_method AS paymentMethod,
        s.total          AS totalAmount,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS itemCount,
        s.created_at     AS createdAt
      FROM sales s
      JOIN users u ON u.id = s.cashier_id
      ORDER BY s.created_at DESC
      LIMIT ?
      `
    )
    .all(limit) as SaleHistoryItem[]
}

export function getSaleById(saleId: string): SaleDetail | null {
  const database = getDb()

  const sale = database
    .prepare(
      `
      SELECT
        s.id,
        s.sale_number    AS saleNumber,
        u.full_name      AS cashierName,
        s.payment_method AS paymentMethod,
        s.subtotal,
        s.total           AS totalAmount,
        s.amount_tendered AS amountTendered,
        s.change_given    AS changeGiven,
        s.created_at      AS createdAt
      FROM sales s
      JOIN users u ON u.id = s.cashier_id
      WHERE s.id = ?
      `
    )
    .get(saleId) as Omit<SaleDetail, 'items'> | undefined

  if (!sale) return null

  const items = database
    .prepare(
      `
      SELECT
        si.product_name AS productName,
        si.product_sku  AS sku,
        si.quantity,
        si.unit_price   AS unitPrice,
        si.line_total   AS lineTotal
      FROM sale_items si
      WHERE si.sale_id = ?
      ORDER BY si.rowid
      `
    )
    .all(saleId) as SaleLineItem[]

  return { ...sale, items }
}

// ─── Pharmacy Info ───

export function getPharmacyInfo(): PharmacyInfo {
  const database = getDb()

  const rows = database
    .prepare(
      `
      SELECT key, value
      FROM app_settings
      WHERE key IN (
        'pharmacy_name',
        'pharmacy_address',
        'pharmacy_phone',
        'pharmacy_license',
        'receipt_footer_text'
      )
      `
    )
    .all() as SettingRow[]

  const map = new Map(rows.map((r) => [r.key, r.value]))

  return {
    name: map.get('pharmacy_name') ?? '',
    address: map.get('pharmacy_address') ?? '',
    phone: map.get('pharmacy_phone') ?? '',
    license: map.get('pharmacy_license') ?? '',
    receiptFooter: map.get('receipt_footer_text') ?? '',
  }
}