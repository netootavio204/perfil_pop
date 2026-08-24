Objetivo: Criar a página que o público vai acessar.

Tarefas:

Criar rota dinâmica /c/[slug].

Fazer a busca (fetch) no Supabase baseada no slug para resgatar o title e a frame_url.

Se não encontrar, retornar página 404 customizada.

Criar a interface do usuário contendo: Título da campanha, visualização prévia da moldura, e um botão "Escolher minha foto" (<input type="file" accept="image/*">).

Critério de Aceite (DoD): Acessar /c/meu-slug exibe a moldura correta vinda do Supabase e o usuário consegue selecionar uma foto do seu dispositivo (que ainda não será processada, apenas selecionada).