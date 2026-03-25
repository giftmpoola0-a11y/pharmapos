import { Package, Plus, Search } from 'lucide-react'

export function Products() {
  return (
    <div style={{ padding: 20, overflow: 'auto', height: '100%' }}>
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Product catalog — Phase 4
          </div>
        </div>
        <button
          disabled
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'not-allowed',
            fontFamily: 'inherit',
            opacity: 0.6,
          }}
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Table Placeholder */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
              {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Expiry', 'Status'].map(h => (
                <th
                  key={h}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={7}
                style={{
                  padding: 48,
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <Package
                  size={32}
                  strokeWidth={1.5}
                  style={{ margin: '0 auto 8px', display: 'block' }}
                />
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  No products loaded
                </div>
                <div style={{ fontSize: 12 }}>
                  Product CRUD and batch management will be connected to SQLite in Phase 4.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
