'use client'

import { useState, useEffect } from 'react'
import { SafeAdminUser } from '@/types/database'
import { getAdminUsers, deleteAdminUser, toggleAdminUserStatus } from '@/actions/users'
import { CreateUserModal } from './CreateUserModal'
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Database as DbIcon,
} from 'lucide-react'

interface UserManagementProps {
  initialUsers?: SafeAdminUser[]
  currentUserId?: string
}

export function UserManagement({ initialUsers = [], currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<SafeAdminUser[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copiedSql, setCopiedSql] = useState(false)

  const reloadUsers = async () => {
    setLoading(true)
    try {
      const data = await getAdminUsers()
      setUsers(data)
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao carregar lista de usuários.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialUsers.length === 0) {
      reloadUsers()
    }
  }, [])

  const handleDelete = async (user: SafeAdminUser) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}" (${user.email})?`)) {
      return
    }

    setActionLoadingId(user.id)
    setFeedback(null)

    try {
      const res = await deleteAdminUser(user.id)
      if (res.success) {
        setFeedback({ type: 'success', message: `Usuário ${user.name} excluído com sucesso.` })
        await reloadUsers()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao excluir usuário.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao excluir.' })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleStatus = async (user: SafeAdminUser) => {
    const newStatus = !user.is_active
    setActionLoadingId(user.id)
    setFeedback(null)

    try {
      const res = await toggleAdminUserStatus(user.id, newStatus)
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Usuário ${user.name} ${newStatus ? 'ativado' : 'desativado'} com sucesso.`,
        })
        await reloadUsers()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao alterar status.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao alterar status.' })
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  )

  const copySqlSnippet = () => {
    const sql = `CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura de admin_users" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de admin_users" ON public.admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de admin_users" ON public.admin_users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir exclusão de admin_users" ON public.admin_users FOR DELETE USING (true);`

    navigator.clipboard.writeText(sql)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">Gestão de Usuários</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Controle quem tem acesso de administrador ou editor ao painel do PerfilPop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={reloadUsers}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-lg shadow-pink-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-5 flex items-center justify-between p-3.5 rounded-xl text-xs sm:text-sm border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 transition-opacity ml-2"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mt-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuário por nome, e-mail ou cargo..."
            className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {/* Users List / Table */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-10 text-center backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Nenhum usuário cadastrado no banco</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            {search
              ? 'Nenhum resultado corresponde à sua pesquisa.'
              : 'Cadastre administradores e editores para que outras pessoas da sua equipe possam gerenciar campanhas.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg shadow-pink-600/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Primeiro Usuário</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => {
            const isMe = currentUserId === user.id
            const initials = user.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <div
                key={user.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-purple-500/40 transition-all backdrop-blur-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-pink-600/20">
                        {initials || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{user.name}</h4>
                          {isMe && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[200px]">{user.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="shrink-0">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-pink-500/10 text-pink-300 border border-pink-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          <Edit3 className="w-3 h-3" />
                          Editor
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & Metadata */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-slate-600'}`} />
                      <span className={user.is_active ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(user.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-800/40">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    disabled={actionLoadingId === user.id || isMe}
                    className={`text-xs font-medium px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
                      user.is_active
                        ? 'border-slate-800 text-slate-400 hover:text-amber-300 hover:bg-amber-950/20 hover:border-amber-900/40'
                        : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/20'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    title={isMe ? 'Você não pode desativar a si mesmo' : ''}
                  >
                    {user.is_active ? 'Desativar' : 'Ativar'}
                  </button>

                  <button
                    onClick={() => handleDelete(user)}
                    disabled={actionLoadingId === user.id || isMe}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={isMe ? 'Você não pode excluir sua própria conta' : 'Excluir usuário'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Supabase Schema Helper (Admin Notice) */}
      <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
              <DbIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Estrutura do Banco de Dados (Supabase)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Os usuários são salvos na tabela <code className="text-pink-300 font-mono">admin_users</code> com hash criptográfico PBKDF2/SHA-512 e salt individual.
              </p>
            </div>
          </div>

          <button
            onClick={copySqlSnippet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal to create new user */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={reloadUsers}
      />
    </div>
  )
}
