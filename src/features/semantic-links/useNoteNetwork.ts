import { useEffect, useMemo, useState } from 'react';

import { useCategories, type Folder } from '@/features/categories';
import { useNotes, type NoteSummary } from '@/features/notes';

import { buildNoteNetwork, type NetworkLinkInput } from './note-network';

type Snapshot = { notes: NoteSummary[]; folders: Folder[]; links: NetworkLinkInput[] };

/**
 * The user's knowledge network, rebuilt from the database when notes,
 * categories or links change.
 *
 * While `enabled` is false (screen not focused) the last network is kept:
 * the 3D layout is not recomputed on every autosave of a note being edited.
 * `network` is null when there are no notes.
 */
export function useNoteNetwork(enabled: boolean) {
  const { notes, service, ready: notesReady } = useNotes();
  const { folders, ready: foldersReady } = useCategories();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  // `notes` is replaced after every write, so links are re-read with it.
  useEffect(() => {
    if (!enabled || !notesReady || !foldersReady) return;
    let cancelled = false;
    service
      .allLinks()
      .then((links) => !cancelled && setSnapshot({ notes, folders, links }))
      .catch((error) => console.error('Falha ao carregar ligações', error));
    return () => {
      cancelled = true;
    };
  }, [enabled, notesReady, foldersReady, service, notes, folders]);

  const network = useMemo(
    () => (snapshot ? buildNoteNetwork(snapshot.notes, snapshot.folders, snapshot.links) : null),
    [snapshot],
  );

  return { network, ready: snapshot !== null };
}
