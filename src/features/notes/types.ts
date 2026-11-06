export type Note = {
  id: string;
  folderId: string;
  title: string;
  /** Markdown body. Only a plain-text excerpt is displayed for now. */
  body: string;
  /** How the note was captured. */
  source: 'voice' | 'text';
  createdAt: string;
  updatedAt: string;
};
