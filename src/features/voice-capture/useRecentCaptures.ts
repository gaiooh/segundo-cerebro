import { useCallback, useMemo, useState } from 'react';

import { useNotes } from '@/features/notes';

export type RecentCapture = {
  id: string;
  title: string;
  source: 'voice' | 'text';
  createdAt: string;
  /** Set for real, saved notes (tapping opens them). */
  noteId?: string;
  /** True for simulated voice captures (recording is not implemented yet). */
  pending?: boolean;
};

/**
 * Recent captures: the latest saved notes, preceded by simulated voice
 * captures from this session (kept in memory only, until transcription exists).
 */
export function useRecentCaptures() {
  const { notes } = useNotes();
  const [simulated, setSimulated] = useState<RecentCapture[]>([]);

  const saved = useMemo<RecentCapture[]>(
    () =>
      notes.slice(0, 8).map((n) => ({ id: n.id, noteId: n.id, title: n.title, source: n.source, createdAt: n.createdAt })),
    [notes],
  );

  const addSimulated = useCallback((item: Pick<RecentCapture, 'title' | 'source'>) => {
    setSimulated((current) => [
      { ...item, pending: true, id: `capture-${Date.now().toString(36)}`, createdAt: new Date().toISOString() },
      ...current,
    ]);
  }, []);

  return { recents: [...simulated, ...saved], addSimulated };
}
