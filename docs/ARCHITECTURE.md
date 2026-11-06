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

## Dependências nativas

O Expo Go só inclui os módulos nativos do SDK. Ao adicionar uma biblioteca nativa fora dele
(provável para transcrição local, por exemplo), será necessário um **development build**
(`npx expo run:android` / `eas build --profile development`).
Sempre instale pacotes com `npx expo install <pacote>` para obter versões compatíveis com o SDK.
