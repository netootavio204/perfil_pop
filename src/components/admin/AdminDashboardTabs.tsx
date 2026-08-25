'use client'

import { useState } from 'react'
import { Campaign, SafeAdminUser } from '@/types/database'
import { CreateCampaignForm } from '@/components/admin/CreateCampaignForm'
import { CampaignList } from '@/components/admin/CampaignList'
import { UserManagement } from '@/components/admin/UserManagement'
import { SupabaseStatus } from '@/components/SupabaseStatus'
import { Layers, Users, Activity, Sparkles } from 'lucide-react'

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
}

export function AdminDashboardTabs({
  initialCampaigns,
  initialUsers,
  currentUser,
  defaultTab = 'campaigns',
}: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'users'>(defaultTab)

  return (
    <div>
      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            {activeTab === 'campaigns' ? 'Gestão de Campanhas' : 'Gestão de Usuários'}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
              Painel Geral
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === 'campaigns'
              ? 'Cadastre novas molduras personalizadas e acompanhe os links gerados para divulgação.'
              : 'Gerencie credenciais de acesso, permissões e crie novos administradores ou editores.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Campanhas</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] ${
                activeTab === 'campaigns' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {initialCampaigns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {initialUsers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'campaigns' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Section 1: Campaign creation */}
          <CreateCampaignForm />

          {/* Section 2: Existing campaigns list */}
          <CampaignList initialCampaigns={initialCampaigns} />

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

      {activeTab === 'users' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Section 1: User Management */}
          <UserManagement initialUsers={initialUsers} currentUserId={currentUser?.id} />

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
  )
}
