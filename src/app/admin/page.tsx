import { verifyAdminSession } from '@/actions/admin-auth'
import { getCampaigns } from '@/actions/campaigns'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CreateCampaignForm } from '@/components/admin/CreateCampaignForm'
import { CampaignList } from '@/components/admin/CampaignList'
import { SupabaseStatus } from '@/components/SupabaseStatus'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  const isAuthenticated = await verifyAdminSession()

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-center py-12 px-6">
        <div className="mb-6 max-w-md mx-auto w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para o início
          </Link>
        </div>
        <AdminLoginForm initialError={params.error === 'invalid_credentials' ? 'E-mail ou senha incorretos.' : undefined} />
      </main>
    )
  }

  const campaigns = await getCampaigns()

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 pb-20">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Gestão de Campanhas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre novas molduras personalizadas e acompanhe os links gerados para divulgação.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Campaign creation */}
          <CreateCampaignForm />

          {/* Section 2: Existing campaigns list */}
          <CampaignList initialCampaigns={campaigns} />

          {/* Section 3: Private System Status & Database Health (Admin Only) */}
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
      </div>
    </main>
  )
}
