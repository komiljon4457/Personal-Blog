// =============================================================================
// services/commentService.js — BUSINESS LOGIC for comments.
// New comments default to 'pending' (moderation); the admin approves/deletes.
// =============================================================================

const commentRepository = require("../repositories/commentRepository");
const postRepository = require("../repositories/postRepository");
const { ValidationError } = require("../lib/errors");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared validation + insert for a resolved post.
function createFor(post, input) {
  const errors = {};
  if (!input.name || input.name.trim().length < 2)
    errors.name = "Please enter your name.";
  if (!input.email || !EMAIL_RE.test(input.email))
    errors.email = "Please enter a valid email address.";
  if (!input.comment || input.comment.trim().length < 5)
    errors.comment = "Comment must be at least 5 characters.";
  if (Object.keys(errors).length) throw new ValidationError(errors);

  const id = commentRepository.insert({
    post_id: post.id,
    author_name: input.name.trim(),
    author_email: input.email.trim(),
    content: input.comment.trim(),
    status: "pending", // business rule: everything is moderated first
  });
  return { ok: true, id, post };
}

const commentService = {
  // Add a reader comment to a post identified by slug (used by SSR).
  addCommentByPostSlug(slug, input) {
    const post = postRepository.findBySlug(slug);
    if (!post) return { ok: false, notFound: true };
    return createFor(post, input);
  },

  // Add a reader comment to a post identified by id (used by the REST API).
  addCommentByPostId(postId, input) {
    const post = postRepository.findById(postId);
    if (!post) return { ok: false, notFound: true };
    return createFor(post, input);
  },

  getApprovedForPost(postId) {
    return commentRepository.findApprovedForPost(postId);
  },

  getPendingForModeration() {
    return commentRepository.findPendingWithPost();
  },

  approve(id) {
    commentRepository.setStatus(id, "approved");
  },

  setStatus(id, status) {
    if (!["pending", "approved", "spam"].includes(status)) {
      throw new ValidationError({ status: "Invalid comment status." });
    }
    commentRepository.setStatus(id, status);
  },

  delete(id) {
    commentRepository.remove(id);
  },
};

module.exports = commentService;
