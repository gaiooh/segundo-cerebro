/**
 * End-to-end tests of the persistence + business layers against a real
 * SQLite file (node:sqlite). Run with: npm test
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { createFoldersService } from '../src/features/categories/services/folders-service.ts';
import { buildVault, ORIGINAL_HEADING, safeFileName } from '../src/features/notes/markdown.ts';
import { createNotesService } from '../src/features/notes/services/notes-service.ts';
import { migrate, SCHEMA_VERSION } from '../src/lib/database/migrations.ts';
import { openNodeDatabase } from './node-sqlite.ts';

let dir: string;
let dbPath: string;
before(() => {
  dir = mkdtempSync(join(tmpdir(), 'segundo-cerebro-'));
  dbPath = join(dir, 'segundo-cerebro.db');
});
after(() => {
  // A failed assertion can leave a handle open on Windows; cleanup is best-effort.
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
});

// One monotonic clock for the whole run, like real time across app launches.
let tick = Date.parse('2026-11-05T10:00:00.000Z');
const now = () => new Date((tick += 1000)).toISOString();

/** Simulates launching the app: open the file, migrate, build services. */
async function launch() {
  const db = openNodeDatabase(dbPath);
  await migrate(db);
  return {
    db,
    notes: createNotesService({ db, newId: randomUUID, now }),
    folders: createFoldersService({ db, newId: randomUUID, now }),
  };
}

const ORIGINAL = '  Ideia solta:   quero um app que   guarda o que eu falo.\nSem filtro!  ';

describe('notes and categories', () => {
  let noteId: string;
  let careerId: string;
  let leadershipId: string;

  test('creates and saves a note, preserving the original byte-for-byte', async () => {
    const { db, notes } = await launch();
    const note = await notes.create({ text: ORIGINAL, source: 'text' });
    noteId = note.id;
    assert.match(note.id, /^[0-9a-f-]{36}$/);
    assert.equal(note.title, 'Ideia solta: quero um app que guarda o que eu falo.');
    assert.equal(note.original, ORIGINAL);
    assert.equal(note.organized, null);
    assert.equal(note.createdAt, note.updatedAt);
    assert.equal(note.folderId, null);
    db.close();
  });

  test('note survives closing and reopening the database', async () => {
    const { db, notes } = await launch();
    const stored = await notes.get(noteId);
    assert.ok(stored);
    assert.equal(stored.original, ORIGINAL);
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    assert.equal(version?.user_version, SCHEMA_VERSION);
    db.close();
  });

  test('edits title and organized version; original stays intact', async () => {
    const { db, notes } = await launch();
    const before = (await notes.get(noteId))!;
    const edited = await notes.update(noteId, { title: 'App de captura por voz', organized: '# App\n\n- Captura sem atrito' });
    assert.equal(edited.title, 'App de captura por voz');
    assert.equal(edited.organized, '# App\n\n- Captura sem atrito');
    assert.equal(edited.original, ORIGINAL);
    assert.ok(edited.updatedAt > before.updatedAt);
    assert.equal(edited.createdAt, before.createdAt);

    // Organized identical to the original is not stored twice.
    const same = await notes.update(noteId, { organized: ORIGINAL });
    assert.equal(same.organized, null);
    await notes.update(noteId, { organized: '# App\n\n- Captura sem atrito' });

    // Unchanged edits do not bump updatedAt.
    const again = await notes.update(noteId, { title: 'App de captura por voz' });
    assert.equal(again.updatedAt, (await notes.get(noteId))!.updatedAt);

    // The database itself refuses to change the original.
    await assert.rejects(db.runAsync("UPDATE notes SET original = 'x' WHERE id = ?", [noteId]), /immutable/);
    db.close();

    const reopened = await launch();
    const stored = (await reopened.notes.get(noteId))!;
    assert.ok(stored);
    assert.equal(stored.title, 'App de captura por voz');
    assert.equal(stored.original, ORIGINAL);
    reopened.db.close();
  });

  test('creates categories and subcategories, renames and moves notes between them', async () => {
    const { db, notes, folders } = await launch();
    const career = await folders.create({ name: '  Carreira ', parentId: null, tint: 'rose' });
    const leadership = await folders.create({ name: 'Liderança', parentId: career.id, tint: 'rose' });
    const ideas = await folders.create({ name: 'Ideias', parentId: null, tint: 'sand' });
    careerId = career.id;
    leadershipId = leadership.id;
    assert.equal(career.name, 'Carreira');
    assert.deepEqual(
      (await folders.list()).filter((f) => f.parentId === null).map((f) => f.name),
      ['Carreira', 'Ideias'],
    );

    await folders.reorder(ideas.id, -1);
    assert.deepEqual(
      (await folders.list()).filter((f) => f.parentId === null).map((f) => f.name),
      ['Ideias', 'Carreira'],
    );

    const renamed = await folders.update(leadership.id, { name: 'Liderança de times', tint: 'sage' });
    assert.equal(renamed.name, 'Liderança de times');
    await assert.rejects(folders.update(leadership.id, { name: '   ' }), /nome/);

    await notes.move(noteId, leadership.id);
    assert.equal((await notes.get(noteId))!.folderId, leadership.id);
    await notes.move(noteId, ideas.id);
    assert.equal((await notes.get(noteId))!.folderId, ideas.id);
    await notes.move(noteId, leadership.id);
    await assert.rejects(notes.move(noteId, 'missing'), /Categoria/);
    db.close();
  });

  test('searches ignoring case and accents, across title, organized and original', async () => {
    const { db, notes } = await launch();
    await notes.create({ text: 'Café com a mentora sobre liderança', source: 'voice' });
    assert.equal((await notes.search('CAFE')).length, 1);
    assert.equal((await notes.search('lideranca mentora')).length, 1);
    assert.equal((await notes.search('captura')).length, 1); // organized version
    assert.equal((await notes.search('sem filtro')).length, 1); // original
    assert.equal((await notes.search('100%')).length, 0); // LIKE wildcards are escaped
    assert.equal((await notes.search('inexistente')).length, 0);
    db.close();
  });

  test('links notes by unique id, from [[wiki links]] by title or id', async () => {
    const { db, notes } = await launch();
    const target = (await notes.search('mentora'))[0];
    const source = await notes.create({ text: `Ver [[${target.title}]] e [[Nota que ainda não existe]]`, source: 'text' });
    let detail = (await notes.get(source.id))!;
    assert.deepEqual(detail.links.map((l) => l.id), [target.id]);
    assert.deepEqual((await notes.get(target.id))!.backlinks.map((l) => l.id), [source.id]);

    // Creating the missing note completes the pending link.
    const later = await notes.create({ text: 'Agora existo', title: 'Nota que ainda não existe', source: 'text' });
    detail = (await notes.get(source.id))!;
    assert.deepEqual(detail.links.map((l) => l.id).sort(), [target.id, later.id].sort());

    // Links by id survive renames.
    await notes.update(source.id, { organized: `Ver [[${later.id}|essa nota]]` });
    await notes.update(later.id, { title: 'Outro título' });
    assert.deepEqual((await notes.get(source.id))!.links.map((l) => l.id), [later.id]);

    await notes.remove(later.id);
    assert.deepEqual((await notes.get(source.id))!.links, []);
    await notes.remove(source.id);
    db.close();
  });

  test('exports an Obsidian vault and the Markdown files read back correctly', async () => {
    const { db, notes, folders } = await launch();
    const linked = await notes.create({ text: 'Veja [[App de captura por voz]]', source: 'text', folderId: careerId });
    const files = buildVault(await notes.listAll(), await folders.list(), await notes.allLinks());

    const out = join(dir, 'vault');
    for (const file of files) {
      mkdirSync(join(out, ...file.dir), { recursive: true });
      writeFileSync(join(out, ...file.dir, file.name), file.content, 'utf8');
    }

    const md = readFileSync(join(out, 'Carreira', 'Liderança de times', 'App de captura por voz.md'), 'utf8');
    assert.match(md, new RegExp(`^---\\nid: ${noteId}\\n`));
    assert.match(md, /title: "App de captura por voz"/);
    assert.match(md, /category: "Carreira\/Liderança de times"/);
    assert.match(md, /created: 2026-11-05T/);
    assert.ok(md.includes('# App\n\n- Captura sem atrito'));
    assert.ok(md.includes(`## ${ORIGINAL_HEADING}\n\n${ORIGINAL}\n`), 'original kept verbatim');

    const linkFile = files.find((f) => f.content.includes(`id: ${linked.id}`))!;
    assert.deepEqual(linkFile.dir, ['Carreira']);
    assert.match(linkFile.content, /links:\n {2}- "\[\[App de captura por voz\]\]"/);
    assert.ok(linkFile.content.endsWith('---\n\nVeja [[App de captura por voz]]\n'), 'no organized version → body is the original');

    const unfiled = readFileSync(join(out, 'Sem categoria', 'Café com a mentora sobre liderança.md'), 'utf8');
    assert.match(unfiled, /source: voice/);
    db.close();
  });

  test('file names are safe and unique; links follow renamed files', () => {
    assert.equal(safeFileName('a/b: c?*'), 'a b c');
    assert.equal(safeFileName('  ...  '), 'Sem título');
    const base = {
      folderId: null,
      organized: null,
      source: 'text' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const files = buildVault(
      [
        { ...base, id: 'a', title: 'Plano', original: 'um' },
        { ...base, id: 'b', title: 'plano', original: 'dois', createdAt: '2026-01-02T00:00:00.000Z' },
        { ...base, id: 'c', title: 'Q: e agora?', original: 'tres [[Q: e agora?]]', createdAt: '2026-01-03T00:00:00.000Z' },
        { ...base, id: 'd', title: 'Ref', original: 'x', organized: 'ver [[Q: e agora?]]', createdAt: '2026-01-04T00:00:00.000Z' },
      ],
      [],
    );
    assert.deepEqual(files.map((f) => f.name), ['Plano.md', 'plano (2).md', 'Q e agora.md', 'Ref.md']);
    // Organized text links are rewritten to the exported file name, keeping the label.
    assert.ok(files[3].content.includes('ver [[Q e agora|Q: e agora?]]'));
    // The original is never rewritten.
    assert.ok(files[2].content.includes('tres [[Q: e agora?]]'));
  });

  test('deleting a category keeps its notes and subcategories (moved to the parent)', async () => {
    const { db, notes, folders } = await launch();
    await folders.remove(careerId);
    const list = await folders.list();
    assert.equal(list.find((f) => f.id === careerId), undefined);
    assert.equal(list.find((f) => f.id === leadershipId)?.parentId, null);
    assert.equal((await notes.get(noteId))!.folderId, leadershipId);
    const unfiled = (await notes.listSummaries()).filter((n) => n.folderId === null);
    assert.ok(unfiled.some((n) => n.excerpt.startsWith('Veja [[')));
    db.close();
  });

  test('deletes a note, and the deletion persists after reopening', async () => {
    const first = await launch();
    await first.notes.remove(noteId);
    assert.equal(await first.notes.get(noteId), null);
    first.db.close();

    const second = await launch();
    assert.equal(await second.notes.get(noteId), null);
    assert.ok((await second.notes.listSummaries()).every((n) => n.id !== noteId));
    second.db.close();
  });

  test('rejects empty notes and a failed transaction leaves no partial data', async () => {
    const { db, notes, folders } = await launch();
    await assert.rejects(notes.create({ text: '   \n ', source: 'text' }), /vazia/);
    const count = (await notes.listSummaries()).length;
    await assert.rejects(folders.create({ name: 'X', parentId: 'missing', tint: 'stone' }), /não encontrada/);
    await assert.rejects(
      db.transaction(async () => {
        await db.runAsync(
          `INSERT INTO notes (id, title, original, source, created_at, updated_at) VALUES ('tmp', 't', 't', 'text', 'x', 'x')`,
        );
        throw new Error('boom');
      }),
      /boom/,
    );
    assert.equal((await notes.listSummaries()).length, count);
    db.close();
  });
});
