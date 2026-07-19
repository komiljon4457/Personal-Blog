// =============================================================================
// controllers/apiController.js — REST API handlers (JSON in / JSON out).
//
// These reuse the SAME service layer as the server-rendered pages — the only
// difference is the representation: JSON instead of HTML. Thrown ValidationError
// is converted to a 400 by the JSON error handler at the bottom.
// =============================================================================

const postService = require("../services/postService");
const commentService = require("../services/commentService");
const contactService = require("../services/contactService");
const blogQueryService = require("../services/blogQueryService");
const { ValidationError } = require("../lib/errors");

const isNumeric = (v) => /^\d+$/.test(String(v));

const apiController = {
  // ---- Posts ----------------------------------------------------------------
  listPosts(req, res) {
    const status = req.query.status || "published";
    res.json(postService.listPosts(status));
  },

  getPost(req, res) {
    const post = postService.getPostByIdOrSlug(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  },

  createPost(req, res) {
    const id = postService.createPost(req.body); // throws ValidationError -> 400
    res.status(201)
      .location(`/api/posts/${id}`)
      .json(postService.getPostByIdOrSlug(id));
  },

  updatePost(req, res) {
    if (!isNumeric(req.params.id))
      return res.status(400).json({ error: "Post id must be numeric" });
    const result = postService.updatePost(Number(req.params.id), req.body);
    if (result === null) return res.status(404).json({ error: "Post not found" });
    res.json(postService.getPostByIdOrSlug(Number(req.params.id)));
  },

  deletePost(req, res) {
    if (!isNumeric(req.params.id))
      return res.status(400).json({ error: "Post id must be numeric" });
    const ok = postService.deletePost(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: "Post not found" });
    res.status(204).end();
  },

  // ---- Comments (nested under a post) ---------------------------------------
  listComments(req, res) {
    const post = postService.getPostByIdOrSlug(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post.comments);
  },

  createComment(req, res) {
    const key = req.params.id;
    const result = isNumeric(key)
      ? commentService.addCommentByPostId(Number(key), req.body)
      : commentService.addCommentByPostSlug(key, req.body); // may throw -> 400
    if (result.notFound) return res.status(404).json({ error: "Post not found" });
    res.status(201).json({ id: result.id, status: "pending" });
  },

  // ---- Comment moderation (admin) -------------------------------------------
  moderateComment(req, res) {
    commentService.setStatus(Number(req.params.id), req.body.status); // -> 400 on bad status
    res.json({ id: Number(req.params.id), status: req.body.status });
  },

  deleteComment(req, res) {
    commentService.delete(Number(req.params.id));
    res.status(204).end();
  },

  // ---- Categories & tags ----------------------------------------------------
  listCategories(req, res) {
    res.json(blogQueryService.getCategoriesWithCounts());
  },

  categoryPosts(req, res) {
    const result = postService.getPostsByCategory(req.params.slug);
    if (!result) return res.status(404).json({ error: "Category not found" });
    res.json(result);
  },

  listTags(req, res) {
    res.json(blogQueryService.getAllTags());
  },

  // ---- Contact --------------------------------------------------------------
  createContact(req, res) {
    const id = contactService.submit(req.body); // throws ValidationError -> 400
    res.status(201).json({ id });
  },

  // ---- 404 for unknown /api routes ------------------------------------------
  notFound(req, res) {
    res.status(404).json({ error: "Not found", path: req.originalUrl });
  },

  // ---- JSON error handler (mounted on the API router) -----------------------
  // eslint-disable-next-line no-unused-vars
  errorHandler(err, req, res, next) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: "Validation failed", fields: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  },
};

module.exports = apiController;
