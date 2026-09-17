# Snapshot PokéAPI

Este diretório é gerado por `npm run sync:data`. O sincronizador consulta a PokéAPI oficial, normaliza os recursos e grava índices e segmentos de 100 registros, evitando dados manuais no repositório.

O snapshot completo e os sprites podem ser grandes; por isso nenhum conteúdo fictício é versionado. `manifest.json` só aparece após uma sincronização real. O frontend pode usar `createLocalData` com o manifesto gerado e cair para a API quando um registro não existir localmente.
