import type { SqlDatabase } from './types.ts';

/**
 * Schema migrations, applied in order and tracked with `PRAGMA user_version`.
 * Never edit a released migration: append a new one instead, so existing
 * installs upgrade without losing data.
 */
const migrations: string[] = [
  // 1 — notes, categories and links between notes.
  `
  CREATE TABLE folders (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    parent_id   TEXT REFERENCES folders(id) ON DELETE CASCADE,
    tint        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE INDEX folders_parent ON folders(parent_id);

  CREATE TABLE notes (
    id          TEXT PRIMARY KEY NOT NULL,
    folder_id   TEXT REFERENCES folders(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    -- The thought exactly as captured. Written once, never updated.
    original    TEXT NOT NULL,
    -- Optional organized version. NULL means "same as the original".
    organized   TEXT,
    source      TEXT NOT NULL CHECK (source IN ('voice', 'text')),
    -- Derived, accent-free lowercase text used only for search.
    search_text TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE INDEX notes_folder ON notes(folder_id);
  CREATE INDEX notes_updated ON notes(updated_at);

  -- The original is immutable at the database level, not only in the UI.
  CREATE TRIGGER notes_original_immutable
  BEFORE UPDATE OF original ON notes
  WHEN NEW.original IS NOT OLD.original
  BEGIN
    SELECT RAISE(ABORT, 'original is immutable');
  END;

  CREATE TABLE note_links (
    source_id   TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_id   TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL,
    PRIMARY KEY (source_id, target_id)
  );
  CREATE INDEX note_links_target ON note_links(target_id);
  `,
];

export const SCHEMA_VERSION = migrations.length;

export async function migrate(db: SqlDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < migrations.length) {
    const sql = migrations[version];
    const next = version + 1;
    await db.transaction(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}
