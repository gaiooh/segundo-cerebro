# Segundo Cérebro

Um aplicativo para **guardar pensamentos no momento em que eles aparecem** — falando ou digitando —
e deixá-los organizados e conectados, como uma extensão da sua memória.

Feito para **Android e iOS** (com React Native e Expo). Também roda no navegador, o que é útil
para desenvolver e testar.

> **Status:** em desenvolvimento. A base, as telas e o sistema de notas já funcionam;
> gravação de voz, transcrição e inteligência artificial ainda são simuladas.
> Veja [O que já funciona](#o-que-já-funciona).

---

## A ideia, em poucas palavras

Ideias boas chegam em momentos ruins: andando, no banho, no meio de uma conversa.
Se registrar dá trabalho — abrir um app, escolher uma pasta, dar um título —, a ideia se perde.

O Segundo Cérebro parte de três princípios:

1. **Capturar não pode ter atrito.** Abriu o app, já pode falar ou escrever. Nada de decidir
   onde guardar antes de guardar.
2. **Organizar é trabalho do sistema, não seu.** O pensamento entra cru; depois ele ganha título,
   categoria e uma versão mais clara — sem perder o original.
3. **Ideias valem mais conectadas.** Notas se ligam umas às outras, e você pode *ver* essas
   ligações como uma rede, descobrindo relações que não tinha percebido.

A inspiração é o método do "segundo cérebro" (um lugar confiável fora da cabeça para guardar o
que você pensa) e ferramentas como o Obsidian — mas com foco em **voz, simplicidade e celular**.

---

## Como funciona (a jornada de um pensamento)

```
  1. Captura            2. Organização           3. Conexão              4. Conversa
 ┌───────────┐        ┌───────────────┐        ┌───────────────┐       ┌──────────────┐
 │ Você fala │  ───▶  │ Vira uma nota │  ───▶  │ Liga-se a     │ ───▶  │ Você pergunta│
 │ ou digita │        │ com título e  │        │ outras ideias │       │ ao assistente│
 │           │        │ categoria     │        │ (rede 3D)     │       │ sobre tudo   │
 └───────────┘        └───────────────┘        └───────────────┘       └──────────────┘
```

1. **Captura** — na tela *Falar*, você grava um áudio ou digita. É o centro do app.
2. **Organização** — o texto vira uma **nota**. O pensamento **original fica guardado para
   sempre, intacto**; ao lado dele existe uma versão organizada, que pode ser editada.
   A nota pode ir para uma **categoria** (e subcategorias), como pastas.
3. **Conexão** — escrevendo `[[Nome de outra nota]]` dentro de uma nota, você cria uma
   **ligação**. A aba *Ligações* mostra todas as notas e ligações como uma **rede em 3D** que
   você gira, aproxima e explora.
4. **Conversa** — o *Assistente* (no futuro, com IA) responde perguntas sobre as suas próprias
   notas: "quais ideias minhas estão relacionadas?", "como meus pensamentos sobre carreira
   mudaram?".

---

## As cinco áreas do app

| Aba | Para que serve |
| --- | --- |
| **Falar** (botão central) | Registrar um pensamento por voz ou texto. Mostra os registros recentes. |
| **Categorias** | Pastas e subpastas, em **lista** ou **grade**; ordenação por nome, data ou manual; busca. |
| **Ligações** | A rede 3D de notas, pastas e ligações. Toque numa ideia para ver suas conexões; filtre por categoria. |
| **Assistente** | Conversa com o seu segundo cérebro, com sugestões de perguntas e histórico. |
| **Ajustes** | Tema claro/escuro/automático, cor de destaque, preferências de organização, privacidade. |

---

## O que já funciona

| Funcionalidade | Situação |
| --- | --- |
| Navegação, telas e design (claro e escuro) | ✅ Pronto |
| Notas por **texto** (criar, editar, mover, excluir, buscar) | ✅ Pronto — salvas no aparelho |
| Original preservado + versão organizada | ✅ Pronto |
| Categorias e subcategorias | ✅ Pronto |
| Ligações entre notas com `[[...]]` | ✅ Pronto |
| Rede 3D da aba Ligações | ✅ Pronto — usa as suas notas reais |
| Exportação em Markdown (compatível com Obsidian) | ✅ Pronto |
| Gravação de **voz** | 🟡 Simulada (só a interface) |
| Transcrição de áudio em texto | ⚪ Planejado |
| Organização automática por IA (título, categoria, resumo) | ⚪ Planejado |
| Assistente com IA de verdade | 🟡 Interface pronta; respostas são de demonstração |

> Enquanto você ainda não tem notas, a aba Ligações mostra uma **rede de exemplo fictícia**
> (identificada na tela), só para demonstrar a experiência.

---

## Seus dados

- **Tudo fica no seu aparelho**, num banco de dados local (SQLite). Nesta versão, nada é
  enviado para servidores.
- O **pensamento original nunca é alterado** — nem por você, nem pelo app. Edições vão para a
  versão organizada.
- Você pode **exportar tudo em Markdown**, numa estrutura de pastas pronta para abrir no
  Obsidian ou em qualquer editor de texto. Seus dados não ficam presos ao app.

---

## Tecnologias (explicadas de forma simples)

| Tecnologia | O que faz aqui |
| --- | --- |
| [React Native](https://reactnative.dev) | Permite escrever **um único código** para Android e iOS. |
| [Expo](https://expo.dev) (SDK 58) | Ferramentas que facilitam rodar, testar e publicar o app. |
| [TypeScript](https://www.typescriptlang.org) | JavaScript com "tipos": o editor avisa sobre erros antes de o app rodar. |
| [Expo Router](https://docs.expo.dev/router/introduction/) | Navegação entre telas baseada em arquivos (cada arquivo em `src/app` é uma tela). |
| [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) | Banco de dados local onde ficam as notas e categorias. |
| [Three.js](https://threejs.org) + [expo-gl](https://docs.expo.dev/versions/latest/sdk/gl-view/) | Desenham a rede de ideias em 3D. |
| react-native-svg | Ícones e gráficos vetoriais do app. |

---

## Como rodar o projeto

**Você precisa de:** [Node.js](https://nodejs.org) instalado e, para testar no celular, o app
**Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) /
[iOS](https://apps.apple.com/app/expo-go/id982107779)).

```bash
# 1. Baixar o código
git clone https://github.com/gaiooh/segundo-cerebro.git
cd segundo-cerebro

# 2. Instalar as dependências
npm install

# 3. Iniciar
npm start
```

Depois do `npm start`:

- **No celular:** abra o Expo Go e leia o QR code que aparece no terminal
  (celular e computador na mesma rede Wi-Fi).
- **No navegador:** aperte `w` no terminal, ou rode `npm run web`.

### Comandos úteis

| Comando | O que faz |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento. |
| `npm run web` | Abre o app no navegador. |
| `npm test` | Roda os testes do sistema de notas (no Node). |
| `npm run lint` | Procura problemas de estilo e erros comuns no código. |
| `npm run typecheck` | Verifica os tipos do TypeScript. |
| `npm run doctor` | Diagnostica a configuração do Expo e as versões das dependências. |

---

## Como o código está organizado

```
src/
  app/            As telas (cada arquivo é uma rota de navegação)
  features/       Cada funcionalidade em sua própria pasta:
    voice-capture/    captura por voz e texto (tela Falar)
    notes/            notas, Markdown e exportação
    categories/       categorias e subcategorias
    semantic-links/   rede de ligações em 3D
    assistant/        assistente
    settings/         preferências do usuário
    transcription/    (futuro) áudio → texto
    ai-processing/    (futuro) organização por IA
  components/     Peças visuais reutilizáveis (botões, textos, folhas, barra de abas...)
  theme/          Design system: cores, fontes, espaçamentos, tema claro/escuro
  lib/            Infraestrutura compartilhada (banco de dados, formatação)
  hooks/          Hooks React genéricos
tests/            Testes do sistema de notas
docs/             Documentação técnica
```

Regras principais: as telas em `src/app` só montam a interface — a lógica fica em
`src/features`; cada funcionalidade expõe o que outras podem usar pelo seu `index.ts`;
cores e fontes vêm sempre do tema, nunca escritas direto nos componentes.

Os detalhes técnicos (camadas, modelo do banco, formato da exportação, rede 3D) estão em
[**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md).

---

## Próximos passos

- Gravação de voz real e **transcrição** do áudio em texto.
- **IA nos bastidores:** sugerir título, categoria e uma versão organizada de cada pensamento.
- **Ligações semânticas automáticas:** encontrar ideias relacionadas mesmo sem `[[links]]`.
- **Assistente com IA** que responde a partir das suas notas.
- Testes e ajustes em aparelhos Android e iOS reais.
