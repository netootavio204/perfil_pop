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
import { Layers, Users, Activity, UserPlus, Sparkles, ShieldCheck, Crown } from 'lucide-react'

interface AdminDashboardTabsProps {
  initialCampaigns: Campaign[]
  initialUsers: SafeAdminUser[]
  currentUser?: {
    id: string
    name: string
    email: string
    role: string
    is_master_admin?: boolean
    can_access_master_admin?: boolean
    plan?: string
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
  const isMasterAuthorized = Boolean(
    currentUser?.is_master_admin || currentUser?.can_access_master_admin
  )

  // Non-master users are locked to the campaigns tab
  const [activeTab, setActiveTab] = useState<'campaigns' | 'users'>(
    isMasterAuthorized && defaultTab === 'users' ? 'users' : 'campaigns'
  )
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
        onOpenNewUserModal={isMasterAuthorized ? () => setInternalModalOpen(true) : undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                {activeTab === 'campaigns'
                  ? isMasterAuthorized
                    ? 'Painel Geral de Campanhas'
                    : 'Minhas Campanhas'
                  : 'Gestão de Usuários & ADM Master'}
              </h1>
              {isMasterAuthorized ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  ADM Master
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {currentUser?.plan === 'unlimited' ? 'Plano Ilimitado' : 'Plano Gratuito (1 Campanha)'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              {activeTab === 'campaigns'
                ? isMasterAuthorized
                  ? 'Gerencie todas as molduras da plataforma, acompanhe métricas de conversão e leads coletados.'
                  : 'Crie e acompanhe sua campanha personalizada, visualizações e fotos baixadas.'
                : 'Controle os administradores e editores autorizados a acessar o painel master do PerfilPop.'}
            </p>
          </div>

          {/* Tab & Action Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quick Add User Button (Visible ONLY to Master authorized users) */}
            {isMasterAuthorized && (
              <button
                onClick={() => setInternalModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-pink-600/20 active:scale-[0.98] transition-all cursor-pointer"
                title="Cadastrar novo usuário no sistema"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Novo Usuário (ADM)</span>
              </button>
            )}

            {/* Tab Switcher (Visible ONLY if Master authorized) */}
            {isMasterAuthorized && (
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
            )}
          </div>
        </div>

        {/* Tab Content: Campanhas */}
        {activeTab === 'campaigns' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Section 1: Campaign creation */}
            <CreateCampaignForm
              users={usersList}
              currentUser={currentUser}
              userCampaignsCount={initialCampaigns.length}
            />

            {/* Section 2: Existing campaigns list */}
            <CampaignList
              initialCampaigns={initialCampaigns}
              users={usersList}
              currentUser={currentUser}
            />

            {/* Section 3: Private System Status & Database Health (Visible to Master only) */}
            {isMasterAuthorized && (
              <div className="pt-8 border-t border-slate-800/60">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Diagnóstico de Conexão e Banco de Dados (Privado do Administrador Master)
                  </h3>
                </div>
                <SupabaseStatus />
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Usuários (Only accessible by Master) */}
        {isMasterAuthorized && activeTab === 'users' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <UserManagement
              initialUsers={usersList}
              currentUserId={currentUser?.id}
            />

            <div className="pt-8 border-t border-slate-800/60">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Diagnóstico de Conexão e Banco de Dados (Privado do Administrador Master)
                </h3>
              </div>
              <SupabaseStatus />
            </div>
          </div>
        )}
      </div>

      {/* Global Create User Modal (Accessible only if Master) */}
      {isMasterAuthorized && (
        <CreateUserModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  )
}
