# Plano de Expansão da PokeAcademy

## 1. Diretrizes do projeto

- A PokéAPI será a única fonte de verdade dos dados.
- Nenhuma informação será criada manualmente fora da PokéAPI.
- Poderemos manter um snapshot local dos dados, versionado no GitHub.
- O snapshot deverá ser gerado por um script de sincronização e conter a data da atualização.
- O frontend deverá utilizar os dados locais primeiro e a PokéAPI online como fallback.
- Os jogos existentes deverão continuar funcionando durante toda a expansão.

## 2. Situação atual

O projeto é uma aplicação estática composta por HTML, CSS e JavaScript ES Modules, sem framework, backend, banco de dados ou dependências de build. O deploy é compatível com GitHub Pages e utiliza rotas baseadas em hash.

Os jogos atuais são:

- Quem é esse Pokémon?
- Qual é o tipo?
- Qual tipo é mais forte?
- Qual é o melhor ataque?
- Qual é o ataque?
- Qual é o tipo do ataque?
- PokeDoku.

Atualmente, o acesso à PokéAPI está concentrado em `src/shared.js`, com cache apenas em memória. O roteamento está em `src/router.js` e a montagem das telas está concentrada em `src/main.js`.

## 3. Camada de dados e sincronização

Antes da criação das novas áreas, será necessário criar uma camada única de acesso aos dados.

### Objetivos

- Centralizar chamadas à PokéAPI.
- Reduzir a quantidade de requisições.
- Permitir carregamento local e fallback online.
- Normalizar os dados para uso pelas Dexes, jogos e ferramentas.
- Facilitar futuras atualizações da base.

### Estrutura sugerida

```text
src/
  data/
    api.js
    repository.js
    cache.js
    normalize.js
  dex/
  tools/
  games/
scripts/
  sync-pokeapi.js
data/
  pokeapi/
    pokemon.json
    species.json
    moves.json
    items.json
    locations.json
    versions.json
```

### Fluxo de sincronização

1. O script consulta os endpoints oficiais da PokéAPI.
2. Os dados são normalizados e reduzidos aos campos necessários.
3. Os arquivos JSON são salvos no diretório local.
4. A sincronização registra a versão ou data dos dados.
5. O frontend lê o snapshot local.
6. A API online é usada como fallback quando necessário.

O snapshot não precisa reproduzir todos os arquivos brutos da PokéAPI. Ele deve ser um artefato gerado a partir dela, sem alterar seu conteúdo ou criar uma fonte paralela.

## 4. Infos

### 4.1 Pokédex

Rotas:

```text
#/pokedex
#/pokedex/:pokemon
```

#### Lista

- Grid de cards dos Pokémon.
- Número da Pokédex.
- Nome.
- Sprite ou arte oficial.
- Tipos.
- Indicadores de forma regional, Mega, Paradoxo, lendário e mítico.
- Busca por nome ou número.
- Filtro por geração.
- Filtro por tipo.
- Filtro por região.
- Filtro por Pokédex regional.
- Filtro por forma.
- Filtros para categorias especiais.
- Paginação ou carregamento progressivo.

#### Detalhes

- Informações básicas.
- Tipos.
- Habilidades.
- Estatísticas-base.
- Altura e peso.
- Gênero.
- Experiência e crescimento.
- Grupo de ovos.
- Habitat e cor.
- Descrições por jogo.
- Linha evolutiva.
- Condições de evolução.
- Formas alternativas.
- Lista de ataques aprendíveis.
- Método de aprendizado de cada ataque.
- Grupo de versões em que o ataque está disponível.

#### Endpoints principais

- `/pokemon`
- `/pokemon-species`
- `/pokemon-form`
- `/evolution-chain`
- `/ability`
- `/type`
- `/generation`
- `/pokedex`

### 4.2 AttackDex

Rotas:

```text
#/attackdex
#/attackdex/:move
```

#### Lista

- Nome do ataque.
- Tipo.
- Categoria: físico, especial ou status.
- Poder.
- Precisão.
- PP.
- Prioridade.
- Geração de introdução.
- Busca por nome.
- Filtro por tipo.
- Filtro por categoria.
- Filtro por geração.

#### Detalhes

- Nome localizado.
- Tipo.
- Categoria de dano.
- Poder, precisão, PP e prioridade.
- Alvo.
- Efeitos secundários.
- Descrição oficial.
- Efeito em batalha.
- Efeito em contests, quando existir.
- Pokémon que aprendem o ataque.
- Método de aprendizado.
- Jogos ou grupos de versões onde está disponível.

#### Endpoints principais

- `/move`
- `/type`
- `/move-damage-class`
- `/move-target`
- `/move-learn-method`
- `/pokemon`
- `/version-group`
- `/generation`

“Onde o ataque aparece” deverá significar em quais Pokémon ele pode ser aprendido, por qual método e em quais grupos de versões.

### 4.3 ItemDex

Rotas:

```text
#/itemdex
#/itemdex/:item
```

#### Lista

- Cards dos itens.
- Sprite.
- Nome.
- Categoria.
- Busca.
- Filtro por categoria.
- Filtro por geração.
- Filtro por versão ou grupo de versões.
- Filtro por item segurável.
- Filtro por item de batalha.

#### Detalhes

- Nome.
- Imagem.
- Categoria.
- Efeito principal.
- Descrição por jogo.
- Preço de compra e venda.
- Poder e efeito de Fling.
- Atributos.
- Pokémon que podem carregar o item.
- Raridade, quando disponível.
- Jogos ou grupos de versões associados.
- Relação com evolução, quando aplicável.
- Informações específicas de berries.

#### Endpoints principais

- `/item`
- `/item-category`
- `/item-attribute`
- `/item-fling-effect`
- `/berry`
- `/version-group`
- `/generation`
- `/pokemon`

### 4.4 EnemyDex

Rotas:

```text
#/enemydex
#/enemydex/:version
#/enemydex/:version/:location
```

#### Encontros selvagens

A PokéAPI fornece dados para:

- Jogo ou versão.
- Região.
- Local.
- Área do local.
- Pokémon encontrado.
- Nível mínimo e máximo.
- Método de encontro.
- Chance de encontro, quando disponível.
- Condições como dia, noite, pesca, surf e enxame, quando disponíveis.

#### Endpoints principais

- `/pokemon/{id}/encounters`
- `/location-area`
- `/location`
- `/version`
- `/version-group`
- `/encounter-method`
- `/encounter-condition`
- `/encounter-condition-value`

#### Limitação sobre treinadores

A PokéAPI oficial não oferece uma base completa de batalhas de treinadores com nome, classe, local, equipe, níveis, itens, movimentos e revanches.

Por isso, respeitando a regra de fonte única, a primeira versão do EnemyDex deverá ser limitada aos encontros selvagens. A seção de batalhas de treinadores só poderá ser implementada caso esses dados passem a existir na PokéAPI.

## 5. Jogos existentes

Os jogos atuais devem permanecer disponíveis e inalterados em comportamento:

- As sessões, pontuação, sequência e histórico devem continuar funcionando.
- Os filtros atuais devem continuar independentes dos filtros das Dexes.
- O PokeDoku deve continuar no fluxo próprio.
- Os jogos devem passar a utilizar a nova camada de dados sem depender diretamente de múltiplas chamadas dispersas.
- O compartilhamento de resultados deve continuar funcionando.

A navegação deverá ser reorganizada em três grupos:

```text
Jogos
  Todos os jogos atuais

Infos
  Pokédex
  AttackDex
  ItemDex
  EnemyDex

Ferramentas
  Construtor de Party
```

## 6. Ferramentas

### 6.1 Construtor de Party

Rota:

```text
#/party-builder
```

#### Montagem

- Até 6 posições.
- Busca por nome ou número.
- Seleção de Pokémon.
- Escolha de forma.
- Item segurado.
- Até 4 ataques por Pokémon.
- Remoção e substituição de membros.
- Reordenação da equipe.
- Controle de duplicatas conforme a regra escolhida.

#### Cobertura ofensiva

Para cada tipo defensivo, mostrar:

- Quais Pokémon da party causam dano super efetivo.
- Quais ataques oferecem essa cobertura.
- Cobertura duplicada ou múltipla.
- Tipos ofensivos ausentes.
- Tipos com cobertura limitada.

#### Vulnerabilidade defensiva

Para cada tipo de ataque, mostrar:

- Quantos Pokémon recebem dano super efetivo.
- Quantos recebem dano neutro.
- Quantos resistem.
- Quantos são imunes.
- Vulnerabilidades compartilhadas.

#### Resumo da equipe

- Fraquezas mais perigosas.
- Tipos sem resposta ofensiva.
- Tipos completamente cobertos.
- Resistências e imunidades.
- Distribuição dos tipos.
- Ataques repetidos.
- Tipos repetidos na composição.

#### Dados utilizados

- Tipos dos Pokémon em `/pokemon`.
- Relações de dano em `/type`.
- Tipos dos ataques em `/move`.
- Compatibilidade dos ataques nos dados de aprendizado do Pokémon.
- Itens em `/item`.

#### Escopo inicial do cálculo

A primeira versão deverá calcular relações de tipos, cobertura ofensiva e vulnerabilidades defensivas.

Não deverá simular dano real inicialmente, pois isso exigiria regras adicionais envolvendo estatísticas, habilidades, naturezas, EVs, IVs, STAB, clima, itens, campo e geração.

#### Persistência

Como o projeto não possui backend, as parties deverão ser salvas usando:

- `localStorage`.
- Exportação para JSON ou URL.
- Importação por JSON ou URL.
- Lista de parties salvas.
- Renomeação.
- Exclusão.

## 7. Arquitetura sugerida

```text
src/
  app/
    router.js
    navigation.js
  data/
    api.js
    repository.js
    cache.js
    local-data.js
  components/
    search.js
    pagination.js
    pokemon-card.js
    type-badge.js
    empty-state.js
  games/
  dex/
    pokedex.js
    attackdex.js
    itemdex.js
    enemydex.js
  tools/
    party-builder.js
    type-analysis.js
  storage/
    parties.js
```

### Requisitos da camada de dados

- Cache em memória durante a sessão.
- Snapshot local versionado.
- Fallback para a API online.
- Paginação.
- Carregamento sob demanda dos detalhes.
- Estados de carregamento, erro e ausência de dados.
- Não disparar centenas de requisições simultâneas sem necessidade.
- Preservar a origem e a data dos dados usados.

## 8. Componentes reutilizáveis

Criar componentes visuais para:

- Card de Pokémon.
- Card de ataque.
- Card de item.
- Badge de tipo.
- Campo de busca.
- Filtros.
- Paginação.
- Modal de seleção.
- Tabela responsiva.
- Painel de detalhes.
- Estado vazio.
- Estado de erro.
- Indicador de atualização dos dados.

As novas telas devem respeitar o tema atual e funcionar em desktop e mobile.

## 9. Ordem de implementação

### Fase 1: Fundação

- Criar o repositório de dados.
- Criar o snapshot local derivado da PokéAPI.
- Criar o script de sincronização.
- Evoluir o cache atual.
- Adaptar o roteador.
- Separar navegação entre Jogos, Infos e Ferramentas.
- Garantir que os jogos atuais continuem funcionando.

### Fase 2: Pokédex

- Lista paginada.
- Busca e filtros.
- Cards.
- Página de detalhes.
- Evoluções.
- Ataques aprendíveis.

### Fase 3: AttackDex

- Lista de ataques.
- Filtros.
- Página de detalhes.
- Pokémon que aprendem cada ataque.
- Métodos e versões.

### Fase 4: ItemDex

- Lista de itens.
- Categorias e filtros.
- Página de detalhes.
- Disponibilidade por versão.
- Pokémon que seguram cada item.

### Fase 5: EnemyDex

- Encontros selvagens.
- Filtro por versão, local e método.
- Níveis e condições.
- Documentação da limitação sobre batalhas de treinadores.

### Fase 6: Party Builder

- Montagem dos seis Pokémon.
- Itens e ataques.
- Salvamento local.
- Exportação e importação.
- Análise de cobertura.
- Análise de vulnerabilidades.

### Fase 7: Qualidade

- Testes das relações de tipos.
- Testes dos filtros.
- Testes do roteador.
- Testes do parser dos dados locais.
- Testes de persistência da party.
- Validação em desktop e mobile.
- Teste com a API indisponível.
- Atualização do README e da data do snapshot.

## 10. Pontos de atenção

- Os dados da PokéAPI são frequentemente nomeados em inglês; campos localizados devem ser usados quando disponíveis.
- Nem todo recurso possui tradução para português.
- O snapshot local deverá ser atualizado por processo reproduzível.
- O cache atual em `Map` não sobrevive ao recarregamento e deverá ser complementado.
- As novas telas não devem concentrar toda a lógica novamente em `src/main.js`.
- Dados externos inseridos na interface devem ser tratados com segurança.
- O CSS atual foi criado para quizzes e precisará receber grids, tabelas e painéis de detalhes.
- Deve existir uma indicação clara de quando os dados foram sincronizados.

## 11. Critério de conclusão

A expansão estará concluída quando:

- As quatro áreas de informação estiverem acessíveis por rotas próprias.
- A Pokédex, AttackDex e ItemDex exibirem dados completos disponíveis na PokéAPI.
- O EnemyDex exibir os encontros selvagens por versão e local.
- O Party Builder permitir seis Pokémon, itens, ataques e análises de cobertura.
- As parties puderem ser salvas e exportadas localmente.
- Os jogos atuais continuarem funcionando.
- O sistema puder operar com o snapshot local sem depender de chamadas para cada item exibido.
- O processo de atualização dos dados estiver documentado e reproduzível.
- A limitação sobre batalhas de treinadores estiver explicitamente apresentada ao usuário.
