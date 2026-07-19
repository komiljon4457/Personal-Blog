// =============================================================================
// db/connection.js — the single shared SQLite connection (better-sqlite3)
// =============================================================================

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// The database file lives in <project>/data/blog.db (created on first run).
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, "blog.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Recommended pragmas: enforce FKs, better concurrency.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

module.exports = db;
