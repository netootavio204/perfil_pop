Objetivo: Criar o motor em HTML5 Canvas para manipulação interativa da foto do usuário sob a moldura da campanha.

Tarefas:

1. Renderizar o elemento HTML5 Canvas com proporção 1:1 em alta resolução.
2. Renderização em camadas:
   - Camada Inferior: Foto do usuário ajustável (posicionamento X/Y, escala/zoom, rotação).
   - Camada Superior: Moldura PNG transparente oficial da campanha.
3. Controles Interativos de Manipulação:
   - Arrastar (Pan): Mover a foto livremente com o mouse ou toque (touch em dispositivos móveis).
   - Zoom: Controle deslizante (slider), botões de zoom (+ e -) e suporte à roda do mouse (scroll).
   - Rotação: Botões de giro rápido de 90° e ajuste fino de rotação.
   - Botão de Redefinir/Centralizar foto.
4. Feedback visual e fluidez em tempo real (60 FPS com requestAnimationFrame).

Critério de Aceite (DoD): O usuário consegue carregar sua foto e ajustá-la com fluidez (zoom, arrastar, rotacionar) sob a moldura com preview fiel em tempo real tanto no desktop quanto no mobile.
