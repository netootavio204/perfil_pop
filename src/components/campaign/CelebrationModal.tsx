'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import {
  Sparkles,
  CheckCircle2,
  Share2,
  MessageCircle,
  Copy,
  Check,
  X,
  HeartHandshake,
} from 'lucide-react'
import { useState } from 'react'

interface CelebrationModalProps {
  isOpen: boolean
  campaignTitle: string
  campaignSlug?: string
  onClose: () => void
}

export function CelebrationModal({
  isOpen,
  campaignTitle,
  campaignSlug = 'campanha',
  onClose,
}: CelebrationModalProps) {
  const [copied, setCopied] = useState(false)

  // Trigger celebration confetti burst on open
  useEffect(() => {
    if (!isOpen) return

    // 1. Initial burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
    })

    // 2. Left and Right cannon bursts
    const timer1 = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ec4899', '#8b5cf6', '#3b82f6'],
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#f59e0b', '#ec4899'],
      })
    }, 250)

    // 3. Floating stars / final flourish
    const timer2 = setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.4 },
        shapes: ['circle'],
      })
    }, 600)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [isOpen])

  if (!isOpen) return null

  const getCampaignUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/c/${campaignSlug}`
    }
    return ''
  }

  const copyShareLink = () => {
    const url = getCampaignUrl()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareWhatsApp = () => {
    const url = getCampaignUrl()
    const text = encodeURIComponent(
      `🎉 Acabei de personalizar minha foto na campanha "${campaignTitle}"! Coloque a moldura oficial na sua foto também: ${url}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const handleNativeShare = async () => {
    const url = getCampaignUrl()
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: campaignTitle,
          text: `Personalize sua foto na campanha "${campaignTitle}"!`,
          url,
        })
      } catch {
        // dismissed
      }
    } else {
      copyShareLink()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/60 text-center animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Celebration Header */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 blur-xl opacity-60 animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-pink-600/30 border border-white/20">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Download Concluído!</span>
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight mb-2">
          Muito Obrigado por Apoiar!
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-xs mx-auto leading-relaxed">
          Sua foto personalizada com a moldura oficial da campanha <strong className="text-white">"{campaignTitle}"</strong> foi salva na sua galeria.
        </p>

        {/* Share Section */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Ajude a espalhar este movimento!
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 transition-all cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={copyShareLink}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>

          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Mais opções de compartilhamento</span>
            </button>
          )}
        </div>

        {/* Action Button to close */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
        >
          Concluir e Voltar
        </button>
      </div>
    </div>
  )
}
