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

## Dados locais

O projeto possui um snapshot versionado da PokéAPI em `data/pokeapi/`. A aplicação tenta usar esse snapshot antes da API online e mantém um cache local da sessão. Para gerar ou validar os dados, use Node 18+:

```text
npm run sync:data
npm run validate:data
npm test
```

O sincronizador consulta somente a PokéAPI oficial, gera um manifesto com data e segmenta os recursos para carregamento sob demanda. `--no-assets` pode ser usado quando apenas os JSON forem necessários. A ausência do snapshot não impede o funcionamento: nesse caso, o repositório usa a API online como fallback.

## Dados locais

`src/data/` fornece normalização, cache, leitura do snapshot e fallback para a PokéAPI sem alterar os jogos existentes. Para gerar um snapshot real, com índices, segmentos de 100 registros e artwork local, execute `npm run sync:data`. A opção `--no-assets` evita os downloads de imagens. Depois, `npm run validate:data` verifica o manifesto e todos os arquivos referenciados.

O snapshot não é incluído por padrão: ele é um artefato grande, gerado exclusivamente a partir da PokéAPI, e não há fixture apresentada como dado oficial.

## Sessões

Os seis quizzes possuem os modos 10, 20, 30 fases e Infinito. O modo de 10 fases é o padrão. A pontuação, a sequência e o cronômetro aparecem durante a partida. O cronômetro pausa quando a aba fica inativa, e trocar de jogo descarta a partida atual. O PokeDoku permanece no fluxo livre original.

Os filtros de geração, lendários, míticos, bebês, Megas e Paradoxos ficam na abertura de cada quiz compatível. As opções impossíveis são desabilitadas conforme a geração escolhida e os filtros usados ficam registrados no resultado e no card.

Ao terminar uma sessão numerada, o resultado aparece em um card PNG vertical e pode ser enviado pelo botão de compartilhamento nativo do dispositivo. Em um PC sem suporte a compartilhamento de arquivos, o botão exibe um QR Code para continuar o fluxo no celular; o download permanece disponível como alternativa explícita.

O resultado não exibe pontuação. Ele mostra o tempo total, os acertos, erros e as dez últimas respostas, com Pokémon, tipos ou movimentos conforme o jogo. A mesma lista e o tempo são usados na prévia e no card compartilhado.
