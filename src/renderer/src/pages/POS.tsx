import { Search, ScanBarcode, ShoppingCart, Receipt } from 'lucide-react'

export function POS() {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* ─── Product Area ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search Bar */}
        <div style={{ padding: '16px 20px 12px', display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              placeholder='Search name, SKU, or barcode — press "/" to focus'
              disabled
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
                background: 'var(--bg-input)',
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            disabled
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg-card)',
              cursor: 'not-allowed',
              fontSize: 13,
              fontFamily: 'inherit',
              color: 'var(--text-secondary)',
            }}
          >
            <ScanBarcode size={16} />
            <span>Scan</span>
          </button>
        </div>

        {/* Category Pills Placeholder */}
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: 6 }}>
          {['All', 'Pain Relief', 'Antibiotics', 'Digestive', 'Allergy', 'Vitamins'].map(cat => (
            <span
              key={cat}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: cat === 'All' ? 'var(--accent)' : 'var(--border)',
                background: cat === 'All' ? 'var(--accent-light)' : 'var(--bg-card)',
                color: cat === 'All' ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Product Grid Placeholder */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '0 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <Search size={40} strokeWidth={1.5} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            POS — Phase 5
          </div>
          <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
            Product search, barcode scanning, and product grid will be connected to SQLite in Phase 5.
            Cart and FEFO checkout in Phase 6.
          </div>
        </div>
      </div>

      {/* ─── Cart Panel ───────────────────────────────── */}
      <div
        style={{
          width: 340,
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Cart Header */}
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Receipt size={18} />
          <span style={{ fontWeight: 700, fontSize: 14 }}>Current Sale</span>
        </div>

        {/* Empty Cart State */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            gap: 8,
          }}
        >
          <ShoppingCart size={32} strokeWidth={1.5} />
          <span style={{ fontSize: 13 }}>Cart is empty</span>
          <span style={{ fontSize: 11 }}>Click a product or scan a barcode</span>
        </div>

        {/* Cart Footer */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 14,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>MK 0.00</span>
          </div>
          <button
            disabled
            style={{
              width: '100%',
              padding: 12,
              border: 'none',
              borderRadius: 8,
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'not-allowed',
              fontFamily: 'inherit',
            }}
          >
            Charge MK 0.00
          </button>
        </div>
      </div>
    </div>
  )
}
