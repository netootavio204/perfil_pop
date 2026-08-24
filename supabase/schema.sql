-- ==============================================================================
-- SCHEMA DE BANCO DE DADOS E STORAGE (V2.0): PLATAFORMA DE MOLDURAS DINÂMICAS
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação da Tabela `campaigns` (V2.0 com métricas e formatos)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    frame_url TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT '1:1' CHECK (format IN ('1:1', '4:5', '3:4', 'circle')),
    views_count INTEGER NOT NULL DEFAULT 0,
    downloads_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migração para tabelas existentes: adicionar colunas se não existirem
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT '1:1';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS downloads_count INTEGER NOT NULL DEFAULT 0;

-- 3. Índices para Otimização de Busca e Performance
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

-- 4. Funções RPC atômicas para contadores de métricas
CREATE OR REPLACE FUNCTION public.increment_views(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.campaigns
  SET views_count = views_count + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_downloads(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.campaigns
  SET downloads_count = downloads_count + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Habilitar Segurança por Linha (Row Level Security - RLS)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso para `campaigns`:
-- Leitura pública para acesso às campanhas
DROP POLICY IF EXISTS "Permitir leitura pública de campanhas" ON public.campaigns;
CREATE POLICY "Permitir leitura pública de campanhas"
    ON public.campaigns
    FOR SELECT
    USING (true);

-- Inserção de campanhas pelo painel admin
DROP POLICY IF EXISTS "Permitir inserção de campanhas" ON public.campaigns;
CREATE POLICY "Permitir inserção de campanhas"
    ON public.campaigns
    FOR INSERT
    WITH CHECK (true);

-- Atualização de campanhas e métricas
DROP POLICY IF EXISTS "Permitir atualização de campanhas" ON public.campaigns;
CREATE POLICY "Permitir atualização de campanhas"
    ON public.campaigns
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Exclusão de campanhas
DROP POLICY IF EXISTS "Permitir exclusão de campanhas" ON public.campaigns;
CREATE POLICY "Permitir exclusão de campanhas"
    ON public.campaigns
    FOR DELETE
    USING (true);


-- ==============================================================================
-- CONFIGURAÇÃO DO STORAGE BUCKET (frames)
-- ==============================================================================

-- 6. Criação do Bucket de Molduras (`frames`)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'frames',
    'frames',
    true,
    5242880, -- Limite de 5MB por arquivo
    ARRAY['image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/webp', 'image/svg+xml'];

-- 7. Políticas de RLS para o Storage (`storage.objects`)

DROP POLICY IF EXISTS "Permitir visualização pública de molduras" ON storage.objects;
CREATE POLICY "Permitir visualização pública de molduras"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'frames');

DROP POLICY IF EXISTS "Permitir upload de molduras no bucket frames" ON storage.objects;
CREATE POLICY "Permitir upload de molduras no bucket frames"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'frames');

DROP POLICY IF EXISTS "Permitir alteração de molduras no bucket frames" ON storage.objects;
CREATE POLICY "Permitir alteração de molduras no bucket frames"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'frames');

DROP POLICY IF EXISTS "Permitir exclusão de molduras no bucket frames" ON storage.objects;
CREATE POLICY "Permitir exclusão de molduras no bucket frames"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'frames');
