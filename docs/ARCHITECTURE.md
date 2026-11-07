# Arquitetura — Segundo Cérebro

## Stack

- **Expo SDK 58** (React Native 0.88, React 19.3) — build e runtime para Android e iOS.
- **TypeScript** em modo `strict`.
- **Expo Router** — navegação baseada em arquivos, com rotas tipadas (`experiments.typedRoutes`).
- Pastas `ios/` e `android/` **não** são versionadas: são geradas pelo Expo (Continuous Native Generation). Configurações nativas ficam em `app.json` e config plugins.

## Estrutura

```
src/
  app/              Somente rotas (cada arquivo = tela; _layout.tsx = navegador)
  features/         Código de domínio, organizado por funcionalidade
    voice-capture/    Gravação de áudio
    transcription/    Áudio → texto
    ai-processing/    Processamento das notas por IA (resumo, classificação, extração)
    notes/            Notas em Markdown (modelo, persistência, renderização)
    categories/       Categorias e subcategorias (hierarquia)
    semantic-links/   Ligações semânticas entre ideias (embeddings, relações)
    assistant/        Assistente de IA conversacional sobre as notas
    settings/         Preferências do usuário (tema, destaque, organização), persistidas
  theme/            Design system: tokens, paletas, ThemeProvider e useTheme
  components/       Componentes de UI reutilizáveis entre features
  hooks/            Hooks genéricos (não pertencentes a uma feature)
  lib/              Infraestrutura compartilhada (clientes HTTP/IA, storage, utilitários)
  constants/        Constantes globais (tema, configurações)
  types/            Tipos globais compartilhados
docs/               Documentação do projeto
assets/             Ícones, splash e imagens
```

## Convenções

- **`src/app/` só contém rotas.** Telas importam a lógica de `src/features/*`; nada de regra de negócio dentro das rotas.
- **Cada feature é autocontida** e pode ter, conforme a necessidade:
  `components/`, `hooks/`, `services/`, `types.ts` e um `index.ts` que define a API pública da feature.
  Crie as subpastas apenas quando houver código real para elas.
- **Dependência entre features** passa pelo `index.ts` da outra feature, nunca por caminhos internos.
- Algo usado por duas ou mais features sobe para `components/`, `hooks/` ou `lib/`.
- Imports usam o alias `@/` (ex.: `import { x } from '@/features/notes'`).
- Arquivos `.gitkeep` existem só para versionar pastas vazias; remova-os quando a pasta receber código.

## Navegação

```
src/app/
  _layout.tsx            Fontes + provedores (Preferences → Theme → Categories) + Stack raiz
  (tabs)/_layout.tsx     Abas com barra inferior própria (components/TabBar.tsx)
    categories.tsx       Categorias (lista/grade, ordenação, criação)
    links.tsx            Ligações (rede 3D das notas, pastas e [[ligações]])
    index.tsx            Falar — rota inicial "/" e ação central
    assistant.tsx        Assistente
    settings.tsx         Configurações
  folder/[id].tsx        Conteúdo de uma categoria (subpastas + notas); "sem-categoria" = notas não arquivadas
  note/[id].tsx          Nota: título e versão organizada (autosave), original somente leitura,
                         mover, exportar, excluir, ligações e menções
  note/new.tsx           Nova nota (o texto digitado vira o original)
  search.tsx             Busca em todas as notas
```

## Notas e armazenamento

**Fonte única da verdade: SQLite local** (`expo-sqlite`, arquivo `segundo-cerebro.db`).
Markdown é o **formato de exportação**, gerado sob demanda — não há uma segunda cópia
dos dados para sincronizar.

Por que SQLite e não arquivos `.md` como armazenamento principal:
- Escritas atômicas (transações): mover, excluir categoria ou salvar ligações nunca
  deixam o estado pela metade, mesmo se o app fechar no meio.
- Busca, contagens e ligações (backlinks) são consultas, não varreduras de arquivos.
- Funciona igual em Android, iOS e web; arquivos no iOS/Android ficam presos ao sandbox
  do app e exigiriam um índice de qualquer forma (duplicação).
- A compatibilidade com o Obsidian vem do exportador, que gera um cofre completo.

Camadas (cada uma só conhece a de baixo):

```
UI (src/app, components)        telas e componentes
  ↓
Providers (NotesProvider,       estado React; relê o banco após cada escrita
 CategoriesProvider)
  ↓
Serviços (notes-service,        regras de negócio: original imutável, títulos, ligações,
 folders-service, markdown.ts)  exclusão segura de categorias, formato Markdown
  ↓
Repositórios / SQL              notes-repository.ts, SQL do folders-service
  ↓
src/lib/database                contrato SqlDatabase, migrações, adaptador expo-sqlite
```

Serviços, repositórios, migrações e `markdown.ts` são TypeScript puro (sem React Native)
e usam imports relativos com extensão `.ts`, para rodarem também nos testes em Node
(`npm test`, com `node:sqlite` implementando o mesmo contrato `SqlDatabase`).

### Modelo

- `notes`: `id` (UUID v4), `folder_id` (null = sem categoria), `title`, `original`,
  `organized` (null = ainda não escrita), `source` (`voice`/`text`), `created_at`, `updated_at`,
  `search_text` (índice derivado: minúsculas, sem acentos).
- **Original preservado**: gravado uma vez, nunca atualizado — garantido também por um
  trigger no banco. Edições vão para `organized`. Uma versão organizada idêntica ao original
  não é gravada (evita duplicação).
- `folders`: categorias e subcategorias (`parent_id`), cor e ordem manual. Excluir uma
  categoria **não apaga notas**: notas e subpastas sobem para a categoria mãe.
- `note_links`: ligações por **id** (`source_id → target_id`). São extraídas de
  `[[Título]]` ou `[[id]]` na versão organizada (ou no original, se não houver organizada);
  links pendentes se completam quando a nota citada é criada.
- Migrações versionadas por `PRAGMA user_version` (`src/lib/database/migrations.ts`).
  Nunca altere uma migração publicada; acrescente outra.

### Exportação Markdown (Obsidian)

- Estrutura: `<Categoria>/<Subcategoria>/<Título>.md`; notas sem categoria em `Sem categoria/`.
- Front matter YAML com `id`, `title`, `created`, `updated`, `source`, `category` e `links`.
- Corpo: a versão organizada (com `[[links]]` reescritos para o nome real do arquivo) e,
  em seguida, `## Pensamento original` com o texto original intacto. Sem versão organizada,
  o corpo é o original.
- Nota única: menu de compartilhamento do sistema (web: download). Tudo: o usuário escolhe
  uma pasta (ex.: o cofre do Obsidian) via `Directory.pickDirectoryAsync` (Android/iOS).

### Rede 3D (aba Ligações)

- Renderizada com `expo-gl` + `three` (`semantic-links/scene/NetworkScene.ts`).
- `buildNoteNetwork` (TypeScript puro, testado em Node) monta a rede a partir do banco:
  - nós: cada nota e cada pasta que contém notas;
  - arestas `link`: as ligações `[[...]]` entre notas (`note_links`);
  - arestas `structure`: nota → pasta e subpasta → pasta mãe;
  - grupos (cores e filtros): a categoria raiz de cada nó; notas sem categoria formam o grupo
    "Sem categoria".
- `useNoteNetwork` só reconstrói a rede com a aba em foco, para não recalcular o layout 3D a
  cada autosave. O layout é determinístico: os mesmos dados geram a mesma rede.
- O layout de forças é O(n²) por iteração; para milhares de notas será preciso otimizá-lo
  (ex.: grade espacial) ou movê-lo para fora da thread de UI.

### Web

`metro.config.js` serve arquivos `.wasm` e envia os cabeçalhos COOP/COEP exigidos pelo
`expo-sqlite` na web. O SQLite da web não tem FTS, por isso a busca usa `LIKE` sobre
`search_text`; quando o volume exigir, dá para migrar para FTS5 nas plataformas nativas.

## Design system (`src/theme`)

- **Nada de cor, fonte ou espaçamento fixo nos componentes**: tudo vem de `useTheme()`.
- `tokens.ts`: espaçamento, raios, tipografia (por *papel*, ex. `display`, `body`), movimento.
- `palettes.ts`: base neutra por esquema (branco no claro, preto no escuro), cores de destaque
  intercambiáveis (padrão: rosa) e tons discretos para pastas.
- Personalização futura: novas cores de destaque entram em `accentPalettes`; trocar a fonte é
  trocar `fontFamilies` (e carregá-la em `app/_layout.tsx`).
- Use sempre `Text`, `Screen`, `PressableScale` etc. de `@/components` em vez dos primitivos do React Native.

## Dados de demonstração

Notas e categorias são **reais** (SQLite). A aba Ligações mostra a rede real
(`semantic-links/note-network.ts`); só enquanto não existe nenhuma nota ela exibe uma rede
fictícia (`mock-network.ts`, que usa `mock-notes.ts` e `mock-folders.ts`), identificada na tela
como "Exemplo fictício". Gravação de voz, transcrição e
respostas do assistente ainda são **simulações visuais** (`useCaptureSimulation`,
`useAssistantChat`); capturas por texto na tela Falar já viram notas reais. Ao implementar cada funcionalidade, substitua o
mock pela fonte real mantendo a mesma API exportada pelo `index.ts` da feature.

## Dependências nativas

O Expo Go só inclui os módulos nativos do SDK. Ao adicionar uma biblioteca nativa fora dele
(provável para transcrição local, por exemplo), será necessário um **development build**
(`npx expo run:android` / `eas build --profile development`).
Sempre instale pacotes com `npx expo install <pacote>` para obter versões compatíveis com o SDK.
