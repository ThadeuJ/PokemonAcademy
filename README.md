# PokemonAcademy
Um site pokemon para entretenimento e fixação.

## Arquitetura

O projeto é uma aplicação estática sem dependências de build. `index.html` mantém o shell compartilhado e `app.js` inicializa os módulos em `src/`.

Cada jogo possui seu próprio módulo e é acessível por uma rota hash compatível com GitHub Pages:

- `#/games/silhouette`
- `#/games/types`
- `#/games/stronger`
- `#/games/best-attack`
- `#/games/move-name`
- `#/games/move-type`
- `#/games/doku`

O cache da PokéAPI, filtros e pontuação permanecem compartilhados durante a sessão.

## Sessões

Os seis quizzes possuem os modos 10, 20, 30 fases e Infinito. O modo de 10 fases é o padrão. A pontuação e a sequência são independentes para cada jogo, aparecem apenas durante a partida e uma partida continua preservada ao navegar pelo menu. O PokeDoku permanece no fluxo livre original.

Os filtros de geração, lendários, míticos, bebês, Megas e Paradoxos ficam na abertura de cada quiz compatível. As opções impossíveis são desabilitadas conforme a geração escolhida e os filtros usados ficam registrados no resultado e no card.

Ao terminar uma sessão numerada, o resultado aparece em um card PNG vertical e pode ser enviado pelo botão de compartilhamento nativo do dispositivo. Em um PC sem suporte a compartilhamento de arquivos, o botão exibe um QR Code para continuar o fluxo no celular; o download permanece disponível como alternativa explícita.

O resultado não exibe pontuação. Ele mostra os acertos, erros e as dez últimas respostas, com Pokémon, tipos ou movimentos conforme o jogo. A mesma lista é usada na prévia e no card compartilhado.
