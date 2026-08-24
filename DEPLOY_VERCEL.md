# 🚀 Guia Oficial de Publicação e Deploy na Vercel (PerfilPop V2.0)

Este guia orienta o deploy completo da **Plataforma SaaS de Avatares e Campanhas Dinâmicas (PerfilPop)** na Vercel com banco de dados e Storage Supabase.

---

## 1. Pré-requisitos

1. **Conta no Supabase:** [https://supabase.com](https://supabase.com)
2. **Conta na Vercel:** [https://vercel.com](https://vercel.com)
3. **Repositório Git:** Código versionado no GitHub, GitLab ou Bitbucket.

---

## 2. Preparação do Banco de Dados e Storage (Supabase)

1. Acesse o painel do seu projeto no **Supabase**.
2. Abra o menu **SQL Editor** e execute o script contido em `supabase/schema.sql`.
   - Criação da tabela `campaigns` com suporte aos formatos (`1:1`, `3:4`, `circle`) e métricas (`views_count`, `downloads_count`).
   - Funções RPC atômicas `increment_views` e `increment_downloads`.
   - Criação do bucket público de Storage `frames`.
   - Configuração de políticas de segurança por linha (RLS).
3. **Configuração de CORS no Storage (Crucial para o HTML5 Canvas):**
   - No painel do Supabase, vá em **Project Settings -> Storage**.
   - Certifique-se de que as requisições de origem cruzada (CORS) permitam seu domínio Vercel (`*` ou `https://seu-dominio.vercel.app`), com métodos `GET, POST, PUT, DELETE, OPTIONS` e headers `*`.

---

## 3. Deploy na Vercel

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard) e clique em **Add New... -> Project**.
2. Importe o repositório do seu projeto.
3. Em **Build and Output Settings**, mantenha o padrão do Next.js.
4. Na seção **Environment Variables**, adicione as seguintes variáveis de ambiente:

| Nome da Variável | Exemplo de Valor | Descrição |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyzproject.supabase.co` | URL pública da API do seu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Chave pública anônima (`anon key`) |
| `ADMIN_EMAIL` | `netootavio204@gmail.com` | E-mail do administrador para acesso ao `/admin` |
| `ADMIN_PASSWORD` | `*120326*` | Senha forte de acesso ao painel `/admin` |

5. Clique em **Deploy**.

---

## 4. Checklist de Homologação Pós-Deploy

- [ ] **Landing Page (`/`):** Teste o carregamento do Hero, showcase interativo e formulário da lista VIP.
- [ ] **Painel Administrativo (`/admin`):**
  - Autentique-se com a senha configurada em `ADMIN_PASSWORD`.
  - Crie 3 campanhas de teste: uma no formato **1:1 Quadrado**, outra no formato **3:4 Retrato** e outra no formato **Circular**.
  - Verifique se os uploads das molduras PNG ocorrem sem erros no bucket `frames`.
  - Verifique os contadores de telemetria no Dashboard.
- [ ] **Página Pública da Campanha (`/c/[slug]`):**
  - Abra em aba anônima ou no celular.
  - Verifique se a visualização incrementa o contador `views_count` (+1).
  - Faça upload de uma foto da galeria ou câmera.
  - Teste os controles de pan, zoom (e pinch no celular), rotação e espelhamento.
  - Clique em **"Baixar Imagem com Moldura"**.
  - Verifique se o download da imagem em alta resolução ocorre e se o contador `downloads_count` (+1) é atualizado no painel `/admin`.
- [ ] **Compartilhamento:** Teste o botão de **WhatsApp** e **Copiar Link** / **Web Share API**.

---

🎉 **Pronto! Sua plataforma PerfilPop está 100% operacional em produção.**
