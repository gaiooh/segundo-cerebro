import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { MarkdownFile } from './markdown';

/**
 * Platform layer of the Markdown export: writes files built by markdown.ts.
 * - One note: written to the cache and handed to the system share sheet
 *   (save to Files, send to Obsidian, e-mail…). On web: a download.
 * - Everything: the user picks a folder (e.g. their Obsidian vault) and the
 *   categories tree is recreated inside it.
 */
const MARKDOWN_MIME = 'text/markdown';

export class ExportCancelled extends Error {}

export async function shareMarkdownFile(file: MarkdownFile): Promise<void> {
  if (Platform.OS === 'web') {
    downloadOnWeb(file.name, file.content);
    return;
  }
  const dir = new Directory(Paths.cache, 'export');
  dir.create({ idempotent: true, intermediates: true });
  const target = new File(dir, file.name);
  target.create({ overwrite: true });
  await target.write(file.content);
  if (!(await Sharing.isAvailableAsync())) throw new Error('O compartilhamento não está disponível neste aparelho.');
  await Sharing.shareAsync(target.uri, {
    mimeType: MARKDOWN_MIME,
    UTI: 'net.daringfireball.markdown',
    dialogTitle: 'Exportar nota',
  });
}

export const canExportVault = Platform.OS !== 'web';

/** Returns the name of the folder created inside the one the user picked. */
export async function exportVaultToPickedFolder(files: MarkdownFile[], vaultName: string): Promise<string> {
  let picked: Directory;
  try {
    picked = await Directory.pickDirectoryAsync();
  } catch (error) {
    if (/cancel/i.test(String(error))) throw new ExportCancelled();
    throw error;
  }
  const root = picked.createDirectory(vaultName);
  const dirs = new Map<string, Directory>([['', root]]);
  const dirFor = (segments: string[]): Directory => {
    let key = '';
    let current = root;
    for (const segment of segments) {
      key = `${key}/${segment}`;
      let next = dirs.get(key);
      if (!next) {
        next = current.createDirectory(segment);
        dirs.set(key, next);
      }
      current = next;
    }
    return current;
  };
  for (const file of files) {
    const target = dirFor(file.dir).createFile(file.name, MARKDOWN_MIME);
    await target.write(file.content);
  }
  return vaultName;
}

function downloadOnWeb(name: string, content: string) {
  const blob = new Blob([content], { type: `${MARKDOWN_MIME};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
