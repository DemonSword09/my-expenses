export const MIGRATION_001_SQL = `

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  opening_balance INTEGER DEFAULT 0,
  type TEXT,
  description TEXT,
  color INTEGER DEFAULT 0,
  currency_code TEXT
);

-- Payees / Payers
CREATE TABLE IF NOT EXISTS payees (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Hierarchical categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT UNIQUE NOT NULL,
  parentId TEXT,
  icon TEXT,
  color INTEGER,
  FOREIGN KEY(parentId) REFERENCES categories(id) ON DELETE CASCADE
);

-- Transactions (replaces expenses)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  comment TEXT,
  accountId TEXT NOT NULL,
  payeeId TEXT,
  categoryId TEXT,
  status TEXT,
  cr_amount INTEGER,
  transaction_type TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER,
  deleted INTEGER DEFAULT 0,
  FOREIGN KEY(accountId) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY(payeeId) REFERENCES payees(id) ON DELETE RESTRICT,
  FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Transfers table linking transactions (if needed)
CREATE TABLE IF NOT EXISTS transfers (
  id TEXT PRIMARY KEY,
  transactionId TEXT,
  FOREIGN KEY(transactionId) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_json TEXT NOT NULL,    
  is_recurring INTEGER DEFAULT 0,
  recurring_rule_id TEXT NULL,    
  created_at INTEGER NOT NULL,    
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(recurring_rule_id) REFERENCES recurring_rules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_templates_recurring_rule ON templates(recurring_rule_id);

-- Recurring rules: separate table so rules can be reused or referenced
CREATE TABLE IF NOT EXISTS recurring_rules (
  id TEXT PRIMARY KEY,
  cron_expression TEXT NOT NULL,  -- cron-like expression (string)
  timezone TEXT DEFAULT 'UTC',    -- IANA timezone name
  human_readable TEXT,            -- optional friendly description
  template_json TEXT NOT NULL,    -- snapshot of template used when rule created (JSON)
  next_date INTEGER NOT NULL,     -- epoch ms (UTC) when the next run is scheduled
  end_date INTEGER NULL,          -- epoch ms (UTC) or NULL
  enabled INTEGER DEFAULT 1,      -- 0 = disabled, 1 = enabled
  created_at INTEGER NOT NULL,    -- epoch ms
  updated_at INTEGER NOT NULL    -- epoch ms
);

CREATE INDEX IF NOT EXISTS idx_recurring_rules_next_date ON recurring_rules(next_date);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_enabled ON recurring_rules(enabled);

-- Optional foreign key relationship (SQLite requires PRAGMA foreign_keys = ON to enforce)
-- We add a foreign key but note: if your migrations runner disables foreign_keys, enforcement won't happen.
-- This keeps referential integrity if enabled.
PRAGMA writable_schema = 1;
-- Add foreign key by recreating table if needed - simpler approach: create a trigger to prevent orphaned recurring_rule_id (optional)
PRAGMA writable_schema = 0;

-- Example trigger that prevents inserting a template with a non-existing recurring_rule_id (soft enforcement)
CREATE TRIGGER IF NOT EXISTS trg_templates_recurring_fk_insert
BEFORE INSERT ON templates
WHEN NEW.recurring_rule_id IS NOT NULL
BEGIN
  SELECT
    CASE
      WHEN (SELECT id FROM recurring_rules WHERE id = NEW.recurring_rule_id) IS NULL
      THEN RAISE(ABORT, 'foreign key violation: recurring_rule_id does not exist')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_templates_recurring_fk_update
BEFORE UPDATE ON templates
WHEN NEW.recurring_rule_id IS NOT NULL
BEGIN
  SELECT
    CASE
      WHEN (SELECT id FROM recurring_rules WHERE id = NEW.recurring_rule_id) IS NULL
      THEN RAISE(ABORT, 'foreign key violation: recurring_rule_id does not exist')
    END;
END;
`;
