import { useState, useEffect, useCallback } from 'react'
import { Search, ArrowLeft, FileText, Banknote, CreditCard, Smartphone } from 'lucide-react'
import type { SaleHistoryItem, SaleDetail, PaymentMethod } from '../../../shared/types'

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; icon: typeof Banknote }> = {
  cash: { label: 'Cash', icon: Banknote },
  visa_card: { label: 'Visa Card', icon: CreditCard },
  mobile_money: { label: 'Mobile Money', icon: Smartphone },
}

const fmt = (amount: number) =>
  `MK ${amount.toLocaleString('en-MW', { minimumFractionDigits: 2 })}`

const fmtNullableMoney = (amount: number | null | undefined) =>
  amount == null ? '—' : fmt(amount)

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-MW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Reports() {
  const [sales, setSales] = useState<SaleHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSales = useCallback(async (saleNumber?: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.getSalesHistory({
        limit: 50,
        saleNumber: saleNumber ?? null,
      })
      setSales(result)
    } catch (err) {
      console.error('[Reports] Failed to load sales:', err)
      setError('Failed to load sales history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSales()
  }, [loadSales])

  const handleSearch = useCallback(() => {
    const trimmed = searchInput.trim()
    if (!trimmed) {
      void loadSales()
      return
    }

    const num = parseInt(trimmed, 10)
    if (isNaN(num)) {
      setError('Enter a valid sale number.')
      setSales([])
      return
    }

    void loadSales(num)
  }, [searchInput, loadSales])

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch()
    },
    [handleSearch]
  )

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    void loadSales()
  }, [loadSales])

  const openSale = useCallback(async (saleId: string) => {
    setDetailLoading(true)
    setError(null)
    try {
      const detail = await window.api.getSaleById(saleId)
      if (!detail) {
        setError('Sale not found.')
        return
      }
      setSelectedSale(detail)
    } catch (err) {
      console.error('[Reports] Failed to load sale detail:', err)
      setError('Failed to load sale details.')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const closeSale = useCallback(() => {
    setSelectedSale(null)
    setError(null)
  }, [])

  if (selectedSale) {
    const pay = PAYMENT_LABELS[selectedSale.paymentMethod]
    const PayIcon = pay.icon
    const showCashFields = selectedSale.paymentMethod === 'cash'

    return (
      <div
        style={{
          padding: 16,
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button
          onClick={closeSale}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 13,
            alignSelf: 'flex-start',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} />
          Back to Sales
        </button>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Sale #{selectedSale.saleNumber}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {formatDate(selectedSale.createdAt)}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <MetaField label="Cashier" value={selectedSale.cashierName} />
            <MetaField
              label="Payment"
              value={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PayIcon size={14} />
                  {pay.label}
                </span>
              }
            />
            <MetaField label="Subtotal" value={fmt(selectedSale.subtotal)} />
            <MetaField label="Total" value={fmt(selectedSale.totalAmount)} accent />

            {showCashFields && (
              <>
                <MetaField
                  label="Amount Tendered"
                  value={fmtNullableMoney(selectedSale.amountTendered)}
                />
                <MetaField
                  label="Change Given"
                  value={fmtNullableMoney(selectedSale.changeGiven)}
                />
              </>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-card)',
                  }}
                >
                  {['Product', 'SKU', 'Qty', 'Unit Price', 'Line Total'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 20px',
                        textAlign: i >= 2 ? 'right' : 'left',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {item.productName}
                    </td>
                    <td style={{ padding: '10px 20px', color: 'var(--text-muted)' }}>{item.sku}</td>
                    <td style={{ padding: '10px 20px', textAlign: 'right', color: 'var(--text-primary)' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '10px 20px', textAlign: 'right', color: 'var(--text-muted)' }}>
                      {fmt(item.unitPrice)}
                    </td>
                    <td
                      style={{
                        padding: '10px 20px',
                        textAlign: 'right',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                      }}
                    >
                      {fmt(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 16,
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by sale number..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {searchInput.trim() && (
          <button
            onClick={handleClearSearch}
            style={{
              padding: '0 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 8,
            color: '#ef4444',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          flex: 1,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading || detailLoading ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            Loading...
          </div>
        ) : sales.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              gap: 8,
            }}
          >
            <FileText size={32} style={{ opacity: 0.3 }} />
            <span>{searchInput.trim() ? 'No matching sales found' : 'No sales yet'}</span>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-card)',
                  }}
                >
                  {['Sale #', 'Date', 'Cashier', 'Payment', 'Items', 'Total'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: i >= 4 ? 'right' : 'left',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const pay = PAYMENT_LABELS[sale.paymentMethod]
                  const PayIcon = pay.icon

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => openSale(sale.id)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-main)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--accent)' }}>
                        #{sale.saleNumber}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>
                        {formatDate(sale.createdAt)}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-primary)' }}>
                        {sale.cashierName}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <PayIcon size={13} />
                          {pay.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {sale.itemCount}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {fmt(sale.totalAmount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaField({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: boolean
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: accent ? 700 : 500,
          color: accent ? 'var(--accent)' : 'var(--text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  )
}