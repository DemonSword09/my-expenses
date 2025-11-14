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
`;
