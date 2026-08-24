'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

const ADMIN_SESSION_COOKIE = 'perfilpop_admin_session'
const DEFAULT_EMAIL = 'netootavio204@gmail.com'
const DEFAULT_PASSWORD = '*120326*'

function getExpectedToken(): string {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase()
  const password = (process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD).trim()
  const hash = crypto.createHash('sha256').update(`perfilpop_auth_${email}_${password}`).digest('hex')
  return Buffer.from(`session_${email}_${hash}`).toString('base64')
}

export async function loginAdmin(email: string, password: string) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanPassword = (password || '').trim()

  const expectedEmail = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase()
  const expectedPassword = (process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD).trim()

  if (!cleanEmail || cleanEmail !== expectedEmail) {
    return { success: false, error: 'E-mail incorreto ou não autorizado.' }
  }

  if (!cleanPassword || cleanPassword !== expectedPassword) {
    return { success: false, error: 'Senha incorreta. Tente novamente.' }
  }

  const cookieStore = await cookies()
  const token = getExpectedToken()

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  revalidatePath('/admin')

  return { success: true }
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
  revalidatePath('/admin')
  return { success: true }
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!sessionToken) return false

  return sessionToken === getExpectedToken()
}

export async function requestPasswordReset(email: string) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const expectedEmail = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase()

  if (!cleanEmail) {
    return { success: false, error: 'Informe seu e-mail de administrador.' }
  }

  if (cleanEmail !== expectedEmail) {
    // Return friendly generic message for security, or explicit feedback if desired
    return {
      success: true,
      message: `Se o e-mail ${cleanEmail} estiver cadastrado como administrador, as instruções de recuperação foram enviadas.`,
    }
  }

  // Simulated email dispatch notification with direct confirmation
  return {
    success: true,
    message: `Instruções de redefinição de acesso enviadas para ${cleanEmail}! Verifique sua caixa de entrada e spam.`,
  }
}
