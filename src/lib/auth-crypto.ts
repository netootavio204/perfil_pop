import crypto from 'crypto'
import { UserPlan, AdminRole } from '@/types/database'

export const ADMIN_SESSION_COOKIE = 'perfilpop_admin_session'

const ITERATIONS = 100000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

/**
 * Derives a secret key for session signing from env or dynamic project identifier
 */
function getSigningSecret(): string {
  const envSecret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD
  if (envSecret) return envSecret
  return 'perfilpop_secure_fallback_salt_' + (process.env.NEXT_PUBLIC_SUPABASE_URL || 'default_2026')
}

/**
 * Hashes a plaintext password using PBKDF2 with a random cryptographic salt.
 */
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
  return {
    hash: derivedKey.toString('hex'),
    salt,
  }
}

/**
 * Securely verifies a password against stored hash and salt using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  try {
    const { hash } = hashPassword(password, storedSalt)
    const bufferA = Buffer.from(hash, 'hex')
    const bufferB = Buffer.from(storedHash, 'hex')
    if (bufferA.length !== bufferB.length) return false
    return crypto.timingSafeEqual(bufferA, bufferB)
  } catch {
    return false
  }
}

export interface SessionPayload {
  id: string
  email: string
  name: string
  role: AdminRole
  is_master_admin?: boolean
  can_access_master_admin?: boolean
  plan?: UserPlan
  createdAt?: number
}

/**
 * Creates an HMAC signed session token containing user metadata and timestamp.
 */
export function createSessionToken(payload: SessionPayload): string {
  const secret = getSigningSecret()
  const data = JSON.stringify({
    ...payload,
    createdAt: Date.now(),
  })
  const base64Data = Buffer.from(data).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(base64Data).digest('base64url')
  return `${base64Data}.${signature}`
}

/**
 * Verifies an HMAC signed session token, validates signature and enforces strict 7-day expiration.
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: SessionPayload } {
  if (!token || typeof token !== 'string') {
    return { valid: false }
  }

  let cleanToken = token.trim()
  // Remove wrapping quotes if added by cookie parsers
  if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
    cleanToken = cleanToken.slice(1, -1)
  }
  // Decode if URL encoded
  if (cleanToken.includes('%')) {
    try {
      cleanToken = decodeURIComponent(cleanToken)
    } catch {
      // Ignore decode error
    }
  }

  if (!cleanToken.includes('.')) {
    return { valid: false }
  }

  try {
    const [base64Data, signature] = cleanToken.split('.')
    if (!base64Data || !signature) return { valid: false }

    const secret = getSigningSecret()
    const expectedSignature = crypto.createHmac('sha256', secret).update(base64Data).digest('base64url')

    const sigA = Buffer.from(signature)
    const sigB = Buffer.from(expectedSignature)

    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return { valid: false }
    }

    const jsonString = Buffer.from(base64Data, 'base64url').toString('utf-8')
    const payload = JSON.parse(jsonString) as SessionPayload

    // Strict expiration validation
    if (!payload.createdAt || typeof payload.createdAt !== 'number') {
      return { valid: false }
    }

    const tokenAge = Date.now() - payload.createdAt
    if (tokenAge < 0 || tokenAge > SESSION_MAX_AGE_MS) {
      return { valid: false } // Expired token
    }

    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}
