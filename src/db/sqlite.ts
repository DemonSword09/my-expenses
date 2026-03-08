// src/db/sqlite.ts
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite'; // types exported by expo-sqlite
const DB_NAME = 'myexpenses.db';

let _db: SQLiteDatabase | null = null;
let _dbPromise: Promise<SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLiteDatabase> {
  if (_db) return _db;
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const db = await (SQLite as any).openDatabaseAsync(DB_NAME);
    _db = db;
    return db;
  })();

  return _dbPromise;
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
  if (Array.isArray(params)) {
    return db.runAsync(sql, ...params);
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
    return db.getAllAsync<T>(sql, ...params);
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
    return db.getFirstAsync<T>(sql, ...params);
  } else if (params && typeof params === 'object') {
    return db.getFirstAsync<T>(sql, params);
  } else {
    return db.getFirstAsync<T>(sql);
  }
}
