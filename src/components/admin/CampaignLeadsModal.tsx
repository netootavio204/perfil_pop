'use client'

import { useState, useEffect } from 'react'
import { Campaign, CampaignLead } from '@/types/database'
import { getCampaignLeads } from '@/actions/campaigns'
import {
  Users,
  Download,
  Mail,
  MessageCircle,
  Clock,
  Search,
  X,
  RefreshCw,
  Copy,
  Check,
  FileSpreadsheet,
} from 'lucide-react'

interface CampaignLeadsModalProps {
  campaign: Campaign | null
  isOpen: boolean
  onClose: () => void
}

export function CampaignLeadsModal({ campaign, isOpen, onClose }: CampaignLeadsModalProps) {
  const [leads, setLeads] = useState<CampaignLead[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchLeads = async () => {
    if (!campaign?.id) return
    setLoading(true)
    try {
      const data = await getCampaignLeads(campaign.id)
      setLeads(data)
    } catch (err) {
      console.error('Error loading campaign leads:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && campaign?.id) {
      fetchLeads()
    } else {
      setLeads([])
      setSearch('')
    }
  }, [isOpen, campaign?.id])

  if (!isOpen || !campaign) return null

  const filteredLeads = leads.filter((lead) => {
    const val = lead.contact_value.toLowerCase()
    const name = (lead.user_name || '').toLowerCase()
    const s = search.toLowerCase()
    return val.includes(s) || name.includes(s)
  })

  const copyContact = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const exportCSV = () => {
    if (leads.length === 0) return

    const headers = ['Tipo', 'Contato', 'Nome', 'Data/Hora']
    const rows = leads.map((lead) => [
      lead.contact_type === 'whatsapp' ? 'WhatsApp' : 'E-mail',
      lead.contact_value,
      lead.user_name || '',
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
    link.setAttribute('download', `leads_${campaign.slug}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6 pr-10">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Contatos & Leads Capturados
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {leads.length} {leads.length === 1 ? 'contato' : 'contatos'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Campanha: <strong className="text-white">{campaign.title}</strong>{' '}
              <span className="font-mono text-indigo-400">(/c/{campaign.slug})</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por telefone, e-mail ou nome..."
              className="w-full pl-9.5 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white transition-colors"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportCSV}
              disabled={leads.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Leads List */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[400px] border border-slate-800/80 rounded-2xl bg-slate-950/50 p-3 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Carregando contatos capturados...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 p-4">
              <Users className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">
                {search ? 'Nenhum contato encontrado com este termo' : 'Nenhum lead capturado ainda'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                {search
                  ? 'Tente buscar por outro número ou e-mail.'
                  : 'Assim que os participantes baixarem as fotos informando WhatsApp ou E-mail, os dados aparecerão aqui.'}
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      lead.contact_type === 'whatsapp'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {lead.contact_type === 'whatsapp' ? (
                      <MessageCircle className="w-4 h-4" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white truncate">
                        {lead.contact_value}
                      </span>
                      {lead.user_name && (
                        <span className="text-[11px] text-slate-400 truncate">
                          ({lead.user_name})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(lead.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {lead.contact_type === 'whatsapp' && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=${lead.contact_value.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 transition-colors"
                    >
                      Conversar
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
