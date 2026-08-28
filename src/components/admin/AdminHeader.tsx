'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logoutAdmin } from '@/actions/admin-auth'
import { Logo } from '@/components/ui/Logo'
import { LogOut, ArrowLeft, UserPlus, Crown } from 'lucide-react'

interface AdminHeaderProps {
  currentUser?: {
    name?: string
    email?: string
    role?: string
    is_master_admin?: boolean
    can_access_master_admin?: boolean
    plan?: string
  } | null
  onOpenNewUserModal?: () => void
}

export function AdminHeader({ currentUser, onOpenNewUserModal }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await logoutAdmin()
    router.refresh()
  }

  const isMaster = Boolean(currentUser?.is_master_admin || currentUser?.can_access_master_admin)

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
            title="Voltar para a página inicial"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5">
            <Logo size="sm" showSubtitle={false} />
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                isMaster
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
            >
              {isMaster ? 'Master' : 'Painel'}
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add User Button (Only if onOpenNewUserModal is supplied) */}
          {onOpenNewUserModal && (
            <button
              onClick={onOpenNewUserModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-pink-600/20 active:scale-[0.98] transition-all cursor-pointer"
              title="Cadastrar novo usuário administrador/editor"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Usuário (ADM)</span>
              <span className="sm:hidden">+ ADM</span>
            </button>
          )}

          {/* User Profile Badge */}
          {currentUser && (
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div
                className={`w-6 h-6 rounded-lg font-bold text-[10px] flex items-center justify-center shrink-0 text-white ${
                  isMaster
                    ? 'bg-gradient-to-tr from-amber-500 to-pink-600 shadow-amber-500/20'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-500/20'
                }`}
              >
                {isMaster ? <Crown className="w-3.5 h-3.5" /> : currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-slate-200 font-semibold text-[11px] leading-tight truncate max-w-[120px]">
                  {currentUser.name || currentUser.email}
                </span>
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider ${
                    isMaster ? 'text-amber-400' : 'text-indigo-400'
                  }`}
                >
                  {isMaster ? 'ADM Master' : currentUser.role || 'editor'}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 transition-colors cursor-pointer"
            title="Encerrar sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  )
}
