// =============================================================================
// services/blogQueryService.js — shared read helpers (sidebar, dashboard stats)
// =============================================================================

const categoryRepository = require("../repositories/categoryRepository");
const tagRepository = require("../repositories/tagRepository");
const postRepository = require("../repositories/postRepository");
const commentRepository = require("../repositories/commentRepository");

const blogQueryService = {
  // Data for the sidebar shown on public listing pages.
  getSidebar() {
    return {
      categories: categoryRepository.findAllWithCounts(),
      tags: tagRepository.findAll().slice(0, 8),
    };
  },

  getCategories() {
    return categoryRepository.findAll();
  },

  getCategoriesWithCounts() {
    return categoryRepository.findAllWithCounts();
  },

  getAllTags() {
    return tagRepository.findAll();
  },

  // Summary numbers for the admin dashboard header.
  getDashboardStats() {
    const byStatus = postRepository.countByStatus();
    return {
      published: byStatus.published || 0,
      draft: byStatus.draft || 0,
      archived: byStatus.archived || 0,
      pendingComments: commentRepository.countPending(),
    };
  },
};

module.exports = blogQueryService;
