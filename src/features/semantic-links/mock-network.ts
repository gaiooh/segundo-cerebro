import { mockFolders } from '@/features/categories';
import { mockNotes } from '@/features/notes';

import { layout3d } from './layout3d';
import { createRandom } from './random';
import type { KnowledgeNetwork, NetworkEdge, NetworkNode } from './types';

/**
 * DEMO DATA — a fictional knowledge network (~190 ideas, ~450 links) used only
 * to showcase the 3D experience. In the future the network will come from the
 * user's notes and AI-computed semantic relations.
 */
const concepts: Record<string, string[]> = {
  career: [
    'Liderança', 'Feedback', 'Mentoria', 'Delegação', 'Reuniões 1:1', 'Promoção', 'Negociação', 'Propósito',
    'Gestão de tempo', 'Prioridades', 'Comunicação', 'Apresentações', 'Networking', 'Portfólio', 'Entrevistas',
    'Cultura de time', 'Confiança', 'Autonomia', 'Metas trimestrais', 'Decisões difíceis', 'Contratação',
    'Onboarding', 'Visão de produto', 'Estratégia', 'Influência', 'Escrita no trabalho', 'Trabalho remoto',
    'Transição de carreira', 'Equilíbrio', 'Ensinar', 'Direção de produto', 'Execução',
  ],
  ideas: [
    'Captura sem atrito', 'Receitas por voz', 'Ligações automáticas', 'Modo foco', 'Newsletter', 'Perguntas abertas',
    'Memória como jardim', 'Assinatura', 'Comunidade', 'Ferramenta para freelancers', 'Mercado local', 'Podcast',
    'Livro de bolso', 'Oficina de escrita', 'Design minimalista', 'Busca semântica', 'Resumo diário',
    'Diário por voz', 'Mapa de ideias', 'Protótipo rápido', 'Nome de marca', 'Primeiros usuários',
    'Feedback de clientes', 'Roteiro', 'Lançamento', 'Parcerias', 'Conteúdo curto', 'Curadoria', 'Colaboração',
    'Preço justo', 'Notas de margem', 'Ferramentas calmas',
  ],
  learning: [
    'Sistema 1 e 2', 'Hábitos', 'Design de interação', 'Aprender em público', 'Repetição espaçada', 'Leitura ativa',
    'Zettelkasten', 'Estatística', 'Estoicismo', 'História da ciência', 'Psicologia cognitiva', 'Inglês',
    'Programação', 'Desenho', 'Música', 'Economia comportamental', 'Retórica', 'Escrita clara', 'Modelos mentais',
    'Pensamento sistêmico', 'Primeiros princípios', 'Curiosidade', 'Método socrático', 'Clube do livro',
    'Biografias', 'Ensaios', 'Ciência de dados', 'Neurociência', 'Memória', 'Atenção', 'Criatividade', 'Hierarquia visual',
  ],
  health: [
    'Sono', 'Caminhada', 'Corrida', 'Meditação', 'Respiração', 'Alimentação', 'Hidratação', 'Postura', 'Força',
    'Alongamento', 'Energia', 'Estresse', 'Rotina matinal', 'Luz solar', 'Cafeína', 'Descanso', 'Ansiedade',
    'Terapia', 'Natação', 'Ritmo circadiano', 'Foco', 'Recuperação', 'Telas à noite', 'Pausas',
  ],
  personal: [
    'Família', 'Avó', 'Amizades', 'Viagens', 'Lisboa', 'Sintra', 'Casa', 'Finanças pessoais', 'Presentes',
    'Fotografia', 'Cozinha', 'Jardinagem', 'Música ao vivo', 'Cinema', 'Fim de semana', 'Voluntariado',
    'Infância', 'Tradições', 'Histórias da fazenda', 'Domingo', 'Cartas', 'Mudança',
  ],
  reflections: [
    'Pressa', 'O que me dá energia', 'Gratidão', 'Medo de errar', 'Paciência', 'Simplicidade', 'Silêncio',
    'Coragem', 'Disciplina', 'Sentido', 'Tempo', 'Valores', 'Expectativas', 'Comparação', 'Presença', 'Ego',
    'Limites', 'Alegria', 'Escolhas', 'Vulnerabilidade', 'Urgência', 'Manhãs silenciosas', 'Conversas longas', 'Construir',
  ],
};

/** Hand-picked links that cross categories, so the network reads as one mind. */
const bridges: [string, string][] = [
  ['Sono', 'Foco'], ['Sono', 'Gestão de tempo'], ['Foco', 'Modo foco'], ['Atenção', 'Foco'],
  ['Hábitos', 'Rotina matinal'], ['Hábitos', 'Disciplina'], ['Sistema 1 e 2', 'Pressa'], ['Sistema 1 e 2', 'Decisões difíceis'],
  ['Escrita clara', 'Escrita no trabalho'], ['Escrita clara', 'Newsletter'], ['Aprender em público', 'Newsletter'],
  ['Aprender em público', 'Mentoria'], ['Ensinar', 'Aprender em público'], ['Memória', 'Memória como jardim'],
  ['Zettelkasten', 'Ligações automáticas'], ['Zettelkasten', 'Mapa de ideias'], ['Busca semântica', 'Ligações automáticas'],
  ['Design de interação', 'Design minimalista'], ['Hierarquia visual', 'Design minimalista'], ['Estresse', 'Urgência'],
  ['Meditação', 'Silêncio'], ['Meditação', 'Presença'], ['Caminhada', 'Manhãs silenciosas'], ['Conversas longas', 'Amizades'],
  ['Conversas longas', 'Mentoria'], ['Construir', 'Protótipo rápido'], ['Construir', 'Execução'], ['Avó', 'Histórias da fazenda'],
  ['Viagens', 'Fotografia'], ['Cozinha', 'Receitas por voz'], ['Finanças pessoais', 'Preço justo'], ['Valores', 'Propósito'],
  ['Medo de errar', 'Feedback'], ['Comparação', 'Promoção'], ['Limites', 'Equilíbrio'], ['Trabalho remoto', 'Pausas'],
  ['Curiosidade', 'Perguntas abertas'], ['Método socrático', 'Perguntas abertas'], ['Criatividade', 'Oficina de escrita'],
  ['Estoicismo', 'Paciência'], ['Diário por voz', 'Captura sem atrito'], ['Gratidão', 'Família'], ['Energia', 'O que me dá energia'],
];

let cached: KnowledgeNetwork | null = null;

export function getDemoNetwork(): KnowledgeNetwork {
  if (cached) return cached;
  const random = createRandom(20261105);

  const categories = mockFolders
    .filter((f) => f.parentId === null)
    .map((f) => ({ id: f.id, name: f.name, tint: f.tint }));
  const groupIndex = new Map(categories.map((c, i) => [c.id, i]));
  const rootOf = (folderId: string) => {
    let folder = mockFolders.find((f) => f.id === folderId);
    while (folder?.parentId) {
      const parentId: string = folder.parentId;
      folder = mockFolders.find((f) => f.id === parentId);
    }
    return folder?.id ?? folderId;
  };

  const nodes: NetworkNode[] = [];
  const byLabel = new Map<string, number>();
  for (const category of categories) {
    for (const label of concepts[category.id] ?? []) {
      byLabel.set(label, nodes.length);
      nodes.push({ id: `concept-${nodes.length}`, label, categoryId: category.id, kind: 'concept' });
    }
  }
  const firstNote = nodes.length;
  for (const note of mockNotes) {
    nodes.push({ id: note.id, label: note.title, categoryId: rootOf(note.folderId), kind: 'note' });
  }

  const edges: NetworkEdge[] = [];
  const seen = new Set<string>();
  const link = (a: number, b: number, strength: number) => {
    if (a === b) return;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source: a, target: b, strength });
  };

  const membersOf = categories.map((c) => nodes.flatMap((n, i) => (n.categoryId === c.id && n.kind === 'concept' ? [i] : [])));
  // Within each category: a chain plus a few random links, so every group is connected but organic.
  membersOf.forEach((members) => {
    members.forEach((node, i) => {
      if (i > 0) link(node, members[random.int(i)], 0.6 + random.next() * 0.4);
      link(node, members[random.int(members.length)], 0.4 + random.next() * 0.4);
    });
  });
  // Each note relates to a few concepts of its category.
  for (let i = firstNote; i < nodes.length; i++) {
    const members = membersOf[groupIndex.get(nodes[i].categoryId) ?? 0];
    for (let k = 0; k < 3; k++) link(i, members[random.int(members.length)], 0.7);
  }
  for (const [a, b] of bridges) {
    const ia = byLabel.get(a);
    const ib = byLabel.get(b);
    if (ia !== undefined && ib !== undefined) link(ia, ib, 0.5);
  }
  // A light sprinkle of random cross-category links.
  for (let k = 0; k < 24; k++) link(random.int(firstNote), random.int(firstNote), 0.25);

  const groups = nodes.map((n) => groupIndex.get(n.categoryId) ?? 0);
  const { positions, radius } = layout3d({
    nodeCount: nodes.length,
    edges,
    groups,
    groupCount: categories.length,
    random,
  });

  const degree = new Uint16Array(nodes.length);
  const neighbors: number[][] = nodes.map(() => []);
  for (const edge of edges) {
    degree[edge.source]++;
    degree[edge.target]++;
    neighbors[edge.source].push(edge.target);
    neighbors[edge.target].push(edge.source);
  }

  cached = { nodes, edges, categories, positions, degree, neighbors, radius };
  return cached;
}
