import crypto from 'crypto'

const ITERATIONS = 100000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

/**
 * Derives a secret key for session signing from env or fallback
 */
function getSigningSecret(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || 'perfilpop_secret_salt_2026'
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
  role: 'admin' | 'editor'
  createdAt?: number
}

/**
 * Creates an HMAC signed session token containing user metadata.
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
 * Verifies an HMAC signed session token and extracts the payload.
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: SessionPayload } {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false }
  }

  try {
    const [base64Data, signature] = token.split('.')
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

    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}
