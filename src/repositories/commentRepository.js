// =============================================================================
// repositories/commentRepository.js — persistence for comments
// =============================================================================

const db = require("../db/connection");

const commentRepository = {
  findById(id) {
    return db.prepare(`SELECT * FROM comments WHERE id = ?`).get(id);
  },

  findApprovedForPost(postId) {
    return db
      .prepare(
        `SELECT * FROM comments
         WHERE post_id = ? AND status = 'approved'
         ORDER BY datetime(created_at) ASC`
      )
      .all(postId);
  },

  countApprovedForPost(postId) {
    return db
      .prepare(
        `SELECT COUNT(*) AS n FROM comments WHERE post_id = ? AND status = 'approved'`
      )
      .get(postId).n;
  },

  // Pending comments joined with their post title (for the moderation table).
  findPendingWithPost() {
    return db
      .prepare(
        `SELECT cm.*, p.title AS post_title, p.slug AS post_slug
         FROM comments cm
         JOIN posts p ON p.id = cm.post_id
         WHERE cm.status = 'pending'
         ORDER BY datetime(cm.created_at) DESC`
      )
      .all();
  },

  countPending() {
    return db
      .prepare(`SELECT COUNT(*) AS n FROM comments WHERE status = 'pending'`)
      .get().n;
  },

  insert(data) {
    return db
      .prepare(
        `INSERT INTO comments (post_id, author_name, author_email, content, status)
         VALUES (@post_id, @author_name, @author_email, @content, @status)`
      )
      .run(data).lastInsertRowid;
  },

  setStatus(id, status) {
    db.prepare(`UPDATE comments SET status = ? WHERE id = ?`).run(status, id);
  },

  remove(id) {
    db.prepare(`DELETE FROM comments WHERE id = ?`).run(id);
  },
};

module.exports = commentRepository;
