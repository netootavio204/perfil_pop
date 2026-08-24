import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(req: NextRequest) {
  let email = ''
  let password = ''

  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    email = body.email || ''
    password = body.password || ''
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await req.formData().catch(() => new FormData())
    email = (formData.get('email') as string) || ''
    password = (formData.get('password') as string) || ''
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanPassword = password.trim()

  const expectedEmail = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase()
  const expectedPassword = (process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD).trim()

  if (cleanEmail !== expectedEmail || cleanPassword !== expectedPassword) {
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      return NextResponse.redirect(new URL('/admin?error=invalid_credentials', req.url))
    }
    return NextResponse.json(
      { success: false, error: 'E-mail ou senha incorretos.' },
      { status: 401 }
    )
  }

  const token = getExpectedToken()
  const redirectUrl = new URL('/admin', req.url)

  const isFormSubmit = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')
  const res = isFormSubmit
    ? NextResponse.redirect(redirectUrl, 303)
    : NextResponse.json({ success: true })

  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return res
}
