// =============================================================================
// routes/admin.js — AUTHOR/ADMIN routes.
// All admin routes are guarded by requireAuth (currently a stub).
// HTML forms only support GET/POST, so mutations use POST with explicit paths
// (…/delete, …/approve) rather than PUT/DELETE.
// =============================================================================

const express = require("express");
const admin = require("../controllers/adminController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Auth (stub)
router.get("/login", admin.loginForm);
router.post("/login", admin.login);

// Everything below requires auth (pass-through for now)
router.get("/admin", requireAuth, admin.dashboard);

router.get("/admin/posts/new", requireAuth, admin.newPostForm);
router.post("/admin/posts", requireAuth, admin.createPost);
router.get("/admin/posts/:id/edit", requireAuth, admin.editPostForm);
router.post("/admin/posts/:id", requireAuth, admin.updatePost);
router.post("/admin/posts/:id/delete", requireAuth, admin.deletePost);

router.post("/admin/comments/:id/approve", requireAuth, admin.approveComment);
router.post("/admin/comments/:id/delete", requireAuth, admin.deleteComment);

module.exports = router;
