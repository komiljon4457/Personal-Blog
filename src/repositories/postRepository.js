// =============================================================================
// repositories/postRepository.js — PERSISTENCE layer for posts.
// Only concern: reading/writing rows. No business rules live here.
// =============================================================================

const db = require("../db/connection");

const BASE_SELECT = `
  SELECT p.*, a.name AS author_name
  FROM posts p
  JOIN authors a ON a.id = p.author_id
`;

const postRepository = {
  findAll() {
    return db.prepare(`${BASE_SELECT} ORDER BY datetime(p.created_at) DESC`).all();
  },

  findPublished({ limit = 50 } = {}) {
    return db
      .prepare(
        `${BASE_SELECT}
         WHERE p.status = 'published'
         ORDER BY datetime(p.published_at) DESC
         LIMIT ?`
      )
      .all(limit);
  },

  findById(id) {
    return db.prepare(`${BASE_SELECT} WHERE p.id = ?`).get(id);
  },

  findBySlug(slug) {
    return db.prepare(`${BASE_SELECT} WHERE p.slug = ?`).get(slug);
  },

  findByCategorySlug(slug) {
    return db
      .prepare(
        `${BASE_SELECT}
         JOIN post_categories pc ON pc.post_id = p.id
         JOIN categories c       ON c.id = pc.category_id
         WHERE c.slug = ? AND p.status = 'published'
         ORDER BY datetime(p.published_at) DESC`
      )
      .all(slug);
  },

  slugExists(slug, exceptId = null) {
    const row = db
      .prepare(`SELECT id FROM posts WHERE slug = ? AND id != ?`)
      .get(slug, exceptId ?? -1);
    return Boolean(row);
  },

  insert(data) {
    const info = db
      .prepare(
        `INSERT INTO posts
           (author_id, title, slug, excerpt, content, status, published_at)
         VALUES (@author_id, @title, @slug, @excerpt, @content, @status, @published_at)`
      )
      .run(data);
    return info.lastInsertRowid;
  },

  update(id, data) {
    db.prepare(
      `UPDATE posts SET
         title        = @title,
         slug         = @slug,
         excerpt      = @excerpt,
         content      = @content,
         status       = @status,
         published_at = @published_at,
         updated_at   = datetime('now')
       WHERE id = @id`
    ).run({ ...data, id });
  },

  remove(id) {
    db.prepare(`DELETE FROM posts WHERE id = ?`).run(id);
  },

  // ---- taxonomy links -------------------------------------------------------
  getCategories(postId) {
    return db
      .prepare(
        `SELECT c.* FROM categories c
         JOIN post_categories pc ON pc.category_id = c.id
         WHERE pc.post_id = ? ORDER BY c.name`
      )
      .all(postId);
  },

  getTags(postId) {
    return db
      .prepare(
        `SELECT t.* FROM tags t
         JOIN post_tags pt ON pt.tag_id = t.id
         WHERE pt.post_id = ? ORDER BY t.name`
      )
      .all(postId);
  },

  setCategories(postId, categoryIds) {
    db.prepare(`DELETE FROM post_categories WHERE post_id = ?`).run(postId);
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)`
    );
    for (const cid of categoryIds) stmt.run(postId, cid);
  },

  setTags(postId, tagIds) {
    db.prepare(`DELETE FROM post_tags WHERE post_id = ?`).run(postId);
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`
    );
    for (const tid of tagIds) stmt.run(postId, tid);
  },

  countByStatus() {
    const rows = db
      .prepare(`SELECT status, COUNT(*) AS n FROM posts GROUP BY status`)
      .all();
    return rows.reduce((acc, r) => ({ ...acc, [r.status]: r.n }), {});
  },
};

module.exports = postRepository;
