import type { Folder } from './types';

/** DEMO DATA — fictional categories used only to showcase the interface. */
const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

type Seed = [id: string, name: string, parentId: string | null, tint: Folder['tint'], createdDaysAgo: number];

const seeds: Seed[] = [
  ['career', 'Carreira', null, 'rose', 120],
  ['career-leadership', 'Liderança', 'career', 'rose', 90],
  ['career-side', 'Projetos paralelos', 'career', 'rose', 60],
  ['ideas', 'Ideias', null, 'sand', 150],
  ['ideas-product', 'Produto', 'ideas', 'sand', 80],
  ['ideas-writing', 'Escrita', 'ideas', 'sand', 45],
  ['learning', 'Aprendizado', null, 'sage', 200],
  ['learning-books', 'Livros', 'learning', 'sage', 150],
  ['learning-courses', 'Cursos', 'learning', 'sage', 30],
  ['health', 'Saúde', null, 'mist', 70],
  ['personal', 'Pessoal', null, 'lilac', 180],
  ['personal-travel', 'Viagens', 'personal', 'lilac', 40],
  ['reflections', 'Reflexões', null, 'stone', 100],
];

export const mockFolders: Folder[] = seeds.map(([id, name, parentId, tint, created], index) => ({
  id,
  name,
  parentId,
  tint,
  order: index,
  createdAt: ago(created),
  // Updated date is refined from notes by the store.
  updatedAt: ago(created / 4),
}));
