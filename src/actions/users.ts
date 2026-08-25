'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { hashPassword, createSessionToken, SessionPayload } from '@/lib/auth-crypto'
import { getAdminSessionPayload } from '@/actions/admin-auth'
import { SafeAdminUser, AdminRole } from '@/types/database'

const ADMIN_SESSION_COOKIE = 'perfilpop_admin_session'

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role?: AdminRole
}

export interface UserActionResult {
  success: boolean
  message?: string
  error?: string
  user?: SafeAdminUser
}

/**
 * Lists all registered administrative users (excluding sensitive password hashes).
 */
export async function getAdminUsers(): Promise<SafeAdminUser[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, name, email, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[getAdminUsers] Database query notice (table may need creation):', error.message)
      // Return empty array if table doesn't exist yet or query fails
      return []
    }

    return (data as SafeAdminUser[]) || []
  } catch (err: any) {
    console.error('[getAdminUsers] Unexpected error:', err)
    return []
  }
}

/**
 * Creates a new administrative user with hashed password in Supabase database.
 */
export async function createAdminUser(input: CreateUserInput): Promise<UserActionResult> {
  const currentSession = await getAdminSessionPayload()
  if (!currentSession) {
    return { success: false, error: 'Acesso não autorizado. Faça login primeiro.' }
  }

  // Only admins can create users
  if (currentSession.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem criar novos usuários.' }
  }

  const name = (input.name || '').trim()
  const email = (input.email || '').trim().toLowerCase()
  const password = (input.password || '').trim()
  const role: AdminRole = input.role === 'editor' ? 'editor' : 'admin'

  if (!name || name.length < 2) {
    return { success: false, error: 'O nome deve ter pelo menos 2 caracteres.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: 'Informe um e-mail válido.' }
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' }
  }

  try {
    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return { success: false, error: `Já existe um usuário cadastrado com o e-mail ${email}.` }
    }

    // Hash password with cryptographically secure PBKDF2/SHA-512
    const { hash, salt } = hashPassword(password)

    const now = new Date().toISOString()
    const { data: newUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        name,
        email,
        password_hash: hash,
        password_salt: salt,
        role,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select('id, name, email, role, is_active, created_at, updated_at')
      .single()

    if (insertError) {
      console.error('[createAdminUser] Insert error:', insertError)
      return {
        success: false,
        error: `Erro ao salvar no banco de dados: ${insertError.message}. Verifique se executou o script SQL no Supabase.`,
      }
    }

    revalidatePath('/admin')

    return {
      success: true,
      message: `Usuário ${name} (${email}) cadastrado com sucesso!`,
      user: newUser as SafeAdminUser,
    }
  } catch (err: any) {
    console.error('[createAdminUser] Exception:', err)
    return {
      success: false,
      error: err?.message || 'Erro inesperado ao cadastrar usuário.',
    }
  }
}

/**
 * Deletes a user by ID with safeguards.
 */
export async function deleteAdminUser(userId: string): Promise<UserActionResult> {
  const currentSession = await getAdminSessionPayload()
  if (!currentSession) {
    return { success: false, error: 'Acesso não autorizado.' }
  }

  if (currentSession.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem excluir usuários.' }
  }

  if (currentSession.id === userId) {
    return { success: false, error: 'Você não pode excluir sua própria conta enquanto estiver logado.' }
  }

  try {
    const supabase = await createClient()

    // Check count of active admins before deleting
    const { data: admins } = await supabase
      .from('admin_users')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length <= 1 && admins.some((a) => a.id === userId)) {
      return { success: false, error: 'Não é possível remover o único administrador do sistema.' }
    }

    const { error } = await supabase.from('admin_users').delete().eq('id', userId)

    if (error) {
      return { success: false, error: `Erro ao excluir usuário: ${error.message}` }
    }

    revalidatePath('/admin')
    return { success: true, message: 'Usuário removido com sucesso.' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao excluir usuário.' }
  }
}

/**
 * Toggles a user's active status (block / unblock).
 */
export async function toggleAdminUserStatus(userId: string, isActive: boolean): Promise<UserActionResult> {
  const currentSession = await getAdminSessionPayload()
  if (!currentSession) {
    return { success: false, error: 'Acesso não autorizado.' }
  }

  if (currentSession.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem alterar o status de usuários.' }
  }

  if (currentSession.id === userId && !isActive) {
    return { success: false, error: 'Você não pode desativar seu próprio acesso.' }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('admin_users')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      return { success: false, error: `Erro ao atualizar status: ${error.message}` }
    }

    revalidatePath('/admin')
    return {
      success: true,
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso.`,
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao alterar status.' }
  }
}

/**
 * Allows creating a new admin account directly from the login/registration screen,
 * and automatically logs in the newly registered user.
 */
export async function registerAdminAccount(input: CreateUserInput): Promise<UserActionResult> {
  const name = (input.name || '').trim()
  const email = (input.email || '').trim().toLowerCase()
  const password = (input.password || '').trim()
  const role: AdminRole = input.role === 'editor' ? 'editor' : 'admin'

  if (!name || name.length < 2) {
    return { success: false, error: 'O nome deve ter pelo menos 2 caracteres.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: 'Informe um e-mail válido.' }
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' }
  }

  try {
    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return { success: false, error: `Já existe uma conta cadastrada com o e-mail ${email}. Faça login.` }
    }

    // Hash password
    const { hash, salt } = hashPassword(password)
    const now = new Date().toISOString()

    const { data: newUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        name,
        email,
        password_hash: hash,
        password_salt: salt,
        role,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select('id, name, email, role, is_active, created_at, updated_at')
      .single()

    if (insertError) {
      console.error('[registerAdminAccount] Insert error:', insertError)
      return {
        success: false,
        error: `Erro ao salvar no banco: ${insertError.message}. Verifique se executou o script SQL no Supabase.`,
      }
    }

    // Log the user in automatically
    const sessionPayload: SessionPayload = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as 'admin' | 'editor',
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

    return {
      success: true,
      message: 'Conta criada com sucesso! Redirecionando...',
      user: newUser as SafeAdminUser,
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro inesperado ao registrar conta.' }
  }
}
