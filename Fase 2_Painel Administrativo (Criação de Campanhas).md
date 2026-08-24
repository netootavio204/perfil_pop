Objetivo: Criar a interface onde o Idealista (Admin) cria as campanhas.

Tarefas:

Criar rota /admin (protegida por uma senha hardcoded simples via variável de ambiente para validação rápida).

Criar formulário com campos: Título da Campanha, Slug (URL) e Upload de Arquivo (PNG).

Lógica de submissão: Fazer upload da imagem para o bucket frames no Supabase, pegar a URL pública, e fazer o INSERT na tabela campaigns.

Mostrar uma lista com os links gerados das campanhas existentes.

Critério de Aceite (DoD): Admin consegue fazer upload de um PNG e o link da campanha (ex: [site.com/c/nome-da-campanha](https://site.com/c/nome-da-campanha)) é gerado com sucesso no banco de dados.