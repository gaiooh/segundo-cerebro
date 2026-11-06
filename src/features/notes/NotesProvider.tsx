import { randomUUID } from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useDatabase } from '@/lib/database';

import type { NoteSummary } from './model';
import { createNotesService, type NotesService } from './services/notes-service';

type NotesContextValue = {
  /** Every note (summary only), most recently updated first. */
  notes: NoteSummary[];
  ready: boolean;
  /** Service with all note rules; mutations must go through the wrappers below. */
  service: NotesService;
  create: NotesService['create'];
  update: NotesService['update'];
  move: NotesService['move'];
  remove: NotesService['remove'];
  /** Re-reads summaries from the database (e.g. after a category is deleted). */
  refresh: () => Promise<void>;
};

const NotesContext = createContext<NotesContextValue | null>(null);

/**
 * UI state for notes. The database is the single source of truth: after
 * every write the summaries are re-read from it, never patched by hand.
 */
export function NotesProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const service = useMemo(() => createNotesService({ db, newId: randomUUID }), [db]);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setNotes(await service.listSummaries());
    setReady(true);
  }, [service]);

  // Initial load from the database.
  useEffect(() => {
    let cancelled = false;
    service
      .listSummaries()
      .then((rows) => !cancelled && setNotes(rows))
      .catch((error) => console.error('Falha ao carregar notas', error))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [service]);

  const value = useMemo<NotesContextValue>(() => {
    const thenRefresh =
      <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
      async (...args: A): Promise<R> => {
        const result = await fn(...args);
        await refresh();
        return result;
      };
    return {
      notes,
      ready,
      service,
      create: thenRefresh(service.create),
      update: thenRefresh(service.update),
      move: thenRefresh(service.move),
      remove: thenRefresh(service.remove),
      refresh,
    };
  }, [notes, ready, service, refresh]);

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const value = useContext(NotesContext);
  if (!value) throw new Error('useNotes must be used inside <NotesProvider>');
  return value;
}
