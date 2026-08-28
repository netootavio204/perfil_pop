'use client'

import { useState, useEffect } from 'react'
import { SafeAdminUser, UserPlan } from '@/types/database'
import {
  getAdminUsers,
  deleteAdminUser,
  toggleAdminUserStatus,
  toggleMasterAdminAccess,
  updateUserPlan,
} from '@/actions/users'
import { CreateUserModal } from './CreateUserModal'
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  Mail,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Crown,
  Database as DbIcon,
  Zap,
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

  const handleToggleMasterAccess = async (user: SafeAdminUser) => {
    const newAccess = !user.can_access_master_admin
    setActionLoadingId(user.id)
    setFeedback(null)

    try {
      const res = await toggleMasterAdminAccess(user.id, newAccess)
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Acesso ao ADM Master ${newAccess ? 'concedido para' : 'removido de'} ${user.name}.`,
        })
        await reloadUsers()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao alterar permissão master.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado.' })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handlePlanChange = async (user: SafeAdminUser, newPlan: UserPlan) => {
    setActionLoadingId(user.id)
    setFeedback(null)

    try {
      const res = await updateUserPlan(user.id, newPlan)
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Plano de ${user.name} alterado para "${newPlan === 'unlimited' ? 'Ilimitado / Master' : 'Gratuito (1 Campanha)'}".`,
        })
        await reloadUsers()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao alterar plano.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado.' })
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
    const sql = `ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS can_access_master_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';`

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
                <h2 className="text-xl font-bold text-white tracking-tight">Gestão de Usuários & Permissões Master</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Controle quem tem acesso ao ADM Master e defina os planos de campanhas de cada usuário.
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
            placeholder="Buscar usuário por nome ou e-mail..."
            className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-10 text-center backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Nenhum usuário encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            {search
              ? 'Nenhum resultado corresponde à sua pesquisa.'
              : 'Cadastre administradores e editores para gerenciar campanhas.'}
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg shadow-pink-600/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Usuário</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => {
            const isMe = currentUserId === user.id
            const isMasterAccess = Boolean(user.can_access_master_admin)
            const initials = user.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <div
                key={user.id}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-purple-500/40 transition-all backdrop-blur-xl flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center shadow-md text-white ${
                          isMasterAccess
                            ? 'bg-gradient-to-tr from-amber-500 to-pink-600 shadow-amber-500/20'
                            : 'bg-gradient-to-tr from-pink-600 to-purple-600 shadow-pink-600/20'
                        }`}
                      >
                        {isMasterAccess ? <Crown className="w-4 h-4" /> : initials || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white">{user.name}</h4>
                          {isMe && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[180px]">{user.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isMasterAccess ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Crown className="w-3 h-3" />
                          ADM Master
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          <Edit3 className="w-3 h-3" />
                          {user.role === 'admin' ? 'Admin Normal' : 'Editor'}
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          user.plan === 'unlimited'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {user.plan === 'unlimited' ? 'Campanhas Ilimitadas' : 'Plano Grátis (1 Camp.)'}
                      </span>
                    </div>
                  </div>

                  {/* Permissions & Plan Settings Controls */}
                  <div className="space-y-2 pt-3 border-t border-slate-800/60 text-xs">
                    {/* Master Access Switch */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-medium text-[11px]">Acesso ao ADM Master:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleMasterAccess(user)}
                        disabled={actionLoadingId === user.id || isMe}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          isMasterAccess
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {isMasterAccess ? 'Liberado (Master)' : 'Bloqueado'}
                      </button>
                    </div>

                    {/* Plan Selector */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-medium text-[11px]">Limite de Campanhas:</span>
                      </div>
                      <select
                        value={user.plan || 'free'}
                        onChange={(e) => handlePlanChange(user, e.target.value as UserPlan)}
                        disabled={actionLoadingId === user.id}
                        className="bg-slate-900 border border-slate-800 text-[11px] text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                      >
                        <option value="free">Gratuito (1 Campanha)</option>
                        <option value="unlimited">Ilimitado / Master</option>
                      </select>
                    </div>
                  </div>

                  {/* Status & Metadata */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-slate-600'}`} />
                      <span className={user.is_active ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                        {user.is_active ? 'Conta Ativa' : 'Conta Inativa'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
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
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/40">
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
                    {user.is_active ? 'Desativar Conta' : 'Ativar Conta'}
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

      {/* Modal to create new user */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={reloadUsers}
      />
    </div>
  )
}
