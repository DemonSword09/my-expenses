export const SCHEMA_SQL = `

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

-- Recurring rules
CREATE TABLE IF NOT EXISTS recurring_rules (
  id TEXT PRIMARY KEY,
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  human_readable TEXT,
  template_json TEXT NOT NULL,
  next_date INTEGER NOT NULL,
  end_date INTEGER NULL,
  enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Transactions
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
  recurring_rule_id TEXT,
  FOREIGN KEY(accountId) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY(payeeId) REFERENCES payees(id) ON DELETE RESTRICT,
  FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY(recurring_rule_id) REFERENCES recurring_rules(id) ON DELETE SET NULL
);

-- Transfers
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

-- Triggers for Template consistency (Soft FK)
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

export const INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_recurring_rules_next_date ON recurring_rules(next_date);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_enabled ON recurring_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_templates_recurring_rule ON templates(recurring_rule_id);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_created ON transactions(deleted, createdAt);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);
CREATE INDEX IF NOT EXISTS idx_transactions_payee ON transactions(payeeId);
CREATE INDEX IF NOT EXISTS idx_categories_label_nocase ON categories(label COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_payees_name_nocase ON payees(name COLLATE NOCASE);
`;
