-- =============================================================================
-- schema.sql — SQLite schema for the Personal Blog
-- Mirrors the UML domain model: Author, Post, Category, Tag, Comment
-- (+ a small contact_messages operational table for the contact form).
-- =============================================================================

PRAGMA foreign_keys = ON;

-- ---- Author -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS authors (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  bio           TEXT,
  avatar_url    TEXT
);

-- ---- Post -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id    INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  slug         TEXT    NOT NULL UNIQUE,
  excerpt      TEXT,
  content      TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'published', 'archived')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);

-- ---- Category ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  slug        TEXT    NOT NULL UNIQUE,
  description TEXT
);

-- ---- Tag --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL,
  slug TEXT    NOT NULL UNIQUE
);

-- ---- Post <-> Category (many-to-many) ---------------------------------------
CREATE TABLE IF NOT EXISTS post_categories (
  post_id     INTEGER NOT NULL REFERENCES posts(id)      ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- ---- Post <-> Tag (many-to-many) --------------------------------------------
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ---- Comment ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id      INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name  TEXT    NOT NULL,
  author_email TEXT    NOT NULL,
  content      TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'spam')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---- Contact messages (operational) -----------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  website    TEXT,
  subject    TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---- Indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_status     ON posts(status, published_at);
CREATE INDEX IF NOT EXISTS idx_comments_post    ON comments(post_id, status);
