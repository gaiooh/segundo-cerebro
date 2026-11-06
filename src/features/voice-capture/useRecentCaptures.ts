import { useCallback, useMemo, useState } from 'react';

import { mockNotes } from '@/features/notes';

export type RecentCapture = {
  id: string;
  title: string;
  source: 'voice' | 'text';
  createdAt: string;
  /** True for items created in this session by the simulated capture. */
  pending?: boolean;
};

/**
 * Recent captures: demo notes plus whatever was "captured" in this session.
 * Session items live in memory only.
 */
export function useRecentCaptures() {
  const [sessionItems, setSessionItems] = useState<RecentCapture[]>([]);

  const seeded = useMemo<RecentCapture[]>(
    () =>
      [...mockNotes]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6)
        .map((n) => ({ id: n.id, title: n.title, source: n.source, createdAt: n.updatedAt })),
    [],
  );

  const add = useCallback((item: Omit<RecentCapture, 'id' | 'createdAt'>) => {
    setSessionItems((current) => [
      { ...item, id: `capture-${Date.now().toString(36)}`, createdAt: new Date().toISOString() },
      ...current,
    ]);
  }, []);

  return { recents: [...sessionItems, ...seeded], add };
}
