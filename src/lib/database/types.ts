/**
 * Minimal SQL contract used by repositories.
 *
 * Repositories depend on this interface — never on `expo-sqlite` directly —
 * so the same persistence code runs in the app (expo-sqlite) and in the
 * Node test suite (node:sqlite). Keep this file free of React Native imports.
 */
export type SqlValue = string | number | null;

export type SqlRunResult = { changes: number; lastInsertRowId: number };

export interface SqlDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SqlValue[]): Promise<SqlRunResult>;
  getFirstAsync<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  /** Runs `task` atomically: everything is committed, or nothing is. */
  transaction(task: () => Promise<void>): Promise<void>;
}
