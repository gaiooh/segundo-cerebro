import type { Note } from './types';

/**
 * DEMO DATA — fictional notes used only to showcase the interface.
 * Dates are generated relative to "now" so the UI always looks current.
 */
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

type Seed = [id: string, folderId: string, title: string, body: string, source: Note['source'], ageMs: number];

const seeds: Seed[] = [
  ['n1', 'career-leadership', 'Feedback é presente, não sentença', 'Dar feedback cedo e com contexto. Separar o comportamento da pessoa.', 'voice', 2 * HOUR],
  ['n2', 'career', 'Onde quero estar em cinco anos', 'Menos gestão de tarefas, mais direção de produto. Ensinar mais.', 'voice', 1 * DAY],
  ['n3', 'career-side', 'App de receitas por voz', 'Ditar receitas enquanto cozinha. Talvez seja um nicho interessante.', 'text', 3 * DAY],
  ['n4', 'career-leadership', 'Reuniões 1:1 mais curtas', 'Testar 20 minutos semanais em vez de 45 quinzenais.', 'text', 6 * DAY],
  ['n5', 'career', 'Conversa com a mentora', 'Ela sugeriu escrever sobre o que aprendo no trabalho.', 'voice', 9 * DAY],
  ['n6', 'ideas-product', 'Captura sem atrito', 'O melhor sistema de notas é aquele que não exige decidir onde guardar.', 'voice', 5 * HOUR],
  ['n7', 'ideas-product', 'Ligações automáticas entre ideias', 'Se duas notas falam do mesmo assunto, o sistema deveria aproximá-las.', 'text', 2 * DAY],
  ['n8', 'ideas-writing', 'Ensaio: a memória como jardim', 'Ideias precisam ser revisitadas para crescer. Podar também é cuidar.', 'voice', 4 * DAY],
  ['n9', 'ideas', 'Caderno de perguntas', 'Guardar perguntas, não só respostas. Perguntas envelhecem melhor.', 'text', 12 * DAY],
  ['n10', 'ideas-writing', 'Título para newsletter', '“Notas de margem” — curto, honesto, fácil de lembrar.', 'text', 15 * DAY],
  ['n11', 'learning-books', 'Pensar rápido, pensar devagar', 'Sistema 1 e Sistema 2. Decisões importantes merecem atrito.', 'voice', 1 * DAY + 3 * HOUR],
  ['n12', 'learning-books', 'Hábitos atômicos — resumo', 'Pequenas melhorias compostas. Ambiente vence a força de vontade.', 'text', 8 * DAY],
  ['n13', 'learning-courses', 'Curso de design de interação', 'Módulo 3: hierarquia visual e ritmo. Rever exercícios.', 'text', 10 * DAY],
  ['n14', 'learning', 'Aprender em público', 'Compartilhar o processo atrai pessoas com as mesmas dúvidas.', 'voice', 20 * DAY],
  ['n15', 'health', 'Sono e foco', 'Nos dias em que durmo antes das 23h, as manhãs rendem o dobro.', 'voice', 7 * HOUR],
  ['n16', 'health', 'Caminhar depois do almoço', 'Quinze minutos bastam para clarear a cabeça.', 'voice', 5 * DAY],
  ['n17', 'personal', 'Ligar para a avó no domingo', 'Perguntar sobre as histórias da fazenda.', 'voice', 2 * DAY + 5 * HOUR],
  ['n18', 'personal-travel', 'Lisboa em março', 'Bairro Alto, Alfama, um dia em Sintra.', 'text', 18 * DAY],
  ['n19', 'reflections', 'Pressa não é prioridade', 'Quase tudo que parece urgente pode esperar uma noite de sono.', 'voice', 3 * HOUR],
  ['n20', 'reflections', 'O que me dá energia', 'Conversas longas, construir coisas, manhãs silenciosas.', 'voice', 11 * DAY],
  ['n21', 'career-side', 'Ferramenta para freelancers', 'Propostas e contratos a partir de uma conversa.', 'text', 25 * DAY],
  ['n22', 'ideas-product', 'Modo foco para leitura', 'Esconder tudo que não é o texto. Tipografia generosa.', 'text', 30 * DAY],
];

export const mockNotes: Note[] = seeds.map(([id, folderId, title, body, source, age]) => ({
  id,
  folderId,
  title,
  body,
  source,
  createdAt: ago(age + 2 * DAY),
  updatedAt: ago(age),
}));
