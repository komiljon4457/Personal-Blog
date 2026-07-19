// =============================================================================
// routes/index.js — PUBLIC routes (readers)
// =============================================================================

const express = require("express");
const blog = require("../controllers/blogController");

const router = express.Router();

router.get("/", blog.home);
router.get("/about", blog.about);

router.get("/contact", blog.contactForm);
router.post("/contact", blog.submitContact);

router.get("/category/:slug", blog.category);

router.get("/posts/:slug", blog.post);
router.post("/posts/:slug/comments", blog.addComment);

module.exports = router;
