// =============================================================================
// routes/api.js — REST API (JSON). Mounted at /api.
//
// Unlike the HTML form routes, API clients CAN send PUT/DELETE, so this uses the
// full set of REST verbs. Admin write endpoints go through requireAuth (stub).
// =============================================================================

const express = require("express");
const api = require("../controllers/apiController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ---- Posts ------------------------------------------------------------------
router.get("/posts", api.listPosts);
router.post("/posts", requireAuth, api.createPost);
router.get("/posts/:id", api.getPost); // :id = numeric id or slug
router.put("/posts/:id", requireAuth, api.updatePost);
router.delete("/posts/:id", requireAuth, api.deletePost);

// ---- Comments (nested under a post) -----------------------------------------
router.get("/posts/:id/comments", api.listComments);
router.post("/posts/:id/comments", api.createComment);

// ---- Comment moderation (admin) ---------------------------------------------
router.patch("/comments/:id", requireAuth, api.moderateComment);
router.delete("/comments/:id", requireAuth, api.deleteComment);

// ---- Categories & tags ------------------------------------------------------
router.get("/categories", api.listCategories);
router.get("/categories/:slug/posts", api.categoryPosts);
router.get("/tags", api.listTags);

// ---- Contact ----------------------------------------------------------------
router.post("/contact", api.createContact);

// ---- Fallbacks --------------------------------------------------------------
router.use(api.notFound); // unknown /api/* -> JSON 404
router.use(api.errorHandler); // ValidationError -> 400, else 500 (JSON)

module.exports = router;
