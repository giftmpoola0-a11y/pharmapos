import type { User, VerifyPinResult } from '../../../shared/types'

export interface AuthResult {
  success: true
  user: User
}

let currentUser: User | null = null
let locked = true

export async function verifyPin(pin: string): Promise<AuthResult | null> {
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return null
  }

  const result: VerifyPinResult = await window.api.verifyPin({ pin })

  if (!result.success) {
    return null
  }

  currentUser = result.user
  locked = false

  return {
    success: true,
    user: result.user,
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return currentUser
}

export function lock(): void {
  currentUser = null
  locked = true
}

export function isLocked(): boolean {
  return locked
}