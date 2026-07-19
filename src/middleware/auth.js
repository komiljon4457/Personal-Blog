// =============================================================================
// middleware/auth.js — STUB authentication.
//
// Auth is intentionally not implemented in this step (see README roadmap).
// `requireAuth` is a pass-through so the admin routes are reachable and the CRUD
// can be demonstrated. When real auth lands, this is the single place to enforce
// it (check req.session.authorId and redirect to /login when missing).
// =============================================================================

function requireAuth(req, res, next) {
  // TODO (later step): if (!req.session?.authorId) return res.redirect("/login");
  return next();
}

module.exports = { requireAuth };
