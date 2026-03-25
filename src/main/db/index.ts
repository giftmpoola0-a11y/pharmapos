import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { runMigrations } from './migrate'
import { runSeedIfNeeded } from './seed'
import type { VerifyPinInput, VerifyPinResult, UserRole, PosProduct } from '../../shared/types'

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

interface ProductRow {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  available_stock: number
  requires_prescription: number
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
  const rows = database
    .prepare(
      `${PRODUCT_QUERY}
        AND (
          p.name LIKE '%' || ? || '%'
          OR p.sku LIKE '%' || ? || '%'
          OR p.barcode LIKE '%' || ? || '%'
        )
       LIMIT 20`
    )
    .all(term, term, term) as ProductRow[]

  return rows.map(mapProductRow)
}

export function getProductByBarcode(barcode: string): PosProduct | null {
  const database = getDb()
  const row = database
    .prepare(`${PRODUCT_QUERY} AND p.barcode = ?`)
    .get(barcode) as ProductRow | undefined

  return row ? mapProductRow(row) : null
}