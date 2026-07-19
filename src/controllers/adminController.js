// =============================================================================
// controllers/adminController.js — AUTHOR/ADMIN request handlers (BEM branch).
// Auth is stubbed (see middleware/auth.js); these focus on posts & comment CRUD.
// =============================================================================

const postService = require("../services/postService");
const commentService = require("../services/commentService");
const blogQueryService = require("../services/blogQueryService");
const { ValidationError } = require("../lib/errors");

const adminController = {
  // ---- auth (stub) ----------------------------------------------------------
  loginForm(req, res) {
    res.render("login", { title: "Author login" });
  },

  login(req, res) {
    // STUB: no credential check yet — just enter the admin area.
    res.redirect("/admin");
  },

  // ---- dashboard ------------------------------------------------------------
  dashboard(req, res) {
    res.render("admin/dashboard", {
      title: "Dashboard",
      stats: blogQueryService.getDashboardStats(),
      posts: postService.getAllForAdmin(),
      pendingComments: commentService.getPendingForModeration(),
    });
  },

  // ---- create ---------------------------------------------------------------
  newPostForm(req, res) {
    res.render("admin/post-form", {
      title: "New post",
      mode: "create",
      action: "/admin/posts",
      post: { status: "draft", categoryIds: [], tagsCsv: "" },
      categories: blogQueryService.getCategories(),
      formErrors: {},
    });
  },

  createPost(req, res) {
    try {
      postService.createPost(req.body);
      res.redirect("/admin");
    } catch (err) {
      if (err instanceof ValidationError) {
        return res.status(400).render("admin/post-form", {
          title: "New post",
          mode: "create",
          action: "/admin/posts",
          post: normalizeBack(req.body),
          categories: blogQueryService.getCategories(),
          formErrors: err.errors,
        });
      }
      throw err;
    }
  },

  // ---- edit -----------------------------------------------------------------
  editPostForm(req, res) {
    const post = postService.getForEdit(Number(req.params.id));
    if (!post) return res.status(404).render("404", { title: "Not found" });
    res.render("admin/post-form", {
      title: "Edit post",
      mode: "edit",
      action: `/admin/posts/${post.id}`,
      post,
      categories: blogQueryService.getCategories(),
      formErrors: {},
    });
  },

  updatePost(req, res) {
    const id = Number(req.params.id);
    try {
      const result = postService.updatePost(id, req.body);
      if (result === null) return res.status(404).render("404", { title: "Not found" });
      res.redirect("/admin");
    } catch (err) {
      if (err instanceof ValidationError) {
        return res.status(400).render("admin/post-form", {
          title: "Edit post",
          mode: "edit",
          action: `/admin/posts/${id}`,
          post: { id, ...normalizeBack(req.body) },
          categories: blogQueryService.getCategories(),
          formErrors: err.errors,
        });
      }
      throw err;
    }
  },

  deletePost(req, res) {
    postService.deletePost(Number(req.params.id));
    res.redirect("/admin");
  },

  // ---- comment moderation ---------------------------------------------------
  approveComment(req, res) {
    commentService.approve(Number(req.params.id));
    res.redirect("/admin#comments");
  },

  deleteComment(req, res) {
    commentService.delete(Number(req.params.id));
    res.redirect("/admin#comments");
  },
};

// Re-shape submitted form data so the template can re-render it after an error.
function normalizeBack(body) {
  return {
    title: body.title || "",
    slug: body.slug || "",
    excerpt: body.excerpt || "",
    content: body.content || body.body || "",
    status: body.status || "draft",
    categoryIds: body.category ? [Number(body.category)] : [],
    tagsCsv: body.tags || "",
  };
}

module.exports = adminController;
