// src/db/migrations/index.ts
import { exec, run, first } from '../sqlite';
import { MIGRATION_001_SQL } from './default_schema';

//import category seed data
import { CATEGORY_SEED } from './categories';
import { uuidSync } from '@src/utils/uuid';

async function isApplied(name: string): Promise<boolean> {
  const row = await first<{ name: string }>('SELECT name FROM migrations WHERE name = ? LIMIT 1', [
    name,
  ]);
  return !!row;
}

async function markApplied(name: string): Promise<void> {
  const now = new Date().toISOString();
  await run('INSERT INTO migrations (name, applied_at) VALUES (?, ?)', [name, now]);
}

export async function runMigrations(): Promise<void> {
  try {
    // await exec(`
    //   DROP TABLE migrations;
    //   DROP TABLE accounts;
    //   DROP TABLE payees;
    //   DROP TABLE categories;
    //   DROP TABLE transactions;
    //   DROP TABLE transfers;
    //   `);
    await exec(`CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL);`);
    const name = '001_create_schema';
    const already = await isApplied(name);
    if (!already) {
      await exec(MIGRATION_001_SQL);
      await markApplied(name);
      console.log('[migrations] applied', name);
    }

    // categories seed (idempotent)
    const seedName = '001_seed_categories';
    const seeded = await isApplied(seedName);
    if (seeded) return;

    for (const cat of CATEGORY_SEED) {
      const parentId = uuidSync();
      await run(
        `INSERT OR IGNORE INTO categories (id, label, parentId, icon, color)
         VALUES (?, ?, NULL, ?, ?)`,
        [parentId, cat.name, cat.icon ?? null, null],
      );

      if (Array.isArray(cat.subcategories)) {
        for (const sub of cat.subcategories) {
          const subId = uuidSync();
          await run(
            `INSERT OR IGNORE INTO categories (id, label, parentId, icon, color)
             VALUES (?, ?, ?, ?, ?)`,
            [subId, sub.name, parentId, sub.icon ?? null, null],
          );
        }
      }
    }

    await markApplied(seedName);
    console.log('[migrations] applied', seedName);
  } catch (err) {
    console.error('[migrations] failed', err);
    throw err;
  }
}
