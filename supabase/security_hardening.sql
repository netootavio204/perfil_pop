-- ==============================================================================
-- MIGRAÇÃO DE SEGURANÇA E BLINDAGEM DE DADOS (RLS HARDENING)
-- ==============================================================================
-- Execute este script no SQL Editor do seu painel Supabase para blindar:
-- 1. admin_users (bloqueia vazamento público de senhas e dados de administradores)
-- 2. campaign_leads (bloqueia vazamento de telefones/e-mails de clientes pela chave pública anon)
-- 3. campaigns (garante que apenas o backend/service_role possa alterar ou excluir campanhas)
-- ==============================================================================

-- 1. BLINDAGEM DA TABELA `admin_users`
-- Revoga leitura anônima de hashes e dados de administradores
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Permitir inserção de admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Permitir atualização de admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Permitir exclusão de admin_users" ON public.admin_users;

-- Apenas o backend (service_role) pode ler, inserir ou alterar admin_users
CREATE POLICY "Acesso restrito service_role para admin_users"
    ON public.admin_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- 2. BLINDAGEM DA TABELA `campaign_leads`
-- Permite que visitantes insiram novos leads ao baixar a foto, mas NUNCA leiam os dados de outros clientes!
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de campaign_leads" ON public.campaign_leads;
DROP POLICY IF EXISTS "Permitir inserção de campaign_leads" ON public.campaign_leads;
DROP POLICY IF EXISTS "Permitir exclusão de campaign_leads" ON public.campaign_leads;

-- Permitir inserção de novos leads publicamente (captura no download)
CREATE POLICY "Permitir inserção pública de leads"
    ON public.campaign_leads
    FOR INSERT
    WITH CHECK (true);

-- Apenas service_role (backend) pode consultar e gerenciar leads coletados (evita LGPD leak)
CREATE POLICY "Apenas service_role pode consultar leads"
    ON public.campaign_leads
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "Apenas service_role pode excluir leads"
    ON public.campaign_leads
    FOR DELETE
    TO service_role
    USING (true);


-- 3. BLINDAGEM DA TABELA `campaigns`
-- Visitantes podem visualizar campanhas publicamente, mas não podem alterar ou excluir diretamente via REST API
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública de campanhas" ON public.campaigns;
DROP POLICY IF EXISTS "Permitir inserção de campanhas" ON public.campaigns;
DROP POLICY IF EXISTS "Permitir atualização de campanhas" ON public.campaigns;
DROP POLICY IF EXISTS "Permitir exclusão de campanhas" ON public.campaigns;

-- Leitura pública de campanhas (necessária para página pública /c/[slug] e vitrine)
CREATE POLICY "Leitura pública de campanhas"
    ON public.campaigns
    FOR SELECT
    USING (true);

-- Apenas service_role pode criar, editar ou excluir campanhas
CREATE POLICY "Apenas service_role pode gerenciar campanhas"
    ON public.campaigns
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
