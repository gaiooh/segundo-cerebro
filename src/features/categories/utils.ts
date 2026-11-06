import type { FolderSort } from '@/features/settings';

import type { Folder } from './types';

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

export function sortFolders(folders: Folder[], sort: FolderSort, updatedAt: (f: Folder) => string): Folder[] {
  const list = [...folders];
  switch (sort) {
    case 'manual':
      return list.sort((a, b) => a.order - b.order);
    case 'name':
      return list.sort((a, b) => collator.compare(a.name, b.name));
    case 'created':
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'updated':
      return list.sort((a, b) => updatedAt(b).localeCompare(updatedAt(a)));
  }
}

export const sortLabels: Record<FolderSort, string> = {
  manual: 'Manual',
  name: 'Nome',
  updated: 'Atualização',
  created: 'Criação',
};

export const sortDescriptions: Record<FolderSort, string> = {
  manual: 'Na ordem que você definir',
  name: 'De A a Z',
  updated: 'Modificadas recentemente primeiro',
  created: 'Criadas recentemente primeiro',
};
