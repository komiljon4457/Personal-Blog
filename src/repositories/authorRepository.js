// =============================================================================
// repositories/authorRepository.js — persistence for authors
// =============================================================================

const db = require("../db/connection");

const authorRepository = {
  findById(id) {
    return db.prepare(`SELECT * FROM authors WHERE id = ?`).get(id);
  },

  findByEmail(email) {
    return db.prepare(`SELECT * FROM authors WHERE email = ?`).get(email);
  },

  // The blog has a single author; this returns them (used as the default
  // author for new posts while auth is stubbed).
  findDefault() {
    return db.prepare(`SELECT * FROM authors ORDER BY id LIMIT 1`).get();
  },
};

module.exports = authorRepository;
