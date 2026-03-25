import { useState, useEffect, useReducer, useRef, useCallback, useMemo } from 'react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  XCircle,
  Package,
  AlertTriangle,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle2,
} from 'lucide-react'
import type {
  PosProduct,
  CartItem,
  PaymentMethod,
  CheckoutFailedItem,
} from '../../../shared/types'

interface POSProps {
  cashierId: string
}

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
            ? {
                ...item,
                quantity: newQty,
                subtotal: newQty * item.product.price,
              }
            : item
        )
      }

      if (action.product.availableStock < 1) return state

      return [
        ...state,
        {
          product: action.product,
          quantity: 1,
          subtotal: action.product.price,
        },
      ]
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

        return {
          ...item,
          quantity: qty,
          subtotal: qty * item.product.price,
        }
      })
    }

    case 'CLEAR':
      return []

    default:
      return state
  }
}

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod
  label: string
  icon: typeof Banknote
}> = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'visa_card', label: 'Visa Card', icon: CreditCard },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
]

export function POS({ cashierId }: POSProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<PosProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [amountTenderedInput, setAmountTenderedInput] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [failedItems, setFailedItems] = useState<CheckoutFailedItem[]>([])
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const [cart, dispatch] = useReducer(cartReducer, [] as CartItem[])
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)

  const amountTendered = useMemo(() => {
    const parsed = Number(amountTenderedInput)
    return Number.isFinite(parsed) ? parsed : 0
  }, [amountTenderedInput])

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'cash') return 0
    return Math.max(amountTendered - cartTotal, 0)
  }, [amountTendered, cartTotal, paymentMethod])

  const cashShortfall = useMemo(() => {
    if (paymentMethod !== 'cash') return 0
    return Math.max(cartTotal - amountTendered, 0)
  }, [amountTendered, cartTotal, paymentMethod])

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

  useEffect(() => {
    if (!checkoutSuccess) return

    const timeout = setTimeout(() => setCheckoutSuccess(null), 3000)
    return () => clearTimeout(timeout)
  }, [checkoutSuccess])

  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setAmountTenderedInput('')
    }
  }, [paymentMethod])

  const clearCheckoutState = useCallback(() => {
    setCheckoutError(null)
    setFailedItems([])
    setCheckoutSuccess(null)
  }, [])

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
          setCheckoutError(null)
          setFailedItems([])
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
    setCheckoutError(null)
    setFailedItems([])
    searchInputRef.current?.focus()
  }, [])

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0 || isCheckingOut) return

    if (paymentMethod === 'cash' && amountTendered < cartTotal) {
      setCheckoutError('Amount received is less than the sale total.')
      setFailedItems([])
      return
    }

    setIsCheckingOut(true)
    setCheckoutError(null)
    setFailedItems([])
    setCheckoutSuccess(null)

    try {
      const result = await window.api.checkout({
        cashierId,
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? amountTendered : null,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      })

      if (!result.success) {
        setCheckoutError(result.error)
        setFailedItems(result.failedItems)
        return
      }

      dispatch({ type: 'CLEAR' })
      setSearchTerm('')
      setSearchResults([])
      setAmountTenderedInput('')
      setCheckoutSuccess(
        paymentMethod === 'cash'
          ? `Sale #${result.saleNumber} completed successfully • Change: ${fmt(result.changeGiven)}`
          : `Sale #${result.saleNumber} completed successfully`
      )
      searchInputRef.current?.focus()
    } catch (err) {
      console.error('[POS] Checkout failed:', err)
      setCheckoutError('Checkout failed. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }, [amountTendered, cart, cartTotal, cashierId, isCheckingOut, paymentMethod])

  const fmt = (amount: number) =>
    `MK ${amount.toLocaleString('en-MW', { minimumFractionDigits: 2 })}`

  const failedItemIds = new Set(failedItems.map((item) => item.productId))

  const checkoutDisabled =
    cart.length === 0 ||
    isCheckingOut ||
    (paymentMethod === 'cash' && amountTendered < cartTotal)

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
              onClick={() => {
                dispatch({ type: 'CLEAR' })
                clearCheckoutState()
                setAmountTenderedInput('')
              }}
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

        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Payment Method</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PAYMENT_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = paymentMethod === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => setPaymentMethod(option.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    background: active ? 'var(--accent)' : 'var(--bg-main)',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 8,
                    color: active ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              )
            })}
          </div>

          {paymentMethod === 'cash' && (
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Amount Received</div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountTenderedInput}
                  onChange={(e) => {
                    setAmountTenderedInput(e.target.value)
                    if (checkoutError === 'Amount received is less than the sale total.') {
                      setCheckoutError(null)
                    }
                  }}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Change</div>
                <div
                  style={{
                    height: 42,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: cashShortfall > 0 ? '#ef4444' : 'var(--accent)',
                    fontSize: 14,
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                >
                  {cashShortfall > 0 ? `Short by ${fmt(cashShortfall)}` : fmt(changeDue)}
                </div>
              </div>
            </div>
          )}
        </div>

        {(checkoutError || checkoutSuccess || failedItems.length > 0) && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            {checkoutSuccess && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: 8,
                  color: '#22c55e',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={16} />
                {checkoutSuccess}
              </div>
            )}

            {checkoutError && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 8,
                  color: '#ef4444',
                  fontSize: 13,
                  fontWeight: 500,
                  marginTop: checkoutSuccess ? 8 : 0,
                }}
              >
                {checkoutError}
              </div>
            )}

            {failedItems.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {failedItems.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      fontSize: 12,
                      color: '#f59e0b',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: 6,
                      padding: '8px 10px',
                    }}
                  >
                    {item.name}: requested {item.requested}, available {item.available}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
              const isFailed = failedItemIds.has(item.product.id)

              return (
                <div
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: isFailed ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
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
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
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

          <button
            onClick={handleCheckout}
            disabled={checkoutDisabled}
            style={{
              width: '100%',
              height: 42,
              border: 'none',
              borderRadius: 8,
              background: checkoutDisabled ? '#3A3F50' : 'var(--accent)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: checkoutDisabled ? 'not-allowed' : 'pointer',
              opacity: checkoutDisabled ? 0.7 : 1,
            }}
          >
            {isCheckingOut
              ? 'Processing checkout...'
              : `Complete Sale • ${PAYMENT_OPTIONS.find((p) => p.value === paymentMethod)?.label}`}
          </button>
        </div>
      </div>
    </div>
  )
}