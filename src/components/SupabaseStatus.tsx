'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Database } from 'lucide-react'

type ConnectionStatus = 'checking' | 'connected' | 'unconfigured' | 'error'

export function SupabaseStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [campaignCount, setCampaignCount] = useState<number | null>(null)

  const checkConnection = async () => {
    setStatus('checking')
    setErrorMessage(null)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
      setStatus('unconfigured')
      return
    }

    try {
      const supabase = createClient()
      const { data, error, count } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })

      if (error) {
        setStatus('error')
        setErrorMessage(error.message)
      } else {
        setStatus('connected')
        setCampaignCount(count ?? 0)
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err?.message || 'Falha ao conectar com o Supabase')
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all shadow-xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Status da Conexão Supabase</h3>
            <p className="text-xs text-slate-400">Verificação automática da tabela `campaigns`</p>
          </div>
        </div>

        <button
          onClick={checkConnection}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/50 transition-colors"
          title="Recarregar status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
          Testar
        </button>
      </div>

      <div className="mt-4">
        {status === 'checking' && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-300">
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
            <span className="text-sm">Verificando credenciais e conexão com banco...</span>
          </div>
        )}

        {status === 'connected' && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-200">Supabase Conectado com Sucesso!</p>
              <p className="text-xs text-emerald-400/80 mt-0.5">
                Tabela <code className="px-1.5 py-0.5 rounded bg-emerald-950/60 font-mono">campaigns</code> ativa ({campaignCount} {campaignCount === 1 ? 'campanha' : 'campanhas'} cadastradas).
              </p>
            </div>
          </div>
        )}

        {status === 'unconfigured' && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-200">Credenciais Pendentes</p>
              <p className="text-xs text-amber-300/80 mt-1">
                Configure suas variáveis no arquivo <code className="px-1.5 py-0.5 rounded bg-amber-950/60 font-mono">.env.local</code>:
              </p>
              <ul className="list-disc list-inside text-xs mt-1.5 space-y-0.5 text-amber-400/90 font-mono">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-rose-200">Erro na Conexão</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{errorMessage}</p>
              <p className="text-xs text-rose-400/70 mt-1">
                Certifique-se de ter executado o script <code className="px-1.5 py-0.5 rounded bg-rose-950/60 font-mono">supabase/schema.sql</code> no SQL Editor.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
