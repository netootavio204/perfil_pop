import { getAdminSessionPayload } from '@/actions/admin-auth'
import { getCampaigns } from '@/actions/campaigns'
import { getAdminUsers } from '@/actions/users'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminDashboardTabs } from '@/components/admin/AdminDashboardTabs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; tab?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  const session = await getAdminSessionPayload()

  if (!session) {
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
        <AdminLoginForm
          initialError={params.error === 'invalid_credentials' ? 'E-mail ou senha incorretos.' : undefined}
        />
      </main>
    )
  }

  const [campaigns, users] = await Promise.all([
    getCampaigns(),
    getAdminUsers(),
  ])

  const initialTab = params.tab === 'users' ? 'users' : 'campaigns'

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 pb-20">
      <AdminHeader currentUser={session} />

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <AdminDashboardTabs
          initialCampaigns={campaigns}
          initialUsers={users}
          currentUser={session}
          defaultTab={initialTab}
        />
      </div>
    </main>
  )
}
