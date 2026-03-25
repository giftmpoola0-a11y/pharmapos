import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { AppInfo } from '../../../shared/types'

interface LockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>
  userName: string | null
  ipcStatus: 'checking' | 'connected' | 'failed'
  appInfo: AppInfo | null
}

export function LockScreen({ onUnlock, userName, ipcStatus, appInfo }: LockScreenProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (pin.length > 0 && error) setError(false)
  }, [pin, error])

  const submitPin = async (finalPin: string) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(false)

    try {
      const success = await onUnlock(finalPin)

      if (!success) {
        setError(true)
        setPin('')
        inputRef.current?.focus()
      }
    } catch (err) {
      console.error('[LockScreen] PIN verification failed:', err)
      setError(true)
      setPin('')
      inputRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeypadPress = (key: number | 'del') => {
    if (isSubmitting) return

    if (key === 'del') {
      setPin((p) => p.slice(0, -1))
    } else if (pin.length < 4) {
      const newPin = pin + key
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => {
          void submitPin(newPin)
        }, 150)
      }
    }

    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSubmitting) return

    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(val)

    if (val.length === 4) {
      setTimeout(() => {
        void submitPin(val)
      }, 150)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4 && !isSubmitting) {
      void submitPin(pin)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-sidebar)',
        gap: 32,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 24 }}>Rx</span>
        </div>

        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          PharmaPOS
        </h1>

        <p style={{ color: 'var(--text-sidebar)', fontSize: 13, marginTop: 4 }}>
          {appInfo ? `v${appInfo.version} • ${appInfo.platform}` : 'Loading...'}
        </p>
      </div>

      <div
        style={{
          background: '#1A1D28',
          borderRadius: 16,
          padding: '32px 36px',
          width: 320,
          textAlign: 'center',
        }}
      >
        <ShieldCheck size={28} style={{ color: 'var(--accent)', marginBottom: 12 }} />

        {userName ? (
          <>
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Welcome back
            </h2>
            <p
              style={{
                color: 'var(--accent-light)',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              {userName}
            </p>
          </>
        ) : (
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Enter PIN
          </h2>
        )}

        {error && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              borderRadius: 8,
              padding: '8px 10px',
              marginBottom: 16,
              fontSize: 12,
              color: 'var(--red)',
              fontWeight: 500,
            }}
          >
            Invalid PIN. Try again.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background:
                  i < pin.length
                    ? error
                      ? 'var(--red)'
                      : 'var(--accent)'
                    : '#252836',
                border: '2px solid',
                borderColor:
                  i < pin.length
                    ? error
                      ? 'var(--red)'
                      : 'var(--accent)'
                    : '#3A3F50',
                transition: 'all 0.15s ease',
                transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
                opacity: isSubmitting ? 0.75 : 1,
              }}
            />
          ))}
        </div>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            maxWidth: 220,
            margin: '0 auto',
            opacity: isSubmitting ? 0.65 : 1,
            pointerEvents: isSubmitting ? 'none' : 'auto',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del' as const].map((key, i) => {
            if (key === null) return <div key={i} />

            return (
              <button
                key={i}
                onClick={() => handleKeypadPress(key as number | 'del')}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 10,
                  border: 'none',
                  background: key === 'del' ? 'transparent' : '#252836',
                  color: key === 'del' ? 'var(--text-sidebar)' : '#fff',
                  fontSize: key === 'del' ? 13 : 18,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'default' : 'pointer',
                  fontFamily: key === 'del' ? 'var(--font-sans)' : 'var(--font-mono)',
                  transition: 'all 0.1s ease',
                }}
                onMouseDown={(e) => {
                  if (key !== 'del' && !isSubmitting) {
                    ;(e.currentTarget as HTMLElement).style.background = '#3A3F50'
                  }
                }}
                onMouseUp={(e) => {
                  if (key !== 'del' && !isSubmitting) {
                    ;(e.currentTarget as HTMLElement).style.background = '#252836'
                  }
                }}
              >
                {key === 'del' ? '← Delete' : key}
              </button>
            )
          })}
        </div>

        {isSubmitting && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--text-sidebar)',
            }}
          >
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Verifying PIN...</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        {ipcStatus === 'checking' && (
          <>
            <Loader2 size={14} style={{ color: 'var(--orange)', animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--text-sidebar)' }}>Connecting to system...</span>
          </>
        )}

        {ipcStatus === 'connected' && (
          <>
            <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />
            <span style={{ color: 'var(--green)' }}>System ready</span>
          </>
        )}

        {ipcStatus === 'failed' && (
          <>
            <XCircle size={14} style={{ color: 'var(--red)' }} />
            <span style={{ color: 'var(--red)' }}>IPC connection failed — restart app</span>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}