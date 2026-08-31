import Link from 'next/link'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'

export default function CampaignNotFound() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/5">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
          Campanha Não Encontrada
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed mb-8">
          O link que você tentou acessar não existe, foi alterado ou a campanha foi encerrada.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Home className="w-4 h-4" />
            <span>Página Inicial</span>
          </Link>

          <Link
            href="/admin"
            prefetch={false}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <span>Painel Admin</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
