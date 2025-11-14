// src/db/sqlite.ts
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite'; // types exported by expo-sqlite
const DB_NAME = 'myexpenses.db';

let _db: SQLiteDatabase;

export async function getDb(): Promise<SQLiteDatabase> {
  if (_db) return _db;
  // openDatabaseAsync is the async API recommended in Expo docs
  // (calls the native open and returns an object with execAsync/runAsync/getAllAsync, etc.)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore -- some versions export openDatabaseAsync as any; keeping this to match docs
  _db = await (SQLite as any).openDatabaseAsync(DB_NAME);
  return _db;
}

/**
 * Execute many statements (useful for migrations). Beware: execAsync does not escape params.
 */
export async function exec(sql: string): Promise<void> {
  const db = await getDb();
  await db.execAsync(sql);
}

/**
 * Run a write operation (INSERT/UPDATE/DELETE). Accepts either variadic params or an array.
 * Returns the result object from runAsync (has lastInsertRowId, changes).
 */
export async function run(sql: string, params?: any[] | Record<string, any> | any): Promise<any> {
  const db = await getDb();
  // runAsync supports variadic args as either array or ...args; we pass params directly
  if (Array.isArray(params)) {
    return db.runAsync(sql, ...(params as any));
  } else if (params && typeof params === 'object') {
    return db.runAsync(sql, params);
  } else {
    return db.runAsync(sql);
  }
}

/**
 * Run a SELECT and return all rows as an array of objects.
 */
export async function all<T = any>(
  sql: string,
  params?: any[] | Record<string, any>,
): Promise<T[]> {
  const db = await getDb();
  if (Array.isArray(params)) {
    return db.getAllAsync<T>(sql, ...(params as any));
  } else if (params && typeof params === 'object') {
    return db.getAllAsync<T>(sql, params);
  } else {
    return db.getAllAsync<T>(sql);
  }
}

/**
 * Get a single row (first).
 */
export async function first<T = any>(
  sql: string,
  params?: any[] | Record<string, any>,
): Promise<T | null> {
  const db = await getDb();
  if (Array.isArray(params)) {
    return db.getFirstAsync<T>(sql, ...(params as any));
  } else if (params && typeof params === 'object') {
    return db.getFirstAsync<T>(sql, params);
  } else {
    return db.getFirstAsync<T>(sql);
  }
}
