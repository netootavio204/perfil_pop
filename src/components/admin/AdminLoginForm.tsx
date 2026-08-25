'use client'

import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { requestPasswordReset } from '@/actions/admin-auth'
import { registerAdminAccount } from '@/actions/users'
import { AdminRole } from '@/types/database'
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  UserPlus,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Edit3,
  LogIn,
} from 'lucide-react'

export function AdminLoginForm({ initialError }: { initialError?: string }) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login')
  
  // Login State
  const [email, setEmail] = useState('netootavio204@gmail.com')
  const [password, setPassword] = useState('')
  
  // Register State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<AdminRole>('admin')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail de administrador.')
      return
    }

    if (!password) {
      setError('Por favor, informe a senha de acesso.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success) {
        window.location.href = '/admin'
      } else {
        setError(data.error || 'E-mail ou senha incorretos. Tente novamente.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao autenticar. Tente novamente.')
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!regName.trim()) {
      setError('Informe o nome do novo administrador/usuário.')
      return
    }

    if (!regEmail.trim()) {
      setError('Informe o e-mail.')
      return
    }

    if (!regPassword || regPassword.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      const res = await registerAdminAccount({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        role: regRole,
      })

      if (res.success) {
        setSuccessMessage('Usuário criado com sucesso! Redirecionando para o painel...')
        setTimeout(() => {
          window.location.href = '/admin'
        }, 1000)
      } else {
        setError(res.error || 'Erro ao criar novo usuário.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao registrar.')
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setError('Informe o e-mail cadastrado para recuperação.')
      return
    }

    setLoading(true)

    try {
      const res = await requestPasswordReset(email)
      if (res.success) {
        setSuccessMessage(res.message || 'Instruções de redefinição enviadas com sucesso!')
      } else {
        setError(res.error || 'Não foi possível solicitar a redefinição.')
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar solicitação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" showSubtitle={false} className="mb-3" />
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {authMode === 'register'
              ? 'Criar Novo Usuário (ADM)'
              : authMode === 'reset'
              ? 'Recuperar Acesso'
              : 'Painel Administrativo'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {authMode === 'register'
              ? 'Cadastre um novo administrador para gerenciar suas próprias campanhas'
              : authMode === 'reset'
              ? 'Informe seu e-mail para receber as instruções de redefinição de senha'
              : 'Autentique-se com sua conta de administrador'}
          </p>
        </div>

        {/* Mode Selector Tabs (Login vs Register) */}
        {authMode !== 'reset' && (
          <div className="flex items-center p-1 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setError(null)
                setSuccessMessage(null)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register')
                setError(null)
                setSuccessMessage(null)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Novo Usuário (ADM)</span>
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 p-4 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Register Mode: Create New User */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ex: Roberto Carlos"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-10 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nível de Permissão
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRegRole('admin')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    regRole === 'admin'
                      ? 'bg-pink-500/10 border-pink-500/50 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-200">Administrador</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Acesso completo</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('editor')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    regRole === 'editor'
                      ? 'bg-purple-500/10 border-purple-500/50 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-200">Editor</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Criação de campanhas</div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-lg shadow-pink-600/25 mt-3"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando Conta...
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Novo Usuário (ADM)</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. Login Mode */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('reset')
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="text-xs text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-10 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-lg shadow-pink-600/25 mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Direct button to create new user */}
            <div className="pt-4 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Criar Novo Usuário (ADM)</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. Password Reset Mode */}
        {authMode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                E-mail do Administrador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-lg shadow-pink-600/25 mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando E-mail...
                </span>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Enviar E-mail de Recuperação</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para o Login</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
