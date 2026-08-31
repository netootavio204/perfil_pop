'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Shield,
  Image as ImageIcon,
  ArrowRight,
  Layers,
  Lock,
  Zap,
  CheckCircle2,
  Share2,
  Download,
  Users,
  BarChart3,
  Globe,
  Sliders,
  Crop,
  Check,
  Star,
  ChevronRight,
  Flame
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { CampaignShowcase } from '@/components/home/CampaignShowcase'

export default function Home() {
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState<'1:1' | '3:4' | 'circle'>('1:1')

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault()
    if (waitlistEmail.trim()) {
      setWaitlistSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple-600/15 blur-[150px] rounded-full" />
      </div>

      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="group">
            <Logo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#galeria" className="hover:text-white text-indigo-400 transition-colors flex items-center gap-1 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Campanhas Ativas</span>
            </a>
            <a href="#como-funciona" className="hover:text-white transition-colors">
              Como Funciona
            </a>
            <a href="#formatos" className="hover:text-white transition-colors">
              Formatos
            </a>
            <a href="#metricas" className="hover:text-white transition-colors">
              Métricas
            </a>
            <a href="#planos" className="hover:text-white transition-colors">
              Planos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              prefetch={false}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl shadow-sm transition-all hover:text-white"
            >
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Painel Admin</span>
            </Link>
            <Link
              href="/admin"
              prefetch={false}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Criar Campanha</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs sm:text-sm font-medium mb-8 shadow-inner shadow-indigo-500/10 animate-fade-in">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>A ferramenta definitiva para campanhas e marketing viral</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
            <span className="text-slate-400 text-xs hidden sm:inline">100% Gratuito</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-8">
            Viralize sua marca com{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              molduras interativas
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto mb-10 font-normal">
            Permita que seus apoiadores, clientes e comunidade gerem fotos de perfil personalizadas em segundos.
            Sem necessidade de baixar apps, com processamento instantâneo direto no navegador e métricas em tempo real.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <Link
              href="/admin"
              prefetch={false}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <span>Começar Grátis Agora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#como-funciona"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all hover:text-white"
            >
              <span>Como Funciona</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </a>
          </div>

          {/* Highlights Mini-Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-800/80 text-left">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Processamento</p>
                <p className="text-sm font-semibold text-white">100% no Navegador</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Crop className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Formatos</p>
                <p className="text-sm font-semibold text-white">1:1, 3:4 & Redondo</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Telemetria</p>
                <p className="text-sm font-semibold text-white">Views & Downloads</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Privacidade</p>
                <p className="text-sm font-semibold text-white">Foto nunca salva no servidor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Campaigns Showcase Section */}
      <CampaignShowcase />

      {/* Interactive Formats Showcase */}
      <section id="formatos" className="py-20 bg-slate-900/50 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20">
              Flexibilidade Total
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-3">
              Molduras sob medida para qualquer rede social
            </h2>
            <p className="text-slate-400 text-base">
              Defina o formato ideal no momento da criação da campanha. O motor Canvas cuida do enquadramento e corte automático.
            </p>

            {/* Tab switch */}
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 mt-8 gap-1">
              <button
                onClick={() => setActiveTab('1:1')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === '1:1'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Quadrado (1:1)
              </button>
              <button
                onClick={() => setActiveTab('3:4')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === '3:4'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Retrato (3:4)
              </button>
              <button
                onClick={() => setActiveTab('circle')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'circle'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Redondo / Perfil
              </button>
            </div>
          </div>

          {/* Interactive Preview Container */}
          <div className="max-w-3xl mx-auto bg-slate-950/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col items-center justify-center">
              <div
                className={`relative bg-gradient-to-tr from-indigo-950/80 to-slate-900 border-2 border-dashed border-indigo-500/40 flex items-center justify-center transition-all duration-300 ${
                  activeTab === '1:1'
                    ? 'w-64 h-64 sm:w-72 sm:h-72 rounded-2xl'
                    : activeTab === '3:4'
                    ? 'w-60 h-80 sm:w-64 sm:h-84 rounded-2xl'
                    : 'w-64 h-64 sm:w-72 sm:h-72 rounded-full'
                }`}
              >
                <div className="text-center p-6">
                  <ImageIcon className="w-12 h-12 text-indigo-400/80 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white">
                    {activeTab === '1:1' && 'Formato Quadrado (1:1)'}
                    {activeTab === '3:4' && 'Formato Retrato (3:4)'}
                    {activeTab === 'circle' && 'Formato Circular (Perfil)'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeTab === '1:1' && 'Perfeito para Feed do Instagram, LinkedIn e Posts em geral.'}
                    {activeTab === '3:4' && 'Ideal para crachás, cartazes digitais e stories verticais.'}
                    {activeTab === 'circle' && 'Com corte circular automático (clip) para avatares do WhatsApp e redes.'}
                  </p>
                </div>

                {/* Simulated frame badge */}
                <div className="absolute bottom-3 px-3 py-1 rounded-full bg-slate-950/80 border border-indigo-500/30 text-[11px] font-mono text-indigo-300">
                  {activeTab === '1:1' && '1080 × 1080 px'}
                  {activeTab === '3:4' && '1080 × 1440 px'}
                  {activeTab === 'circle' && '1080 × 1080 px (Circle Mask)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="como-funciona" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20">
            Passo a Passo Simples
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4 mb-4">
            Como funciona a plataforma
          </h2>
          <p className="text-slate-400 text-lg">
            Do upload da moldura ao download viral em menos de 3 minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-7 backdrop-blur relative flex flex-col hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Crie a Campanha</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              No painel admin, envie seu PNG transparente e selecione o formato desejado (1:1, 3:4 ou Redondo).
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-7 backdrop-blur relative flex flex-col hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Compartilhe o Link</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Divulgue seu link exclusivo <code className="text-purple-300 font-mono text-xs bg-purple-950/60 px-1 py-0.5 rounded">/c/sua-marca</code> no WhatsApp, Instagram e grupos.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-7 backdrop-blur relative flex flex-col hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Ajuste em Tempo Real</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              O apoiador sobe a foto e ajusta zoom, posição e rotação suavemente a 60 FPS direto no navegador.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-7 backdrop-blur relative flex flex-col hover:border-slate-700 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
              4
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Download & Métricas</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Imagem mesclada em altíssima qualidade é baixada, enquanto o dashboard registra a nova conversão.
            </p>
          </div>
        </div>
      </section>

      {/* Metrics Telemetry Highlight */}
      <section id="metricas" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/20">
                Dashboard de Métricas
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4">
                Monitore o engajamento e o alcance real da sua ação
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-6">
                Tenha total controle sobre quantas pessoas acessaram o seu link de campanha e quantas efetivamente baixaram a arte com a sua moldura.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-1">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Contador de Visualizações (Views)</h4>
                    <p className="text-xs text-slate-400">Telemetria automática disparada a cada acesso na rota pública.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-1">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Contador de Conversões (Downloads)</h4>
                    <p className="text-xs text-slate-400">Incrementado no exato instante em que o arquivo final é exportado.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual metrics card mock */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h4 className="font-bold text-white">Campanha de Exemplo</h4>
                  <p className="text-xs text-indigo-400 font-mono">/c/apoie-a-causa-2026</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ativa
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Visualizações Totais</p>
                  <p className="text-3xl font-extrabold text-white mt-1">14.820</p>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    +18% hoje
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Fotos Geradas (Downloads)</p>
                  <p className="text-3xl font-extrabold text-indigo-400 mt-1">9.450</p>
                  <p className="text-[11px] text-indigo-300 mt-1 font-medium">
                    63.7% taxa de conversão
                  </p>
                </div>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full w-[64%]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Plans Section (SaaS View) */}
      <section id="planos" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
            Modelos de Assinatura
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4 mb-4">
            Planos transparentes para qualquer porte
          </h2>
          <p className="text-slate-400 text-lg">
            Comece 100% grátis para validar sua campanha e faça upgrade quando precisar de recursos corporativos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan 1: Free (Forever) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 sm:p-10 flex flex-col justify-between hover:border-slate-700 transition-all relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-2xl text-white">Gratuito</h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Para Sempre
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Tudo o que você precisa para criar campanhas e validar o engajamento da sua comunidade.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl sm:text-5xl font-extrabold text-white">R$ 0</span>
                <span className="text-slate-400 text-sm">/mês</span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-300 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Campanhas ativas ilimitadas</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Todos os formatos: 1:1, 3:4 e Redondo</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Processamento de imagem 100% no navegador</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Contador básico de Views e Downloads</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Exportação em alta resolução (1080p)</span>
                </li>
              </ul>
            </div>

            <Link
              href="/admin"
              prefetch={false}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Começar Grátis Agora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Plan 2: Pro (Coming Soon) */}
          <div className="rounded-3xl border-2 border-indigo-500/50 bg-gradient-to-b from-indigo-950/30 to-slate-900/70 p-8 sm:p-10 flex flex-col justify-between relative shadow-2xl shadow-indigo-500/10">
            {/* Ribbon Badge */}
            <div className="absolute -top-3.5 right-8 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg">
              Em Breve
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-2xl text-white">Plano Pro</h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Recursos Avançados
                </span>
              </div>
              <p className="text-sm text-slate-300 mb-6">
                Para empresas, agências, influenciadores e campanhas de grande escala.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl sm:text-5xl font-extrabold text-white">R$ 49</span>
                <span className="text-slate-400 text-sm">/mês (estimado)</span>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-200 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="font-semibold text-white">Tudo do plano Gratuito</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Remoção completa de marca d&apos;água e créditos</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Domínio customizado próprio (ex: suaempresa.com)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Coleta de Leads (E-mail / WhatsApp com opt-in)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Relatórios detalhados com exportação em CSV</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>

            {/* Waitlist Form */}
            <div>
              {waitlistSubmitted ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Você está na lista VIP! Avisaremos no lançamento.</span>
                </div>
              ) : (
                <form onSubmit={handleWaitlist} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Seu melhor e-mail"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all whitespace-nowrap"
                  >
                    Entrar na Lista VIP
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="group">
            <Logo size="sm" showSubtitle={false} />
          </Link>

          <div className="flex items-center gap-6">
            <a href="#como-funciona" className="hover:text-slate-300 transition-colors">Como Funciona</a>
            <a href="#formatos" className="hover:text-slate-300 transition-colors">Formatos</a>
            <a href="#planos" className="hover:text-slate-300 transition-colors">Planos</a>
            <Link href="/admin" prefetch={false} className="hover:text-indigo-400 transition-colors">Admin</Link>
          </div>

          <p>© {new Date().getFullYear()} PerfilPop. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
