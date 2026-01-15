import { exec, run, first } from '../sqlite';
import { SCHEMA_SQL, INDEXES_SQL } from './default_schema';
import { CATEGORY_SEED } from './categories';
import { uuidSync } from '@src/utils/uuid';

async function isApplied(name: string): Promise<boolean> {
  // If migrations table doesn't exist, nothing is applied
  try {
    const row = await first<{ name: string }>('SELECT name FROM migrations WHERE name = ? LIMIT 1', [name]);
    return !!row;
  } catch (e) {
    return false;
  }
}

async function markApplied(name: string): Promise<void> {
  const now = new Date().toISOString();
  await run('INSERT INTO migrations (name, applied_at) VALUES (?, ?)', [name, now]);
}

async function wipeDatabase() {
  console.log('[migrations] Wiping database for fresh schema...');
  await exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS payees;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS transfers;
    DROP TABLE IF EXISTS templates;
    DROP TABLE IF EXISTS recurring_rules;
    DROP TABLE IF EXISTS migrations;
    PRAGMA foreign_keys = ON;
  `);
}

async function getCategoryId(label: string): Promise<string | null> {
  try {
    const row = await first<{ id: string }>('SELECT id FROM categories WHERE label = ?', [label]);
    return row ? row.id : null;
  } catch (e) {
    return null;
  }
}

export async function runMigrations(): Promise<void> {
  try {
    const SCHEMA_MIGRATION = '001_schema_v2';

    // 1. SCHEMA
    // If getting 'no such table: migrations' -> isApplied returns false -> we enter the block.
    // If '001_schema_v2' is missing -> we WIPE and RE-CREATE.
    if (!(await isApplied(SCHEMA_MIGRATION))) {
      await wipeDatabase();
      await exec(SCHEMA_SQL);
      // Re-create migration table is part of SCHEMA_SQL usually, but let's be safe:
      // SCHEMA_SQL likely has 'CREATE TABLE IF NOT EXISTS migrations...' at the top.
      await markApplied(SCHEMA_MIGRATION);
      console.log('[migrations] applied', SCHEMA_MIGRATION);
    }

    // 2. CATEGORIES (Seed Data)
    const SEED_MIGRATION = '002_categories_v1';
    if (!(await isApplied(SEED_MIGRATION))) {
      for (const cat of CATEGORY_SEED) {
        let parentId = await getCategoryId(cat.name);

        if (!parentId) {
          parentId = uuidSync();
          await run(
            `INSERT INTO categories (id, label, parentId, icon, color) VALUES (?, ?, NULL, ?, ?)`,
            [parentId, cat.name, cat.icon ?? null, cat.color ?? null],
          );
        }

        if (Array.isArray(cat.subcategories)) {
          for (const sub of cat.subcategories) {
            const existingSubId = await getCategoryId(sub.name);
            if (!existingSubId) {
              const subId = uuidSync();
              await run(
                `INSERT INTO categories (id, label, parentId, icon, color) VALUES (?, ?, ?, ?, ?)`,
                [subId, sub.name, parentId, sub.icon ?? null, cat.color ?? null],
              );
            }
          }
        }
      }
      await markApplied(SEED_MIGRATION);
      console.log('[migrations] applied', SEED_MIGRATION);
    }

    // 3. INDEXES
    const INDEX_MIGRATION = '003_indexes_v1';
    if (!(await isApplied(INDEX_MIGRATION))) {
      await exec(INDEXES_SQL);
      await markApplied(INDEX_MIGRATION);
      console.log('[migrations] applied', INDEX_MIGRATION);
    }

  } catch (err) {
    console.error('[migrations] failed', err);
    throw err;
  }
}
