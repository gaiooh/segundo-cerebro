/**
 * The 3D network is built from real notes, folders and [[links]] stored in
 * SQLite (node:sqlite), through the same services the app uses.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { describe, test } from 'node:test';

import { createFoldersService } from '../src/features/categories/services/folders-service.ts';
import { createNotesService } from '../src/features/notes/services/notes-service.ts';
import { buildNoteNetwork, countNoteLinks, UNFILED_GROUP_ID } from '../src/features/semantic-links/note-network.ts';
import { migrate } from '../src/lib/database/migrations.ts';
import { openNodeDatabase } from './node-sqlite.ts';

let tick = Date.parse('2026-11-07T10:00:00.000Z');
const now = () => new Date((tick += 1000)).toISOString();

async function setup() {
  const db = openNodeDatabase(':memory:');
  await migrate(db);
  return {
    db,
    notes: createNotesService({ db, newId: randomUUID, now }),
    folders: createFoldersService({ db, newId: randomUUID, now }),
  };
}

describe('knowledge network from real notes', () => {
  test('no notes → no network (the screen shows the labeled demo instead)', async () => {
    const { db, folders } = await setup();
    await folders.create({ name: 'Vazia', parentId: null, tint: 'rose' });
    assert.equal(buildNoteNetwork([], await folders.list(), []), null);
    db.close();
  });

  test('nodes, groups and edges mirror notes, folders and [[links]]', async () => {
    const { db, notes, folders } = await setup();
    const ideas = await folders.create({ name: 'Ideias', parentId: null, tint: 'sand' });
    const product = await folders.create({ name: 'Produto', parentId: ideas.id, tint: 'sand' });
    await folders.create({ name: 'Vazia', parentId: null, tint: 'rose' });
    const a = await notes.create({ text: 'Captura sem atrito', source: 'text', folderId: product.id });
    const b = await notes.create({ text: 'Ver [[Captura sem atrito]]', source: 'voice', folderId: ideas.id });
    const c = await notes.create({ text: 'Solta, ligada a [[Captura sem atrito]]', source: 'text' });

    const network = buildNoteNetwork(await notes.listSummaries(), await folders.list(), await notes.allLinks());
    assert.ok(network);

    // Empty folders add no node; used folders become hubs.
    const labels = network.nodes.map((n) => `${n.kind}:${n.label}`).sort();
    assert.deepEqual(labels, [
      'folder:Ideias',
      'folder:Produto',
      'note:Captura sem atrito',
      'note:Solta, ligada a Captura sem atrito',
      'note:Ver Captura sem atrito',
    ]);

    // Groups: top-level category of each note; unfiled notes get their own group.
    assert.deepEqual(network.categories.map((c) => c.name), ['Ideias', 'Sem categoria']);
    const node = (id: string) => network.nodes.findIndex((n) => n.id === id);
    assert.equal(network.nodes[node(a.id)].categoryId, ideas.id); // subfolder → root category
    assert.equal(network.nodes[node(c.id)].categoryId, UNFILED_GROUP_ID);

    // Edges: 2 real links + structure (a→Produto, b→Ideias, Produto→Ideias).
    assert.equal(countNoteLinks(network), 2);
    assert.equal(network.edges.length, 5);
    const has = (x: number, y: number, kind: string) =>
      network.edges.some((e) => e.kind === kind && ((e.source === x && e.target === y) || (e.source === y && e.target === x)));
    assert.ok(has(node(b.id), node(a.id), 'link'));
    assert.ok(has(node(c.id), node(a.id), 'link'));
    assert.ok(has(node(a.id), node(product.id), 'structure'));
    assert.ok(has(node(product.id), node(ideas.id), 'structure'));
    assert.deepEqual([...network.neighbors[node(a.id)]].sort(), [node(b.id), node(c.id), node(product.id)].sort());
    assert.equal(network.degree[node(a.id)], 3);

    // Layout: finite 3D coordinates for every node.
    assert.equal(network.positions.length, network.nodes.length * 3);
    assert.ok([...network.positions].every(Number.isFinite));
    assert.ok(network.radius > 0);
    db.close();
  });

  test('a single note still lays out, and the same data gives the same layout', async () => {
    const { db, notes, folders } = await setup();
    await notes.create({ text: 'Única', source: 'text' });
    const one = buildNoteNetwork(await notes.listSummaries(), await folders.list(), [])!;
    assert.equal(one.nodes.length, 1);
    assert.ok([...one.positions].every(Number.isFinite));
    assert.ok(one.radius >= 2);
    const again = buildNoteNetwork(await notes.listSummaries(), await folders.list(), [])!;
    assert.deepEqual([...again.positions], [...one.positions]);
    db.close();
  });

  test('deleting and moving notes is reflected in the rebuilt network', async () => {
    const { db, notes, folders } = await setup();
    const health = await folders.create({ name: 'Saúde', parentId: null, tint: 'sage' });
    const a = await notes.create({ text: 'Sono', source: 'text' });
    const b = await notes.create({ text: 'Rotina [[Sono]]', source: 'text' });
    await notes.move(a.id, health.id);
    let network = buildNoteNetwork(await notes.listSummaries(), await folders.list(), await notes.allLinks())!;
    assert.deepEqual(network.categories.map((c) => c.name), ['Saúde', 'Sem categoria']);
    assert.equal(countNoteLinks(network), 1);

    await notes.remove(a.id);
    network = buildNoteNetwork(await notes.listSummaries(), await folders.list(), await notes.allLinks())!;
    assert.deepEqual(network.nodes.map((n) => n.id), [b.id]); // Saúde is empty now → no hub
    assert.equal(network.edges.length, 0);
    db.close();
  });
});
