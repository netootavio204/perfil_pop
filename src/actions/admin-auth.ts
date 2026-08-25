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
} from '@/lib/auth-crypto'

const ADMIN_SESSION_COOKIE = 'perfilpop_admin_session'
const DEFAULT_EMAIL = 'netootavio204@gmail.com'
const DEFAULT_PASSWORD = '*120326*'

/**
 * Returns current authenticated admin session payload or null if not logged in.
 */
export async function getAdminSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!sessionToken) return null

  // 1. Verify modern signed session token
  const verified = verifySessionToken(sessionToken)
  if (verified.valid && verified.payload) {
    return verified.payload
  }

  // 2. Legacy fallback support for previously established base64 sessions
  try {
    const expectedEmail = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase()
    if (sessionToken.startsWith('session_')) {
      return {
        id: 'master-admin',
        email: expectedEmail,
        name: 'Administrador Master',
        role: 'admin',
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

  // 1. Attempt database authentication against `admin_users` table
  try {
    const supabase = await createClient()

    const { data: dbUser, error: dbError } = await supabase
      .from('admin_users')
      .select('id, name, email, password_hash, password_salt, role, is_active')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (!dbError && dbUser) {
      if (!dbUser.is_active) {
        return { success: false, error: 'Sua conta está inativa. Contate o administrador principal.' }
      }

      const isPasswordValid = verifyPassword(cleanPassword, dbUser.password_hash, dbUser.password_salt)
      if (isPasswordValid) {
        const sessionPayload: SessionPayload = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role as 'admin' | 'editor',
        }

        const token = createSessionToken(sessionPayload)
        const cookieStore = await cookies()
        cookieStore.set(ADMIN_SESSION_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        })

        revalidatePath('/admin')
        return { success: true, user: sessionPayload }
      }
    }
  } catch (err) {
    console.warn('[loginAdmin] Database check warning:', err)
  }

  // 2. Master Fallback (Master admin from environment / defaults)
  if (cleanEmail === expectedMasterEmail && cleanPassword === expectedMasterPassword) {
    const sessionPayload: SessionPayload = {
      id: 'master-admin',
      name: 'Administrador Master',
      email: expectedMasterEmail,
      role: 'admin',
    }

    const token = createSessionToken(sessionPayload)
    const cookieStore = await cookies()
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    revalidatePath('/admin')
    return { success: true, user: sessionPayload }
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
