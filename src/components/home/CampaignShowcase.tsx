'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Campaign, CampaignFormat, getPrimaryFrameUrl } from '@/types/database'
import { getPublicCampaigns } from '@/actions/campaigns'
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Users,
  Square,
  Smartphone,
  CircleDot,
  Flame,
  Search,
  Eye,
  Camera,
} from 'lucide-react'

interface CampaignShowcaseProps {
  initialCampaigns?: Campaign[]
}

export function CampaignShowcase({ initialCampaigns = [] }: CampaignShowcaseProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(initialCampaigns.length === 0)

  useEffect(() => {
    if (initialCampaigns.length === 0) {
      getPublicCampaigns()
        .then((data) => setCampaigns(data))
        .catch((err) => console.error('Error fetching showcase campaigns:', err))
        .finally(() => setLoading(false))
    }
  }, [initialCampaigns])

  const filtered = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  )

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
    <section id="galeria" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Vitrine Pública de Campanhas</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Explore as Campanhas Ativas
        </h2>
        <p className="text-slate-400 text-base sm:text-lg mt-3">
          Veja as molduras criadas por movimentos, empresas e criadores. Escolha uma campanha, adicione sua foto e participe agora mesmo!
        </p>

        {/* Search */}
        {campaigns.length > 3 && (
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar campanha por nome..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Carregando campanhas ativas...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-12 text-center backdrop-blur-xl max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhuma campanha em destaque no momento</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Seja o primeiro a criar uma campanha e divulgar para a sua comunidade!
          </p>
          <Link
            href="/admin"
            prefetch={false}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span>Criar Minha Campanha</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((camp) => (
            <div
              key={camp.id}
              className="group rounded-3xl border border-slate-800/90 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/50 p-5 backdrop-blur-xl shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Frame Preview Visualizer */}
                <div
                  className={`relative w-full overflow-hidden border border-slate-800 rounded-2xl bg-slate-950 flex items-center justify-center mb-4 transition-transform group-hover:scale-[1.02] ${
                    camp.format === '4:5' || camp.format === '3:4'
                      ? 'aspect-[4/5] max-h-64'
                      : camp.format === 'circle'
                      ? 'aspect-square max-h-60 rounded-full mx-auto border-indigo-500/30'
                      : 'aspect-square max-h-60'
                  }`}
                >
                  {/* Checkerboard */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #1e293b 75%),
                        linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                      `,
                      backgroundSize: '12px 12px',
                      backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                      backgroundColor: '#0f172a',
                    }}
                  />

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPrimaryFrameUrl(camp)}
                    alt={camp.title}
                    className="relative z-10 w-full h-full object-contain pointer-events-none select-none p-2"
                  />

                  <div className="absolute top-2.5 right-2.5 z-20">
                    {renderFormatBadge(camp.format)}
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors truncate">
                    {camp.title}
                  </h3>
                  <p className="text-xs text-indigo-400 font-mono truncate">
                    /c/{camp.slug}
                  </p>
                </div>
              </div>

              {/* Action & Stats Footer */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-slate-300">
                    {(camp.downloads_count || 0).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[11px] text-slate-500">fotos criadas</span>
                </div>

                <Link
                  href={`/c/${camp.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer shrink-0"
                >
                  <span>Participar</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
