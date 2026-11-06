import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useMemo, type ReactNode } from 'react';

import { migrate } from './migrations';
import type { SqlDatabase } from './types';

/** Single local database file for the whole knowledge base. */
export const DATABASE_NAME = 'segundo-cerebro.db';

/** Exposes an expo-sqlite connection through the app's SqlDatabase contract. */
export function adaptExpoDatabase(db: SQLiteDatabase): SqlDatabase {
  return {
    execAsync: (sql) => db.execAsync(sql),
    runAsync: (sql, params = []) => db.runAsync(sql, params),
    getFirstAsync: (sql, params = []) => db.getFirstAsync(sql, params),
    getAllAsync: (sql, params = []) => db.getAllAsync(sql, params),
    transaction: (task) => db.withTransactionAsync(task),
  };
}

async function initialize(db: SQLiteDatabase) {
  // WAL: faster writes, and readers never block the writer.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(adaptExpoDatabase(db));
}

/** Opens (and migrates) the database before rendering its children. */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initialize}>
      {children}
    </SQLiteProvider>
  );
}

export function useDatabase(): SqlDatabase {
  const db = useSQLiteContext();
  return useMemo(() => adaptExpoDatabase(db), [db]);
}
