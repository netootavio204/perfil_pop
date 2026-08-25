'use client'

import { useState } from 'react'
import { Campaign, SafeAdminUser } from '@/types/database'
import { CreateCampaignForm } from '@/components/admin/CreateCampaignForm'
import { CampaignList } from '@/components/admin/CampaignList'
import { UserManagement } from '@/components/admin/UserManagement'
import { CreateUserModal } from '@/components/admin/CreateUserModal'
import { SupabaseStatus } from '@/components/SupabaseStatus'
import { getAdminUsers } from '@/actions/users'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Layers, Users, Activity, UserPlus, Sparkles, ShieldCheck } from 'lucide-react'

interface AdminDashboardTabsProps {
  initialCampaigns: Campaign[]
  initialUsers: SafeAdminUser[]
  currentUser?: {
    id: string
    name: string
    email: string
    role: string
  } | null
  defaultTab?: 'campaigns' | 'users'
  isNewUserModalOpen?: boolean
  onCloseNewUserModal?: () => void
}

export function AdminDashboardTabs({
  initialCampaigns,
  initialUsers,
  currentUser,
  defaultTab = 'campaigns',
  isNewUserModalOpen = false,
  onCloseNewUserModal,
}: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'users'>(defaultTab)
  const [usersList, setUsersList] = useState<SafeAdminUser[]>(initialUsers)
  const [internalModalOpen, setInternalModalOpen] = useState(false)

  const isModalOpen = isNewUserModalOpen || internalModalOpen

  const handleCloseModal = () => {
    setInternalModalOpen(false)
    onCloseNewUserModal?.()
  }

  const handleUserCreated = async () => {
    try {
      const updated = await getAdminUsers()
      setUsersList(updated)
    } catch (err) {
      console.error('Error refreshing users list:', err)
    }
  }

  return (
    <div>
      <AdminHeader
        currentUser={currentUser}
        onOpenNewUserModal={() => setInternalModalOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            {activeTab === 'campaigns' ? 'Gestão de Campanhas' : 'Gestão de Usuários e ADMs'}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
              Painel PerfilPop
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {activeTab === 'campaigns'
              ? 'Cadastre novas molduras personalizadas e acompanhe os links gerados para divulgação.'
              : 'Gerencie credenciais de acesso, crie novos administradores e organize campanhas por usuário.'}
          </p>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Add User Button (Always visible) */}
          <button
            onClick={() => setInternalModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-pink-600/20 active:scale-[0.98] transition-all cursor-pointer"
            title="Criar novo usuário ou administrador para gerenciar campanhas"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Novo Usuário (ADM)</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'campaigns'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Campanhas</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-md text-[10px] ${
                  activeTab === 'campaigns' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {initialCampaigns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Usuários (ADM)</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-md text-[10px] ${
                  activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {usersList.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content: Campanhas */}
      {activeTab === 'campaigns' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Quick Notice Banner for Multi-user Management */}
          <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/30 via-slate-900/60 to-pink-950/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Controle de Usuários e Campanhas Individuais
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Você pode criar novos usuários (ADMs ou Editores) para que cada um tenha suas próprias campanhas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setInternalModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 transition-colors shadow-sm cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Criar Usuário (ADM)</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Ver Todos ({usersList.length})</span>
              </button>
            </div>
          </div>

          {/* Section 1: Campaign creation */}
          <CreateCampaignForm
            users={usersList}
            currentUser={currentUser}
          />

          {/* Section 2: Existing campaigns list */}
          <CampaignList
            initialCampaigns={initialCampaigns}
            users={usersList}
            currentUser={currentUser}
          />

          {/* Section 3: Private System Status & Database Health */}
          <div className="pt-8 border-t border-slate-800/60">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Diagnóstico de Conexão e Banco de Dados (Privado do Administrador)
              </h3>
            </div>
            <SupabaseStatus />
          </div>
        </div>
      )}

      {/* Tab Content: Usuários */}
      {activeTab === 'users' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Section 1: User Management */}
          <UserManagement
            initialUsers={usersList}
            currentUserId={currentUser?.id}
          />

          {/* Section 2: Private System Status & Database Health */}
          <div className="pt-8 border-t border-slate-800/60">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Diagnóstico de Conexão e Banco de Dados (Privado do Administrador)
              </h3>
            </div>
            <SupabaseStatus />
          </div>
        </div>
      )}
      </div>

      {/* Global Create User Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUserCreated={handleUserCreated}
      />
    </div>
  )
}
