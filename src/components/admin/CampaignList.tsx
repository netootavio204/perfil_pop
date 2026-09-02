'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCampaign } from '@/actions/campaigns'
import { Campaign, getCampaignFrames, getPrimaryFrameUrl } from '@/types/database'
import { CampaignLeadsModal } from '@/components/admin/CampaignLeadsModal'
import { EditCampaignModal } from '@/components/admin/EditCampaignModal'
import {
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Search,
  Calendar,
  AlertCircle,
  Layers,
  Eye,
  Download,
  BarChart3,
  TrendingUp,
  Square,
  Smartphone,
  CircleDot,
  Users,
  Contact2,
  Edit3,
  PlusCircle,
} from 'lucide-react'
import { SafeAdminUser } from '@/types/database'

interface CampaignListProps {
  initialCampaigns: Campaign[]
  users?: SafeAdminUser[]
  currentUser?: {
    id: string
    name: string
    email: string
    role: string
    is_master_admin?: boolean
    can_access_master_admin?: boolean
    plan?: string
  } | null
}

export function CampaignList({ initialCampaigns, users = [], currentUser }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [selectedLeadsCampaign, setSelectedLeadsCampaign] = useState<Campaign | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const router = useRouter()

  useEffect(() => {
    setCampaigns(initialCampaigns)
  }, [initialCampaigns])

  const isMaster = Boolean(currentUser?.is_master_admin || currentUser?.can_access_master_admin)

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.user_name && c.user_name.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (!isMaster) {
      return (
        (c.user_id && c.user_id === currentUser?.id) ||
        (c.user_email && currentUser?.email && c.user_email.toLowerCase() === currentUser.email.toLowerCase())
      )
    }

    if (userFilter === 'all') return true
    if (userFilter === 'me') {
      return (
        c.user_id === currentUser?.id ||
        c.user_email === currentUser?.email ||
        (!c.user_id && currentUser?.id === 'master-admin')
      )
    }
    return c.user_id === userFilter || c.user_email === userFilter
  })

  // Global KPIs Calculation (Strictly scoped to user permissions)
  const scopedCampaigns = isMaster ? campaigns : filteredCampaigns
  const totalViews = scopedCampaigns.reduce((acc, c) => acc + (c.views_count || 0), 0)
  const totalDownloads = scopedCampaigns.reduce((acc, c) => acc + (c.downloads_count || 0), 0)
  const avgConversion = totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : '0.0'

  const copyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/c/${slug}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2500)
  }

  const handleDelete = async (campaign: Campaign) => {
    const confirmDelete = window.confirm(
      `Deseja realmente excluir a campanha "${campaign.title}"? Esta ação é irreversível e excluirá as métricas e leads associados.`
    )
    if (!confirmDelete) return

    setDeletingId(campaign.id)
    setDeleteError(null)

    try {
      const res = await deleteCampaign(campaign.id, campaign.frame_url)
      if (res.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id))
        router.refresh()
      } else {
        setDeleteError(res.error || 'Erro ao excluir campanha.')
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Falha ao excluir campanha.')
    } finally {
      setDeletingId(null)
    }
  }

  const scrollToCreateForm = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderFormatBadge = (format: string = '1:1') => {
    switch (format) {
      case '4:5':
      case '3:4':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/25">
            <Smartphone className="w-3 h-3" />
            <span>4:5 Retrato</span>
          </span>
        )
      case 'circle':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/25">
            <CircleDot className="w-3 h-3" />
            <span>Redondo</span>
          </span>
        )
      case '1:1':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
            <Square className="w-3 h-3" />
            <span>1:1 Quadrado</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Global KPIs Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Campanhas</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{campaigns.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {isMaster ? 'Total no sistema' : 'Sua campanha ativa'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Visualizações</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {totalViews.toLocaleString('pt-BR')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Acessos à rota pública</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Downloads & Leads</span>
            <Download className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {totalDownloads.toLocaleString('pt-BR')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Fotos geradas e salvas</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversão Média</span>
            <TrendingUp className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{avgConversion}%</p>
          <p className="text-[11px] text-slate-500 mt-1">Downloads por visualização</p>
        </div>
      </div>

      {/* Campaigns List & Search Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{isMaster ? 'Dashboard de Campanhas & Telemetria' : 'Suas Campanhas Cadastradas'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {campaigns.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe o desempenho de cada moldura em tempo real e edite quando precisar
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {isMaster && users && users.length > 0 && (
              <div className="relative">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full sm:w-48 pl-3 pr-8 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="all">Todos os Usuários</option>
                  <option value="me">Minhas Campanhas</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      ADM: {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar campanha ou slug..."
                className="w-full pl-9.5 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              onClick={scrollToCreateForm}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer"
              title="Criar nova campanha"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Criar Nova</span>
            </button>
          </div>
        </div>

        {deleteError && (
          <div className="flex items-center gap-2 p-3.5 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{deleteError}</span>
          </div>
        )}

        {filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
              <Layers className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              {search ? 'Nenhuma campanha encontrada com esse termo' : 'Nenhuma campanha criada ainda'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {search
                ? 'Tente pesquisar por outro título ou slug.'
                : 'Utilize o formulário acima para cadastrar a primeira campanha.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCampaigns.map((camp) => {
              const campViews = camp.views_count || 0
              const campDownloads = camp.downloads_count || 0
              const convRate = campViews > 0 ? ((campDownloads / campViews) * 100).toFixed(1) : '0'

              return (
                <div
                  key={camp.id}
                  className="group relative rounded-2xl border border-slate-800/80 bg-slate-950/70 hover:bg-slate-950 hover:border-slate-700 p-5 transition-all flex flex-col justify-between gap-4 shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div
                      className={`relative overflow-hidden border border-slate-800 shrink-0 bg-slate-900 ${
                        camp.format === '4:5' || camp.format === '3:4'
                          ? 'w-16 h-20 rounded-lg'
                          : camp.format === 'circle'
                          ? 'w-16 h-16 rounded-full'
                          : 'w-16 h-16 rounded-xl'
                      }`}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `
                            linear-gradient(45deg, #1e293b 25%, transparent 25%),
                            linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #1e293b 75%),
                            linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                          `,
                          backgroundSize: '10px 10px',
                          backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                          backgroundColor: '#0f172a',
                        }}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getPrimaryFrameUrl(camp)}
                        alt={camp.title}
                        className="relative z-10 w-full h-full object-contain"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                          {camp.title}
                        </h4>
                        {renderFormatBadge(camp.format)}
                        {getCampaignFrames(camp).length > 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {getCampaignFrames(camp).length} opções
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-indigo-400 font-mono truncate">
                        <span>/c/{camp.slug}</span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {camp.created_at
                              ? new Date(camp.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Data não informada'}
                          </span>
                        </div>

                        {isMaster && camp.user_name && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                            <Users className="w-3 h-3 text-pink-400" />
                            <span>{camp.user_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingCampaign(camp)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors cursor-pointer"
                        title="Editar título, slug ou moldura da campanha"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Leads Button */}
                      <button
                        onClick={() => setSelectedLeadsCampaign(camp)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-300 border border-slate-800 transition-colors cursor-pointer"
                        title="Ver contatos & leads capturados nesta campanha"
                      >
                        <Contact2 className="w-4 h-4" />
                      </button>

                      {/* Copy Link Button */}
                      <button
                        onClick={() => copyLink(camp.slug)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors cursor-pointer"
                        title="Copiar link público"
                      >
                        {copiedSlug === camp.slug ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Open Public Page */}
                      <a
                        href={`/c/${camp.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors text-center"
                        title="Acessar página da campanha"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(camp)}
                        disabled={deletingId === camp.id}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
                        title="Excluir campanha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Metrics Bar */}
                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center bg-slate-900/40 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl items-center">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3 text-purple-400" />
                        Views
                      </span>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {campViews.toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div
                      onClick={() => setSelectedLeadsCampaign(camp)}
                      className="cursor-pointer hover:bg-slate-800/50 py-0.5 px-1 rounded-lg transition-colors"
                      title="Clique para ver lista de leads capturados"
                    >
                      <span className="text-[10px] uppercase font-semibold text-emerald-400 flex items-center justify-center gap-1">
                        <Download className="w-3 h-3" />
                        Downloads
                      </span>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5 underline decoration-dotted underline-offset-2">
                        {campDownloads.toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-center gap-1">
                        <BarChart3 className="w-3 h-3 text-pink-400" />
                        Conversão
                      </span>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {convRate}%
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Campaign Leads Modal */}
      <CampaignLeadsModal
        campaign={selectedLeadsCampaign}
        isOpen={Boolean(selectedLeadsCampaign)}
        onClose={() => setSelectedLeadsCampaign(null)}
      />

      {/* Edit Campaign Modal */}
      <EditCampaignModal
        campaign={editingCampaign}
        isOpen={Boolean(editingCampaign)}
        onClose={() => setEditingCampaign(null)}
        onCampaignUpdated={(updated) => {
          if (updated) {
            setCampaigns((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            )
            setEditingCampaign(null)
          }
          router.refresh()
        }}
      />
    </div>
  )
}
