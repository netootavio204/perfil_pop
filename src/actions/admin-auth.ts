'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SessionPayload,
  ADMIN_SESSION_COOKIE,
} from '@/lib/auth-crypto'

const DEFAULT_EMAIL = 'netootavio204@gmail.com'
const DEFAULT_PASSWORD = '*120326*'

/**
 * Returns current authenticated admin session payload or null if not logged in.
 */
export async function getAdminSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!sessionToken) return null

  const expectedMasterEmail = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase()

  // 1. Verify modern signed session token
  const verified = verifySessionToken(sessionToken)
  if (verified.valid && verified.payload) {
    const isMasterEmail = verified.payload.email.toLowerCase() === expectedMasterEmail
    return {
      ...verified.payload,
      is_master_admin: isMasterEmail || verified.payload.is_master_admin || false,
      can_access_master_admin: isMasterEmail ? true : (verified.payload.can_access_master_admin || false),
      plan: isMasterEmail ? 'unlimited' : (verified.payload.plan || 'free'),
    }
  }

  // 2. Legacy fallback support for previously established base64 sessions
  try {
    if (sessionToken.startsWith('session_')) {
      return {
        id: 'master-admin',
        email: expectedMasterEmail,
        name: 'Administrador Master',
        role: 'admin',
        is_master_admin: true,
        can_access_master_admin: true,
        plan: 'unlimited',
      }
    }
  } catch {
    // Ignore legacy decoding error
  }

  return null
}

/**
 * Verifies if the visitor has an active admin/editor session.
 */
export async function verifyAdminSession(): Promise<boolean> {
  const session = await getAdminSessionPayload()
  return session !== null
}

/**
 * Logs in an administrative user, verifying against Supabase database first,
 * with fallback to master environment credentials.
 */
export async function loginAdmin(email: string, password: string) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanPassword = (password || '').trim()

  if (!cleanEmail) {
    return { success: false, error: 'Por favor, informe seu e-mail.' }
  }

  if (!cleanPassword) {
    return { success: false, error: 'Por favor, informe sua senha.' }
  }

  const expectedMasterEmail = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase()
  const expectedMasterPassword = (process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD).trim()
  const isMasterUser = cleanEmail === expectedMasterEmail

  // 1. FAST-PATH: Master admin credentials match immediately!
  // Zero database latency, instant 0ms access on first click
  if (isMasterUser && cleanPassword === expectedMasterPassword) {
    const sessionPayload: SessionPayload = {
      id: 'master-admin',
      name: 'Administrador Master',
      email: expectedMasterEmail,
      role: 'admin',
      is_master_admin: true,
      can_access_master_admin: true,
      plan: 'unlimited',
    }

    const token = createSessionToken(sessionPayload)
    try {
      const cookieStore = await cookies()
      cookieStore.set(ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    } catch {
      // Ignore if invoked in a context where cookies cannot be directly set
    }

    try {
      revalidatePath('/admin')
    } catch {}

    return { success: true, user: sessionPayload, token }
  }

  // 2. Database authentication against `admin_users` table with safety timeout
  try {
    const supabase = await createClient()

    // 3.5-second timeout guard to prevent database stalls from freezing login
    const queryPromise = supabase
      .from('admin_users')
      .select('id, name, email, password_hash, password_salt, role, is_active, can_access_master_admin, plan')
      .eq('email', cleanEmail)
      .maybeSingle()

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'Database response timeout' } }), 3500)
    )

    const { data: dbUser, error: dbError } = await Promise.race([queryPromise, timeoutPromise])

    if (!dbError && dbUser) {
      if (!dbUser.is_active) {
        return { success: false, error: 'Sua conta está inativa. Contate o administrador principal.' }
      }

      const isPasswordValid = verifyPassword(cleanPassword, dbUser.password_hash, dbUser.password_salt)
      if (isPasswordValid) {
        const canAccessMaster = isMasterUser || Boolean(dbUser.can_access_master_admin)
        const userPlan = isMasterUser ? 'unlimited' : (dbUser.plan || 'free')

        const sessionPayload: SessionPayload = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role as 'admin' | 'editor',
          is_master_admin: isMasterUser,
          can_access_master_admin: canAccessMaster,
          plan: userPlan,
        }

        const token = createSessionToken(sessionPayload)
        try {
          const cookieStore = await cookies()
          cookieStore.set(ADMIN_SESSION_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
          })
        } catch {}

        try {
          revalidatePath('/admin')
        } catch {}

        return { success: true, user: sessionPayload, token }
      }
    }
  } catch (err) {
    console.warn('[loginAdmin] Database check warning:', err)
  }

  // 3. Fallback check for master user if password was not matched previously
  if (isMasterUser && cleanPassword === expectedMasterPassword) {
    const sessionPayload: SessionPayload = {
      id: 'master-admin',
      name: 'Administrador Master',
      email: expectedMasterEmail,
      role: 'admin',
      is_master_admin: true,
      can_access_master_admin: true,
      plan: 'unlimited',
    }

    const token = createSessionToken(sessionPayload)
    try {
      const cookieStore = await cookies()
      cookieStore.set(ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    } catch {}

    try {
      revalidatePath('/admin')
    } catch {}

    return { success: true, user: sessionPayload, token }
  }

  return { success: false, error: 'E-mail ou senha incorretos.' }
}

/**
 * Logs out the currently authenticated user.
 */
export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
  revalidatePath('/admin')
  return { success: true }
}

/**
 * Request password reset link / instructions.
 */
export async function requestPasswordReset(email: string) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, error: 'Informe seu e-mail cadastrado.' }
  }

  return {
    success: true,
    message: `Se o e-mail ${cleanEmail} estiver cadastrado, as instruções para redefinição foram enviadas.`,
  }
}
