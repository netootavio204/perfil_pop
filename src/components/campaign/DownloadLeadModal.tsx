'use client'

import { useState } from 'react'
import { LeadContactType } from '@/types/database'
import {
  MessageCircle,
  Mail,
  Download,
  X,
  Sparkles,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

interface DownloadLeadModalProps {
  isOpen: boolean
  campaignTitle: string
  onClose: () => void
  onSubmit: (lead: { contactType: LeadContactType; contactValue: string; userName?: string }) => Promise<void>
  loading?: boolean
}

export function DownloadLeadModal({
  isOpen,
  campaignTitle,
  onClose,
  onSubmit,
  loading = false,
}: DownloadLeadModalProps) {
  const [contactType, setContactType] = useState<LeadContactType>('whatsapp')
  const [contactValue, setContactValue] = useState('')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const formatWhatsApp = (value: string) => {
    // Keep numbers only
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (contactType === 'whatsapp') {
      setContactValue(formatWhatsApp(raw))
    } else {
      setContactValue(raw)
    }
  }

  const handleTypeSwitch = (type: LeadContactType) => {
    setContactType(type)
    setContactValue('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const clean = contactValue.trim()
    if (!clean) {
      setError(
        contactType === 'whatsapp'
          ? 'Por favor, informe seu número de WhatsApp.'
          : 'Por favor, informe seu endereço de e-mail.'
      )
      return
    }

    if (contactType === 'whatsapp') {
      const digits = clean.replace(/\D/g, '')
      if (digits.length < 10) {
        setError('Informe um número de WhatsApp válido com DDD (ex: 11 99999-9999).')
        return
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(clean)) {
        setError('Por favor, informe um e-mail válido.')
        return
      }
    }

    try {
      await onSubmit({
        contactType,
        contactValue: clean,
        userName: userName.trim() || undefined,
      })
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar. Tente novamente.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            Baixar Sua Foto Oficial
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Informe seu WhatsApp ou E-mail para liberar o download da imagem em alta resolução.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tab Selector: WhatsApp vs E-mail */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2 text-center">
              Como prefere receber novidades da campanha?
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => handleTypeSwitch('whatsapp')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  contactType === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSwitch('email')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  contactType === 'email'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>E-mail</span>
              </button>
            </div>
          </div>

          {/* Contact Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {contactType === 'whatsapp' ? 'Seu WhatsApp (com DDD)' : 'Seu Melhor E-mail'} <span className="text-pink-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                {contactType === 'whatsapp' ? (
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Mail className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <input
                type={contactType === 'whatsapp' ? 'tel' : 'email'}
                required
                value={contactValue}
                onChange={handleContactChange}
                placeholder={contactType === 'whatsapp' ? '(11) 99999-9999' : 'voce@exemplo.com'}
                className="w-full rounded-xl bg-slate-950/90 border border-slate-800 pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Optional Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Seu Nome <span className="text-slate-500 text-[10px]">(opcional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Como prefere ser chamado"
                className="w-full rounded-xl bg-slate-950/90 border border-slate-800 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-4"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Gerando Imagem HD...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Confirmar e Baixar Foto</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Seus dados são confidenciais e protegidos pela campanha.</span>
          </div>
        </form>
      </div>
    </div>
  )
}
