-- ==============================================================================
-- SCHEMA DE BANCO DE DADOS E STORAGE (V3.0): PLATAFORMA DE MOLDURAS DINÂMICAS
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação da Tabela `campaigns` (com métricas, formatos e multi-usuário/proprietário)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    frame_url TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT '1:1' CHECK (format IN ('1:1', '4:5', '3:4', 'circle')),
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    downloads_count INTEGER NOT NULL DEFAULT 0,
    frames JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migração para tabelas existentes: adicionar colunas se não existirem
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT '1:1';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS downloads_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS frames JSONB DEFAULT '[]'::jsonb;

-- 3. Índices para Otimização de Busca e Performance
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_email ON public.campaigns(user_email);
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

-- 5. Habilitar Segurança por Linha (Row Level Security - RLS) para `campaigns`
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública de campanhas" ON public.campaigns;
CREATE POLICY "Permitir leitura pública de campanhas"
    ON public.campaigns
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir inserção de campanhas" ON public.campaigns;
CREATE POLICY "Permitir inserção de campanhas"
    ON public.campaigns
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de campanhas" ON public.campaigns;
CREATE POLICY "Permitir atualização de campanhas"
    ON public.campaigns
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de campanhas" ON public.campaigns;
CREATE POLICY "Permitir exclusão de campanhas"
    ON public.campaigns
    FOR DELETE
    USING (true);


-- ==============================================================================
-- 6. TABELA DE LEADS CAPTURADOS NO DOWNLOAD (`campaign_leads`)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL CHECK (contact_type IN ('whatsapp', 'email')),
    contact_value TEXT NOT NULL,
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON public.campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_created_at ON public.campaign_leads(created_at DESC);

ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de campaign_leads" ON public.campaign_leads;
CREATE POLICY "Permitir leitura de campaign_leads"
    ON public.campaign_leads
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir inserção de campaign_leads" ON public.campaign_leads;
CREATE POLICY "Permitir inserção de campaign_leads"
    ON public.campaign_leads
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de campaign_leads" ON public.campaign_leads;
CREATE POLICY "Permitir exclusão de campaign_leads"
    ON public.campaign_leads
    FOR DELETE
    USING (true);

-- 7. Função RPC atômica para salvar Lead e incrementar Download da Campanha
CREATE OR REPLACE FUNCTION public.record_lead_and_download(
    p_campaign_id UUID,
    p_contact_type TEXT,
    p_contact_value TEXT,
    p_user_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_lead_id UUID;
BEGIN
    -- Inserir o lead
    INSERT INTO public.campaign_leads (campaign_id, contact_type, contact_value, user_name)
    VALUES (p_campaign_id, p_contact_type, p_contact_value, p_user_name)
    RETURNING id INTO new_lead_id;

    -- Incrementar contador de downloads da campanha
    UPDATE public.campaigns
    SET downloads_count = downloads_count + 1
    WHERE id = p_campaign_id;

    RETURN new_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- CONFIGURAÇÃO DO STORAGE BUCKET (frames)
-- ==============================================================================

-- 8. Criação do Bucket de Molduras (`frames`)
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

-- 9. Políticas de RLS para o Storage (`storage.objects`)

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


-- ==============================================================================
-- 10. TABELA DE USUÁRIOS ADMINISTRADORES E EDITORES (`admin_users`)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
    can_access_master_admin BOOLEAN NOT NULL DEFAULT false,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'unlimited')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrações caso a tabela já exista
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS can_access_master_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- Índices para busca rápida de usuários por e-mail e data
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_at ON public.admin_users(created_at DESC);

-- Habilitar Segurança por Linha (Row Level Security - RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso restritas para `admin_users` (protegendo senhas e hashes contra leitura anônima):
DROP POLICY IF EXISTS "Permitir leitura de admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Permitir inserção de admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Permitir atualização de admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Permitir exclusão de admin_users" ON public.admin_users;

CREATE POLICY "Acesso restrito service_role para admin_users"
    ON public.admin_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
