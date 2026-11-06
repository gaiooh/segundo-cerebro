import type { Conversation } from './types';

/** DEMO DATA — fictional past conversations to showcase the history UI. */
const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

export const suggestedQuestions = [
  'Quais ideias minhas estão relacionadas?',
  'Como meus pensamentos sobre carreira mudaram?',
  'Quais assuntos mais aparecem nas minhas anotações?',
];

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    title: 'Temas recorrentes do mês',
    updatedAt: ago(1),
    messages: [
      { id: 'c1m1', role: 'user', text: 'Quais assuntos mais aparecem nas minhas anotações?' },
      {
        id: 'c1m2',
        role: 'assistant',
        text: 'Três temas se repetem: captura de ideias sem atrito, ritmo de trabalho (sono, foco, pressa) e escrita como forma de aprender. Eles aparecem em categorias diferentes, mas costumam surgir juntos.',
      },
    ],
  },
  {
    id: 'c2',
    title: 'Carreira nos últimos meses',
    updatedAt: ago(4),
    messages: [
      { id: 'c2m1', role: 'user', text: 'Como meus pensamentos sobre carreira mudaram?' },
      {
        id: 'c2m2',
        role: 'assistant',
        text: 'No início, suas notas falavam mais de produtividade e gestão de tarefas. Mais recentemente, aparecem direção de produto, ensino e escrita — um movimento de execução para orientação.',
      },
    ],
  },
  {
    id: 'c3',
    title: 'Ideias para projeto paralelo',
    updatedAt: ago(12),
    messages: [
      { id: 'c3m1', role: 'user', text: 'Quais ideias minhas estão relacionadas a projetos paralelos?' },
      {
        id: 'c3m2',
        role: 'assistant',
        text: 'O app de receitas por voz se conecta com sua nota sobre captura sem atrito. Ambos partem da mesma intuição: registrar deve ser tão fácil quanto falar.',
      },
    ],
  },
];

/** Shown for new questions while the assistant is not connected. */
export const DEMO_REPLY =
  'Esta é uma prévia da interface. O assistente ainda não está conectado às suas notas — quando estiver, as respostas virão do que você registrou.';
