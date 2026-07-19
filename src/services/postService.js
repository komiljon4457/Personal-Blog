// =============================================================================
// services/postService.js — BUSINESS LOGIC for posts.
// Coordinates repositories, enforces rules (slug generation & uniqueness,
// publish timestamps, taxonomy handling) and validates input.
// =============================================================================

const db = require("../db/connection");
const postRepository = require("../repositories/postRepository");
const categoryRepository = require("../repositories/categoryRepository");
const tagRepository = require("../repositories/tagRepository");
const commentRepository = require("../repositories/commentRepository");
const authorRepository = require("../repositories/authorRepository");
const slugify = require("../lib/slugify");
const { ValidationError } = require("../lib/errors");

const VALID_STATUS = ["draft", "published", "archived"];

// ---- helpers ----------------------------------------------------------------

function attachTaxonomy(post) {
  if (!post) return post;
  return {
    ...post,
    categories: postRepository.getCategories(post.id),
    tags: postRepository.getTags(post.id),
  };
}

// Ensure a slug is unique by appending -2, -3, … if needed.
function uniqueSlug(base, exceptId = null) {
  let slug = base || "post";
  let n = 2;
  while (postRepository.slugExists(slug, exceptId)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

// Turn "hiking, Slow Travel" into [{name, slug}] and resolve to tag ids.
function resolveTagIds(tagsInput) {
  if (!tagsInput) return [];
  const names = String(tagsInput)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return names.map((name) => tagRepository.findOrCreate(name, slugify(name)));
}

// Accept a single id, an array, or undefined; return an array of numbers.
function resolveCategoryIds(input) {
  if (input === undefined || input === null || input === "") return [];
  const arr = Array.isArray(input) ? input : [input];
  return arr.map(Number).filter((n) => Number.isInteger(n) && n > 0);
}

function validate(input) {
  const errors = {};
  if (!input.title || input.title.trim().length < 3)
    errors.title = "Title must be at least 3 characters.";
  if (!input.content || input.content.trim().length < 20)
    errors.content = "Body must be at least 20 characters.";
  if (input.status && !VALID_STATUS.includes(input.status))
    errors.status = "Invalid status.";
  if (Object.keys(errors).length) throw new ValidationError(errors);
}

// ---- read use-cases ---------------------------------------------------------

const postService = {
  getHomePosts() {
    return postRepository.findPublished({ limit: 20 }).map(attachTaxonomy);
  },

  getPostBySlug(slug) {
    const post = attachTaxonomy(postRepository.findBySlug(slug));
    if (!post) return null;
    post.comments = commentRepository.findApprovedForPost(post.id);
    post.commentCount = post.comments.length;
    post.author = authorRepository.findById(post.author_id);
    return post;
  },

  getPostsByCategory(slug) {
    const category = categoryRepository.findBySlug(slug);
    if (!category) return null;
    const posts = postRepository.findByCategorySlug(slug).map(attachTaxonomy);
    return { category, posts };
  },

  getAllForAdmin() {
    return postRepository.findAll().map((p) => ({
      ...attachTaxonomy(p),
      commentCount: commentRepository.countApprovedForPost(p.id),
    }));
  },

  // Shape a post for the edit form (selected category ids + comma-joined tags).
  getForEdit(id) {
    const post = postRepository.findById(id);
    if (!post) return null;
    return {
      ...post,
      categoryIds: postRepository.getCategories(id).map((c) => c.id),
      tagsCsv: postRepository.getTags(id).map((t) => t.name).join(", "),
    };
  },

  // ---- write use-cases ------------------------------------------------------

  createPost(input) {
    validate(input);
    const author = authorRepository.findDefault();
    const status = VALID_STATUS.includes(input.status) ? input.status : "draft";
    const base = slugify(input.slug || input.title);
    const slug = uniqueSlug(base);

    // Business rule: a published post gets a publish timestamp.
    const published_at =
      status === "published" ? input.publishDate || nowIso() : null;

    // Wrap the post + its taxonomy links in one transaction.
    const create = db.transaction(() => {
      const id = postRepository.insert({
        author_id: author.id,
        title: input.title.trim(),
        slug,
        excerpt: (input.excerpt || "").trim(),
        content: input.content.trim(),
        status,
        published_at,
      });
      postRepository.setCategories(id, resolveCategoryIds(input.categories ?? input.category));
      postRepository.setTags(id, resolveTagIds(input.tags));
      return id;
    });

    return create();
  },

  updatePost(id, input) {
    validate(input);
    const existing = postRepository.findById(id);
    if (!existing) return null;

    const status = VALID_STATUS.includes(input.status) ? input.status : existing.status;
    const base = slugify(input.slug || input.title);
    const slug = uniqueSlug(base, id);

    // Business rule: set publish time when moving into 'published' the first time.
    let published_at = existing.published_at;
    if (status === "published" && !existing.published_at) {
      published_at = input.publishDate || nowIso();
    } else if (status !== "published") {
      published_at = existing.published_at; // keep history; don't wipe
    }

    const update = db.transaction(() => {
      postRepository.update(id, {
        title: input.title.trim(),
        slug,
        excerpt: (input.excerpt || "").trim(),
        content: input.content.trim(),
        status,
        published_at,
      });
      postRepository.setCategories(id, resolveCategoryIds(input.categories ?? input.category));
      postRepository.setTags(id, resolveTagIds(input.tags));
    });

    update();
    return id;
  },

  deletePost(id) {
    const existing = postRepository.findById(id);
    if (!existing) return false;
    postRepository.remove(id); // cascades to comments & taxonomy links
    return true;
  },

  // ---- API read helpers -----------------------------------------------------

  // List posts as data. status: "published" (default) | "all" | a specific status.
  listPosts(status = "published") {
    let rows;
    if (status === "all") rows = postRepository.findAll();
    else if (status === "published") rows = postRepository.findPublished({ limit: 1000 });
    else rows = postRepository.findAll().filter((p) => p.status === status);
    return rows.map(attachTaxonomy);
  },

  // Get a single post (by numeric id OR slug) with taxonomy, author, comments.
  getPostByIdOrSlug(key) {
    const row = /^\d+$/.test(String(key))
      ? postRepository.findById(Number(key))
      : postRepository.findBySlug(key);
    if (!row) return null;
    const post = attachTaxonomy(row);
    post.comments = commentRepository.findApprovedForPost(post.id);
    post.commentCount = post.comments.length;
    post.author = authorRepository.findById(post.author_id);
    return post;
  },
};

function nowIso() {
  // "YYYY-MM-DD HH:MM:SS" to match SQLite's datetime('now') format.
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

module.exports = postService;
