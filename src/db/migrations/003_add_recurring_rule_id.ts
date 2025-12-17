import { run } from '@src/db/sqlite';

export async function up() {
  await run(`ALTER TABLE transactions ADD COLUMN recurring_rule_id TEXT;`);
}
