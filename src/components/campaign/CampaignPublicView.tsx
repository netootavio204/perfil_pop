'use client'

import { useState, useRef, useEffect } from 'react'
import { Campaign, CampaignFormat } from '@/types/database'
import { CanvasEditor } from '@/components/campaign/CanvasEditor'
import { incrementCampaignView } from '@/actions/campaigns'
import {
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Share2,
  Ratio,
  Eye,
  Camera,
  Square,
  Circle,
  Smartphone,
} from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

interface CampaignPublicViewProps {
  campaign: Campaign
}

export function CampaignPublicView({ campaign }: CampaignPublicViewProps) {
  const [userPhoto, setUserPhoto] = useState<File | null>(null)
  const [currentFormat, setCurrentFormat] = useState<CampaignFormat>(campaign.format || '1:1')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Multi-frame support with 100% backward compatibility for single-frame campaigns
  const availableFrames: string[] =
    campaign.frames && Array.isArray(campaign.frames) && campaign.frames.length > 0
      ? campaign.frames
      : [campaign.frame_url]

  const [selectedFrameUrl, setSelectedFrameUrl] = useState<string>(availableFrames[0])

  useEffect(() => {
    if (availableFrames.length > 0 && !availableFrames.includes(selectedFrameUrl)) {
      setSelectedFrameUrl(availableFrames[0])
    }
  }, [availableFrames, selectedFrameUrl])

  // 1. Automatic View Telemetry on Load (Once per session per campaign)
  useEffect(() => {
    if (!campaign?.id) return

    const sessionKey = `viewed_camp_${campaign.id}`
    const alreadyViewed = sessionStorage.getItem(sessionKey)

    if (!alreadyViewed) {
      sessionStorage.setItem(sessionKey, 'true')
      incrementCampaignView(campaign.id).catch((err) => {
        console.warn('Silent failure on view telemetry:', err)
      })
    }
  }, [campaign?.id])

  const handlePhotoSelect = (file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).')
      return
    }

    setUserPhoto(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoSelect(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removePhoto = () => {
    setUserPhoto(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const copyShareLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Participe da campanha "${campaign.title}"! Coloque a moldura oficial na sua foto agora: ${window.location.href}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: `Participe da campanha "${campaign.title}" e personalize sua foto!`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled or share failed
        console.log('Share dismissed:', err)
      }
    } else {
      copyShareLink()
    }
  }

  const formatLabels: Record<CampaignFormat, { name: string; tag: string; desc: string; icon: any }> = {
    '1:1': {
      name: 'Quadrado (1:1)',
      tag: 'Feed / Post',
      desc: 'Ideal para posts no Instagram, Facebook e redes sociais.',
      icon: Square,
    },
    'circle': {
      name: 'Circular (Avatar)',
      tag: 'Foto de Perfil',
      desc: 'Máscara redonda para fotos de perfil do WhatsApp, Instagram e Twitter.',
      icon: Circle,
    },
    '4:5': {
      name: 'Retrato (4:5)',
      tag: 'Feed / Stories',
      desc: 'Proporção vertical 1080×1350px (4:5) ideal para feed do Instagram e redes sociais.',
      icon: Smartphone,
    },
    '3:4': {
      name: 'Retrato (4:5)',
      tag: 'Feed / Stories',
      desc: 'Proporção vertical 1080×1350px (4:5) ideal para feed do Instagram e redes sociais.',
      icon: Smartphone,
    },
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 pb-20">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="group">
            <Logo size="sm" showSubtitle={false} />
          </Link>

          <div className="flex items-center gap-2">
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
                title="Compartilhar"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
            )}

            <button
              onClick={shareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/50 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Campaign Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        {/* Campaign Title & Meta Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campanha Oficial</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 text-xs font-medium">
              <Ratio className="w-3 h-3 text-indigo-400" />
              <span>{formatLabels[currentFormat]?.name || '1:1'}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            {campaign.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            {userPhoto
              ? 'Ajuste sua foto na moldura (zoom, arrastar, rotacionar) e baixe seu avatar finalizado em alta qualidade.'
              : 'Escolha o formato desejado para o seu avatar e selecione sua foto para aplicar a moldura oficial.'}
          </p>
        </div>

        {/* Format Selector Bar for End-User */}
        <div className="max-w-lg mx-auto mb-8">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Ratio className="w-3.5 h-3.5 text-indigo-400" />
              Formato do seu Avatar:
            </span>
            <span className="text-[11px] text-indigo-400 font-medium">
              {formatLabels[currentFormat]?.tag}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setCurrentFormat('1:1')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentFormat === '1:1'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Square className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
              <span className="truncate">1:1 Quadrado</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentFormat('circle')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentFormat === 'circle'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Circle className="w-3.5 h-3.5 shrink-0 text-purple-300" />
              <span className="truncate">Circular</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentFormat('4:5')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentFormat === '4:5' || currentFormat === '3:4'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0 text-pink-300" />
              <span className="truncate">4:5 Retrato</span>
            </button>
          </div>
        </div>

        {/* Multiple Frames Model Selector (When campaign has 2+ frames) */}
        {availableFrames.length > 1 && (
          <div className="max-w-lg mx-auto mb-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-1 mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                Escolha o Modelo da Moldura:
              </span>
              <span className="text-[11px] text-indigo-400 font-medium">
                {availableFrames.indexOf(selectedFrameUrl) + 1} de {availableFrames.length} opções
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 overflow-x-auto p-2 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl shadow-xl">
              {availableFrames.map((url, index) => {
                const isSelected = url === selectedFrameUrl
                return (
                  <button
                    key={url + index}
                    type="button"
                    onClick={() => setSelectedFrameUrl(url)}
                    className={`relative shrink-0 flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/20 shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div
                      className="w-16 h-16 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center relative mb-1.5"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #1e293b 25%, transparent 25%),
                          linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #1e293b 75%),
                          linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                        `,
                        backgroundSize: '10px 10px',
                        backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Modelo ${index + 1}`}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      Opção {index + 1}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {userPhoto ? (
          /* Canvas Editor View (Fases 4 & 5) */
          <CanvasEditor
            frameUrl={selectedFrameUrl}
            availableFrames={availableFrames}
            onFrameChange={setSelectedFrameUrl}
            userPhotoFile={userPhoto}
            campaignTitle={campaign.title}
            campaignSlug={campaign.slug}
            campaignId={campaign.id}
            format={currentFormat}
            onFormatChange={setCurrentFormat}
            onResetPhoto={removePhoto}
          />
        ) : (
          /* Photo Selection & Frame Preview View (Fase 4) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Frame Preview Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Moldura Oficial
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  {formatLabels[currentFormat]?.tag}
                </span>
              </div>

              {/* Format-Adaptive Frame Viewer with Checkerboard */}
              <div
                className={`relative w-full overflow-hidden border shadow-inner bg-slate-950 flex items-center justify-center transition-all duration-300 ${
                  currentFormat === '4:5' || currentFormat === '3:4'
                    ? 'max-w-[280px] aspect-[4/5] rounded-2xl border-slate-800'
                    : currentFormat === 'circle'
                    ? 'max-w-[300px] aspect-square rounded-full border-2 border-indigo-500/50 shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-500/10'
                    : 'max-w-[320px] aspect-square rounded-2xl border-slate-800'
                }`}
              >
                {/* Checkerboard background for transparency */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #1e293b 25%, transparent 25%),
                      linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #1e293b 75%),
                      linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                    `,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#0f172a',
                  }}
                />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedFrameUrl}
                  alt={campaign.title}
                  className="relative z-10 w-full h-full object-contain object-bottom pointer-events-none select-none"
                />
              </div>

              <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-400">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Alta Resolução HD
                </span>
                <span className="font-mono text-slate-500">
                  {currentFormat === '4:5' || currentFormat === '3:4' ? '1080 × 1350' : '1080 × 1080'}
                </span>
              </div>
            </div>

            {/* User Photo Selection Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  Escolha sua Foto
                </h3>
                <p className="text-xs text-slate-400">
                  Selecione uma foto da sua galeria ou câmera para encaixar na moldura.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handlePhotoSelect(e.target.files[0])
                  }
                }}
              />

              {/* Drop / Upload Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/70 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 group-hover:scale-110 flex items-center justify-center mb-4 transition-transform shadow-lg shadow-indigo-500/10 border border-indigo-500/30">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">
                  Toque para escolher sua foto
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Ou arraste e solte uma imagem aqui (JPG, PNG, WebP)
                </p>

                <button
                  type="button"
                  className="mt-5 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 pointer-events-none"
                >
                  Selecionar da Galeria
                </button>
              </div>

              {/* Privacy Badge */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">100% Privado e Seguro:</strong> Sua foto não é enviada para nenhum servidor. O processamento da imagem é executado exclusivamente no seu navegador.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
