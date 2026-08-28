'use client'

import { useState, useEffect } from 'react'
import { EnrichedCampaignLead, getAllLeads } from '@/actions/campaigns'
import { Campaign } from '@/types/database'
import {
  Contact2,
  MessageCircle,
  Mail,
  Search,
  Download,
  RefreshCw,
  Copy,
  Check,
  FileSpreadsheet,
  Clock,
  Layers,
  Users,
  ExternalLink,
  Filter,
} from 'lucide-react'

interface LeadsDashboardProps {
  campaigns: Campaign[]
}

export function LeadsDashboard({ campaigns }: LeadsDashboardProps) {
  const [leads, setLeads] = useState<EnrichedCampaignLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'whatsapp' | 'email'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const data = await getAllLeads()
      setLeads(data)
    } catch (err) {
      console.error('Error loading leads:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const copyContact = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.contact_value.toLowerCase().includes(search.toLowerCase()) ||
      (lead.user_name && lead.user_name.toLowerCase().includes(search.toLowerCase())) ||
      (lead.campaign_title && lead.campaign_title.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (selectedCampaignId !== 'all' && lead.campaign_id !== selectedCampaignId) {
      return false
    }

    if (selectedType !== 'all' && lead.contact_type !== selectedType) {
      return false
    }

    return true
  })

  // KPIs
  const totalLeads = leads.length
  const whatsappLeads = leads.filter((l) => l.contact_type === 'whatsapp').length
  const emailLeads = leads.filter((l) => l.contact_type === 'email').length
  const whatsappPercent = totalLeads > 0 ? ((whatsappLeads / totalLeads) * 100).toFixed(0) : '0'

  const exportCSV = () => {
    if (filteredLeads.length === 0) return

    const headers = ['Tipo', 'Contato', 'Nome do Participante', 'Campanha', 'Slug', 'Data e Hora']
    const rows = filteredLeads.map((lead) => [
      lead.contact_type === 'whatsapp' ? 'WhatsApp' : 'E-mail',
      lead.contact_value,
      lead.user_name || '',
      lead.campaign_title || 'Campanha',
      lead.campaign_slug || '',
      new Date(lead.created_at).toLocaleString('pt-BR'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `leads_perfilpop_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Leads</span>
            <Contact2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{totalLeads}</p>
          <p className="text-[11px] text-slate-500 mt-1">Contatos coletados no download</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">WhatsApp</span>
            <MessageCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{whatsappLeads}</p>
          <p className="text-[11px] text-slate-500 mt-1">{whatsappPercent}% dos participantes</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">E-mails</span>
            <Mail className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-300">{emailLeads}</p>
          <p className="text-[11px] text-slate-500 mt-1">Leads via correio eletrônico</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Campanhas Ativas</span>
            <Layers className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{campaigns.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Fontes de captura</p>
        </div>
      </div>

      {/* Main Leads Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 shadow-xl backdrop-blur-xl">
        {/* Header & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Contact2 className="w-5 h-5 text-indigo-400" />
              <span>Lista Geral de Leads Capturados</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {filteredLeads.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Todos os contatos informados pelos participantes antes de baixar as fotos
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white transition-colors"
              title="Atualizar lista de leads"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportCSV}
              disabled={filteredLeads.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Todos para CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por telefone, e-mail ou nome..."
              className="w-full pl-9.5 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Campaign Filter */}
          <div className="relative">
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              <option value="all">Todas as Campanhas ({campaigns.length})</option>
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.title} (/c/{camp.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                selectedType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('whatsapp')}
              className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                selectedType === 'whatsapp'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setSelectedType('email')}
              className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                selectedType === 'email' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              E-mail
            </button>
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Carregando contatos capturados...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 border border-slate-800/60 rounded-2xl bg-slate-950/40">
            <Users className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">
              {search || selectedCampaignId !== 'all' || selectedType !== 'all'
                ? 'Nenhum lead corresponde aos filtros selecionados'
                : 'Nenhum lead capturado ainda'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Assim que os participantes baixarem as imagens personalizadas informando WhatsApp ou E-mail, os dados aparecerão nesta central.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Tipo</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Participante</th>
                  <th className="py-3 px-4">Campanha</th>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-950/60 transition-colors group"
                  >
                    {/* Type Badge */}
                    <td className="py-3.5 px-4">
                      {lead.contact_type === 'whatsapp' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Mail className="w-3 h-3" />
                          E-mail
                        </span>
                      )}
                    </td>

                    {/* Contact Value */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {lead.contact_value}
                    </td>

                    {/* Participant Name */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {lead.user_name || <span className="text-slate-600 italic">Não informado</span>}
                    </td>

                    {/* Campaign Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                          {lead.campaign_title || 'Campanha'}
                        </span>
                        {lead.campaign_slug && (
                          <span className="text-[10px] text-indigo-400 font-mono">
                            /c/{lead.campaign_slug}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{new Date(lead.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {lead.contact_type === 'whatsapp' && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${lead.contact_value.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors"
                            title="Abrir conversa no WhatsApp"
                          >
                            <span>Conversar</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          onClick={() => copyContact(lead.id, lead.contact_value)}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                          title="Copiar contato"
                        >
                          {copiedId === lead.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
