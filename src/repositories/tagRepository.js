// =============================================================================
// repositories/tagRepository.js — persistence for tags
// =============================================================================

const db = require("../db/connection");

const tagRepository = {
  findAll() {
    return db.prepare(`SELECT * FROM tags ORDER BY name`).all();
  },

  findBySlug(slug) {
    return db.prepare(`SELECT * FROM tags WHERE slug = ?`).get(slug);
  },

  // Find a tag by name, or create it, returning its id. Used when a post is
  // saved with a comma-separated list of tag names.
  findOrCreate(name, slug) {
    const existing = db.prepare(`SELECT id FROM tags WHERE slug = ?`).get(slug);
    if (existing) return existing.id;
    return db
      .prepare(`INSERT INTO tags (name, slug) VALUES (?, ?)`)
      .run(name, slug).lastInsertRowid;
  },
};

module.exports = tagRepository;
