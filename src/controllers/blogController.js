// =============================================================================
// controllers/blogController.js — PUBLIC (reader) request handlers.
// Controllers are thin: they read req, call a service, and render a view.
// =============================================================================

const postService = require("../services/postService");
const commentService = require("../services/commentService");
const contactService = require("../services/contactService");
const blogQueryService = require("../services/blogQueryService");
const { ValidationError } = require("../lib/errors");

const blogController = {
  home(req, res) {
    res.render("home", {
      title: "Home",
      posts: postService.getHomePosts(),
      sidebar: blogQueryService.getSidebar(),
    });
  },

  post(req, res) {
    const post = postService.getPostBySlug(req.params.slug);
    if (!post || post.status !== "published") {
      return res.status(404).render("404", { title: "Not found" });
    }
    res.render("post", {
      title: post.title,
      post,
      formErrors: {},
      formData: {},
      commentReceived: req.query.comment === "received",
    });
  },

  addComment(req, res) {
    try {
      const result = commentService.addCommentByPostSlug(req.params.slug, req.body);
      if (result.notFound) {
        return res.status(404).render("404", { title: "Not found" });
      }
      // PRG pattern: redirect after a successful POST.
      return res.redirect(`/posts/${req.params.slug}?comment=received#comments`);
    } catch (err) {
      if (err instanceof ValidationError) {
        const post = postService.getPostBySlug(req.params.slug);
        return res.status(400).render("post", {
          title: post.title,
          post,
          formErrors: err.errors,
          formData: req.body,
        });
      }
      throw err;
    }
  },

  category(req, res) {
    const result = postService.getPostsByCategory(req.params.slug);
    if (!result) return res.status(404).render("404", { title: "Not found" });
    res.render("category", {
      title: `Category: ${result.category.name}`,
      category: result.category,
      posts: result.posts,
      sidebar: blogQueryService.getSidebar(),
    });
  },

  about(req, res) {
    res.render("about", { title: "About" });
  },

  // Client-side rendered view: serves only a shell; data is fetched via AJAX
  // (REST + GraphQL) by /js/csr.js in the browser.
  explore(req, res) {
    res.render("explore", { title: "Explore (CSR)" });
  },

  contactForm(req, res) {
    res.render("contact", {
      title: "Contact",
      formErrors: {},
      formData: {},
      sent: false,
    });
  },

  submitContact(req, res) {
    try {
      contactService.submit(req.body);
      res.render("contact", {
        title: "Contact",
        formErrors: {},
        formData: {},
        sent: true,
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        return res.status(400).render("contact", {
          title: "Contact",
          formErrors: err.errors,
          formData: req.body,
          sent: false,
        });
      }
      throw err;
    }
  },
};

module.exports = blogController;
