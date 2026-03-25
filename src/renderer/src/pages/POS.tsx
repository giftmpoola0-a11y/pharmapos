import { useState, useEffect, useReducer, useRef, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, XCircle, Package, AlertTriangle } from 'lucide-react'
import type { PosProduct, CartItem } from '../../../shared/types'

type CartAction =
  | { type: 'ADD_ITEM'; product: PosProduct }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'SET_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' }

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((item) => item.product.id === action.product.id)
      if (existing) {
        const newQty = existing.quantity + 1
        if (newQty > action.product.availableStock) return state
        return state.map((item) =>
          item.product.id === action.product.id
            ? { ...item, quantity: newQty, subtotal: newQty * item.product.price }
            : item
        )
      }

      if (action.product.availableStock < 1) return state

      return [...state, { product: action.product, quantity: 1, subtotal: action.product.price }]
    }

    case 'REMOVE_ITEM':
      return state.filter((item) => item.product.id !== action.productId)

    case 'SET_QTY': {
      if (action.quantity < 1) {
        return state.filter((item) => item.product.id !== action.productId)
      }

      return state.map((item) => {
        if (item.product.id !== action.productId) return item
        const qty = Math.min(action.quantity, item.product.availableStock)
        return { ...item, quantity: qty, subtotal: qty * item.product.price }
      })
    }

    case 'CLEAR':
      return []

    default:
      return state
  }
}

export function POS() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<PosProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [cart, dispatch] = useReducer(cartReducer, [] as CartItem[])
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)

  useEffect(() => {
    const trimmed = searchTerm.trim()

    if (!trimmed) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    const timeout = setTimeout(async () => {
      try {
        const results = await window.api.searchProducts(trimmed)
        setSearchResults(results)
      } catch (err) {
        console.error('[POS] Search failed:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchTerm])

  const handleSearchKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return

      const trimmed = searchTerm.trim()
      if (!trimmed) return

      try {
        const product = await window.api.getProductByBarcode(trimmed)
        if (product) {
          dispatch({ type: 'ADD_ITEM', product })
          setSearchTerm('')
          setSearchResults([])
        }
      } catch (err) {
        console.error('[POS] Barcode lookup failed:', err)
      }
    },
    [searchTerm]
  )

  const handleAddProduct = useCallback((product: PosProduct) => {
    dispatch({ type: 'ADD_ITEM', product })
    setSearchTerm('')
    setSearchResults([])
    searchInputRef.current?.focus()
  }, [])

  const fmt = (amount: number) =>
    `MK ${amount.toLocaleString('en-MW', { minimumFractionDigits: 2 })}`

  return (
    <div style={{ display: 'flex', height: '100%', gap: 16, padding: 16, boxSizing: 'border-box' }}>
      <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
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
            ref={searchInputRef}
            type="text"
            placeholder="Search name, SKU, or scan barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            autoFocus
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

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {isSearching && (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Searching...
            </div>
          )}

          {!isSearching && searchTerm.trim() && searchResults.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No products found
            </div>
          )}

          {searchResults.map((product) => {
            const inCart = cart.find((item) => item.product.id === product.id)
            const outOfStock = product.availableStock < 1
            const cartAtMax = inCart ? inCart.quantity >= product.availableStock : false

            return (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product)}
                disabled={outOfStock || cartAtMax}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  cursor: outOfStock || cartAtMax ? 'not-allowed' : 'pointer',
                  opacity: outOfStock || cartAtMax ? 0.5 : 1,
                  textAlign: 'left',
                  width: '100%',
                  color: 'var(--text-primary)',
                  transition: 'background 0.15s',
                }}
              >
                <Package size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.name}
                    {product.requiresPrescription && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>
                        Rx
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {product.sku}
                    {product.barcode && ` · ${product.barcode}`}
                    {' · '}
                    <span style={{ color: outOfStock ? '#ef4444' : 'var(--text-muted)' }}>
                      {outOfStock ? 'Out of stock' : `${product.availableStock} in stock`}
                    </span>
                    {inCart && (
                      <span style={{ color: 'var(--accent)', marginLeft: 4 }}>
                        ({inCart.quantity} in cart)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, flexShrink: 0, color: 'var(--text-primary)' }}>
                  {fmt(product.price)}
                </div>
              </button>
            )
          })}

          {!searchTerm.trim() && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: 'var(--text-muted)',
                fontSize: 13,
                gap: 8,
                padding: 32,
              }}
            >
              <Search size={32} style={{ opacity: 0.3 }} />
              <span>Search for products or scan a barcode</span>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
          </span>

          {cart.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'CLEAR' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid #ef4444',
                borderRadius: 6,
                color: '#ef4444',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <XCircle size={13} />
              Clear
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {cart.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                fontSize: 13,
                gap: 8,
              }}
            >
              <Package size={32} style={{ opacity: 0.3 }} />
              <span>Cart is empty</span>
            </div>
          ) : (
            cart.map((item) => {
              const atMax = item.quantity >= item.product.availableStock

              return (
                <div
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {fmt(item.product.price)} each
                      {atMax && (
                        <span style={{ color: '#f59e0b', marginLeft: 6 }}>
                          <AlertTriangle size={10} style={{ verticalAlign: 'middle' }} /> Max stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() =>
                        dispatch({
                          type: 'SET_QTY',
                          productId: item.product.id,
                          quantity: item.quantity - 1,
                        })
                      }
                      style={{
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      <Minus size={14} />
                    </button>

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val)) {
                          dispatch({
                            type: 'SET_QTY',
                            productId: item.product.id,
                            quantity: val,
                          })
                        }
                      }}
                      min={1}
                      max={item.product.availableStock}
                      style={{
                        width: 44,
                        height: 28,
                        textAlign: 'center',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        outline: 'none',
                        MozAppearance: 'textfield',
                      }}
                    />

                    <button
                      onClick={() =>
                        dispatch({
                          type: 'SET_QTY',
                          productId: item.product.id,
                          quantity: item.quantity + 1,
                        })
                      }
                      disabled={atMax}
                      style={{
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: atMax ? 'var(--text-muted)' : 'var(--text-primary)',
                        cursor: atMax ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        opacity: atMax ? 0.5 : 1,
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div
                    style={{
                      width: 90,
                      textAlign: 'right',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {fmt(item.subtotal)}
                  </div>

                  <button
                    onClick={() => dispatch({ type: 'REMOVE_ITEM', productId: item.product.id })}
                    style={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      borderRadius: 6,
                      opacity: 0.7,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div
          style={{
            padding: '16px',
            borderTop: '2px solid var(--border)',
            background: 'var(--bg-sidebar)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
              {fmt(cartTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}