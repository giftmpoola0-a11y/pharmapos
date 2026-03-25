import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

function buildSeedSql(): string {
  const ownerPinHash = bcrypt.hashSync('1111', 10)
  const cashierPinHash = bcrypt.hashSync('0000', 10)

  return `
INSERT INTO users (id, email, full_name, role, pin_hash, is_active)
VALUES
  ('owner-001', 'owner@pharmapos.local', 'Ahmad Banda', 'owner', '${ownerPinHash}', 1),
  ('cashier-001', 'cashier@pharmapos.local', 'Sara Phiri', 'cashier', '${cashierPinHash}', 1);

INSERT INTO products (id, name, sku, barcode, category, price, cost_price, low_stock_threshold, requires_prescription, is_active)
VALUES
  ('prod-001', 'Paracetamol 500mg', 'PCM500', '6901234567001', 'Pain Relief', 250, 150, 20, 0, 1),
  ('prod-002', 'Amoxicillin 250mg', 'AMX250', '6901234567002', 'Antibiotics', 875, 600, 10, 1, 1),
  ('prod-003', 'Ibuprofen 400mg', 'IBP400', '6901234567003', 'Pain Relief', 380, 220, 20, 0, 1),
  ('prod-004', 'Omeprazole 20mg', 'OMP020', '6901234567004', 'Digestive', 630, 420, 15, 0, 1),
  ('prod-005', 'Cough Syrup 100ml', 'CGH100', '6901234567005', 'Respiratory', 750, 500, 10, 0, 1);

INSERT INTO product_batches (id, product_id, batch_number, quantity, cost_price, expiry_date, received_by, is_active)
VALUES
  ('batch-001', 'prod-001', 'LOT-A01', 40, 140, '2026-12-01', 'owner-001', 1),
  ('batch-002', 'prod-001', 'LOT-B03', 80, 150, '2027-08-15', 'owner-001', 1),
  ('batch-003', 'prod-002', 'LOT-C11', 45, 600, '2026-10-20', 'owner-001', 1),
  ('batch-004', 'prod-003', 'LOT-D44', 8, 220, '2026-06-30', 'owner-001', 1),
  ('batch-005', 'prod-004', 'LOT-E02', 67, 420, '2026-04-20', 'owner-001', 1),
  ('batch-006', 'prod-005', 'LOT-X12', 5, 500, '2025-01-01', 'owner-001', 1);

INSERT INTO stock_movements (
  id, product_id, batch_id, movement_type, quantity_change, quantity_after, reference_id, reason, performed_by
)
VALUES
  ('move-001', 'prod-001', 'batch-001', 'restock', 40, 40, NULL, 'Initial seed batch', 'owner-001'),
  ('move-002', 'prod-001', 'batch-002', 'restock', 80, 80, NULL, 'Initial seed batch', 'owner-001'),
  ('move-003', 'prod-002', 'batch-003', 'restock', 45, 45, NULL, 'Initial seed batch', 'owner-001'),
  ('move-004', 'prod-003', 'batch-004', 'restock', 8, 8, NULL, 'Initial seed batch', 'owner-001'),
  ('move-005', 'prod-004', 'batch-005', 'restock', 67, 67, NULL, 'Initial seed batch', 'owner-001'),
  ('move-006', 'prod-005', 'batch-006', 'restock', 5, 5, NULL, 'Initial seed batch', 'owner-001');

INSERT INTO app_settings (key, value)
VALUES
  ('pharmacy_name', 'Pleasant Pharmacy'),
  ('pharmacy_address', '123 Glyn Jones Road, Blantyre'),
  ('pharmacy_phone', '0999 123 456'),
  ('pharmacy_license', 'PMPB/RET/2024/001'),
  ('receipt_footer_text', 'Thank you! Muchire Msanga akasi.'),
  ('default_low_stock_threshold', '10'),
  ('expiry_alert_days', '90'),
  ('last_sync_at', ''),
  ('last_backup_at', '')
ON CONFLICT(key) DO NOTHING;
`
}

export function runSeedIfNeeded(db: Database.Database): void {
  const existingUsers = db.prepare(`SELECT COUNT(*) AS count FROM users`).get() as { count: number }

  if (existingUsers.count > 0) return

  db.exec(buildSeedSql())
  console.log('[DB] Seed data inserted')
}