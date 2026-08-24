# 🖼️ PerfilPop — Plataforma SaaS de Avatares e Molduras para Campanhas

**PerfilPop** é uma plataforma web moderna e de alto engajamento social que permite a gestores, partidos, eventos e influenciadores criarem campanhas personalizadas com molduras digitais (avatares, posts e stories), com telemetria em tempo real e processamento de imagem 100% no navegador.

---

## ✨ Principais Funcionalidades

- **🎭 3 Formatos de Campanha:**
  - `1:1` Quadrado (Feed / Instagram / Facebook)
  - `3:4` Retrato (Stories / Cartazes)
  - `Circular` (Foto de Perfil / WhatsApp)
- **⚡ Motor HTML5 Canvas Avançado:**
  - Render loop a 60 FPS com `requestAnimationFrame`.
  - Multi-touch (Pinch-to-zoom) no celular e wheel zoom no Desktop.
  - Pan livre, rotação em 360°, inversão horizontal (espelhamento) e atalhos de teclado.
  - Presets instantâneos: Centralizar, Conter e Preencher.
- **📊 Telemetria e Dashboard em Tempo Real:**
  - Métricas de **Visualizações** (`views_count`) e **Downloads** (`downloads_count`) por campanha e KPIs globais.
  - Operações atômicas via RPC no Supabase com proteção contra contagem duplicada por sessão.
- **🔒 Privacidade Garantida:**
  - As fotos dos usuários nunca são salvas ou transmitidas para nenhum servidor; todo o recorte e composição ocorrem no cliente.
- **📱 Compartilhamento Social Fácil:**
  - Suporte à Web Share API nativa, botão direto para WhatsApp e cópia de link em 1 clique.
- **🛡️ Painel Administrativo:**
  - Rota `/admin` protegida por autenticação para criação de campanhas, upload de molduras PNG e gestão de métricas.

---

## 🛠️ Stack Tecnológica

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org) + [React 19](https://react.dev)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com) + Lucide Icons
- **Banco de Dados & Storage:** [Supabase](https://supabase.com) (PostgreSQL, Storage S3, RLS, RPCs)
- **Hospedagem:** [Vercel](https://vercel.com)

---

## 🚀 Como Rodar Localmente

1. Clone o repositório e instale as dependências:
```bash
npm install
```

2. Crie um arquivo `.env.local` na raiz com as credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
ADMIN_PASSWORD=sua-senha-de-admin
```

3. Execute o script `supabase/schema.sql` no SQL Editor do seu projeto Supabase.

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse:
- **Landing Page:** [http://localhost:3000](http://localhost:3000)
- **Painel Admin:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🌐 Deploy na Vercel

Consulte o [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) para o passo a passo completo de configuração das variáveis e homologação em produção.
