import { NextRequest, NextResponse } from 'next/server'
import { loginAdmin } from '@/actions/admin-auth'
import { ADMIN_SESSION_COOKIE } from '@/lib/auth-crypto'

export async function POST(req: NextRequest) {
  let email = ''
  let password = ''

  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    email = body.email || ''
    password = body.password || ''
  } else if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await req.formData().catch(() => new FormData())
    email = (formData.get('email') as string) || ''
    password = (formData.get('password') as string) || ''
  }

  const result = await loginAdmin(email, password)

  const isFormSubmit =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')

  if (!result.success) {
    if (isFormSubmit) {
      return NextResponse.redirect(new URL('/admin?error=invalid_credentials', req.url))
    }
    return NextResponse.json(
      { success: false, error: result.error || 'Credenciais inválidas.' },
      { status: 401 }
    )
  }

  // Set-Cookie directly on response
  const response = isFormSubmit
    ? NextResponse.redirect(new URL('/admin', req.url), 303)
    : NextResponse.json({ success: true, user: result.user })

  if (result.token) {
    response.cookies.set(ADMIN_SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
  }

  return response
}
