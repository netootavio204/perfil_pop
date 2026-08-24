[DOCUMENTO FUNDAÇÃO] PRD - Plataforma de Molduras Dinâmicas
1. Visão Geral do Produto
Uma plataforma web focada em engajamento social, similar ao Twibbonize. A aplicação permite que o Administrador crie campanhas fazendo upload de imagens (molduras PNG com fundo transparente). O sistema gera um link único para a campanha. O usuário final acessa o link, faz upload de sua própria foto pelo navegador (sem salvar no banco de dados), ajusta sua foto atrás da moldura e faz o download da imagem finalizada para uso em redes sociais.

2. Arquitetura e Stack Tecnológico

Front-end: Next.js (App Router), React, Tailwind CSS.

Back-end & Database: Supabase (PostgreSQL para dados, Storage para os arquivos de moldura).

Hospedagem: Vercel.

Processamento de Imagem: HTML5 Canvas puro (lado do cliente). A foto do usuário nunca toca no servidor.

3. Modelagem de Dados (Supabase)

Tabela campaigns:

id (UUID, Primary Key)

title (Texto, Nome da campanha)

slug (Texto, Único, Usado para a URL amigável. Ex: /c/minha-campanha)

frame_url (Texto, URL pública do bucket do Supabase onde está a moldura)

created_at (Timestamp)

Storage Bucket: frames (Políticas públicas de visualização ativadas; bloqueio de CORS configurado para permitir a aplicação web).