// =============================================================================
// repositories/categoryRepository.js — persistence for categories
// =============================================================================

const db = require("../db/connection");

const categoryRepository = {
  findAll() {
    return db.prepare(`SELECT * FROM categories ORDER BY name`).all();
  },

  findBySlug(slug) {
    return db.prepare(`SELECT * FROM categories WHERE slug = ?`).get(slug);
  },

  findById(id) {
    return db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
  },

  // Categories with a count of their PUBLISHED posts (for the sidebar).
  findAllWithCounts() {
    return db
      .prepare(
        `SELECT c.*, COUNT(p.id) AS post_count
         FROM categories c
         LEFT JOIN post_categories pc ON pc.category_id = c.id
         LEFT JOIN posts p ON p.id = pc.post_id AND p.status = 'published'
         GROUP BY c.id
         ORDER BY c.name`
      )
      .all();
  },
};

module.exports = categoryRepository;
