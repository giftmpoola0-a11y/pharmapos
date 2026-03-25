import Database from 'better-sqlite3'

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'cashier')),
  pin_hash      TEXT,
  pin_attempts  INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT,
  synced_at     TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  sku                   TEXT NOT NULL UNIQUE,
  barcode               TEXT UNIQUE,
  category              TEXT NOT NULL DEFAULT 'General',
  price                 REAL NOT NULL CHECK (price >= 0),
  cost_price            REAL,
  low_stock_threshold   INTEGER NOT NULL DEFAULT 10,
  requires_prescription INTEGER NOT NULL DEFAULT 0,
  is_active             INTEGER NOT NULL DEFAULT 1,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at             TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS product_batches (
  id            TEXT PRIMARY KEY,
  product_id    TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_number  TEXT,
  quantity      INTEGER NOT NULL CHECK (quantity >= 0),
  cost_price    REAL,
  expiry_date   TEXT NOT NULL,
  received_at   TEXT NOT NULL DEFAULT (datetime('now')),
  received_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_fefo ON product_batches(product_id, expiry_date)
  WHERE is_active = 1 AND quantity > 0;
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON product_batches(expiry_date)
  WHERE is_active = 1 AND quantity > 0;

CREATE TABLE IF NOT EXISTS sales (
  id              TEXT PRIMARY KEY,
  sale_number     INTEGER NOT NULL UNIQUE,
  cashier_id      TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subtotal        REAL NOT NULL,
  discount_type   TEXT CHECK (discount_type IN ('flat', 'percent') OR discount_type IS NULL),
  discount_value  REAL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  total           REAL NOT NULL,
  payment_method  TEXT NOT NULL DEFAULT 'cash',
  amount_tendered REAL,
  change_given    REAL,
  status          TEXT NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('completed', 'voided', 'partially_refunded')),
  parent_sale_id  TEXT REFERENCES sales(id) ON DELETE SET NULL,
  voided_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
  voided_at       TEXT,
  void_reason     TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

CREATE TABLE IF NOT EXISTS sale_number_seq (
  next_val INTEGER NOT NULL DEFAULT 1
);

INSERT INTO sale_number_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM sale_number_seq);

CREATE TABLE IF NOT EXISTS sale_items (
  id            TEXT PRIMARY KEY,
  sale_id       TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id      TEXT NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
  product_name  TEXT NOT NULL,
  product_sku   TEXT NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    REAL NOT NULL,
  line_total    REAL NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id               TEXT PRIMARY KEY,
  product_id       TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id         TEXT NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
  movement_type    TEXT NOT NULL CHECK (
    movement_type IN (
      'sale',
      'void_reversal',
      'refund_restock',
      'restock',
      'adjustment',
      'expired_removal'
    )
  ),
  quantity_change  INTEGER NOT NULL,
  quantity_after   INTEGER NOT NULL,
  reference_id     TEXT,
  reason           TEXT,
  performed_by     TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_batch ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_type ON stock_movements(movement_type);

CREATE TABLE IF NOT EXISTS sync_queue (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name    TEXT NOT NULL,
  operation     TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  record_id     TEXT NOT NULL,
  record_data   TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at     TEXT,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  last_error    TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_pending ON sync_queue(synced_at) WHERE synced_at IS NULL;

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE VIEW IF NOT EXISTS v_product_stock AS
SELECT
  p.id AS product_id,
  COALESCE(SUM(CASE WHEN pb.is_active = 1 THEN pb.quantity ELSE 0 END), 0) AS total_stock,
  MIN(CASE
    WHEN pb.is_active = 1 AND pb.quantity > 0 THEN pb.expiry_date
    ELSE NULL
  END) AS nearest_expiry
FROM products p
LEFT JOIN product_batches pb ON pb.product_id = p.id
GROUP BY p.id;
`

export function runMigrations(db: Database.Database): void {
  db.exec(INIT_SQL)
  console.log('[DB] Base schema ensured')
}