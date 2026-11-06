import type { TintName } from '@/theme';

export type Folder = {
  id: string;
  name: string;
  /** null for top-level categories. */
  parentId: string | null;
  tint: TintName;
  /** Position used by the manual ordering, among siblings. */
  order: number;
  createdAt: string;
  updatedAt: string;
};
