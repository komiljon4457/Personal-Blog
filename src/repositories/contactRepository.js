// =============================================================================
// repositories/contactRepository.js — persistence for contact messages
// =============================================================================

const db = require("../db/connection");

const contactRepository = {
  insert(data) {
    return db
      .prepare(
        `INSERT INTO contact_messages (name, email, website, subject, message)
         VALUES (@name, @email, @website, @subject, @message)`
      )
      .run(data).lastInsertRowid;
  },

  findAll() {
    return db
      .prepare(`SELECT * FROM contact_messages ORDER BY datetime(created_at) DESC`)
      .all();
  },
};

module.exports = contactRepository;
