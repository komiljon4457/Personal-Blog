// =============================================================================
// graphql/resolvers.js — resolvers wire the schema to the SAME service layer
// used by SSR and REST. Field resolvers map snake_case rows to camelCase fields
// and resolve relations (author, categories, tags, comments) lazily.
// =============================================================================

const { GraphQLError } = require("graphql");

const postService = require("../services/postService");
const commentService = require("../services/commentService");
const blogQueryService = require("../services/blogQueryService");
const postRepository = require("../repositories/postRepository");
const commentRepository = require("../repositories/commentRepository");
const authorRepository = require("../repositories/authorRepository");
const { ValidationError } = require("../lib/errors");

// Convert a domain ValidationError into a GraphQL error with field details.
function asGraphQLError(err) {
  if (err instanceof ValidationError) {
    return new GraphQLError("Validation failed", {
      extensions: { code: "BAD_USER_INPUT", fields: err.errors },
    });
  }
  return err;
}

const resolvers = {
  Query: {
    posts: (_p, { status }) => postService.listPosts(status || "published"),
    post: (_p, { id, slug }) => {
      const key = id ?? slug;
      if (key === undefined || key === null)
        throw new GraphQLError("Provide either id or slug.");
      return postService.getPostByIdOrSlug(key);
    },
    categories: () => blogQueryService.getCategoriesWithCounts(),
    postsByCategory: (_p, { slug }) => {
      const result = postService.getPostsByCategory(slug);
      return result ? result.posts : [];
    },
    tags: () => blogQueryService.getAllTags(),
  },

  Mutation: {
    addComment: (_p, { postId, slug, name, email, comment }) => {
      try {
        let result;
        if (postId != null)
          result = commentService.addCommentByPostId(Number(postId), { name, email, comment });
        else if (slug != null)
          result = commentService.addCommentByPostSlug(slug, { name, email, comment });
        else throw new GraphQLError("Provide either postId or slug.");

        if (result.notFound) throw new GraphQLError("Post not found.");
        return commentRepository.findById(result.id);
      } catch (err) {
        throw asGraphQLError(err);
      }
    },

    createPost: (_p, { input }) => {
      try {
        const id = postService.createPost(input); // reuses all business rules
        return postService.getPostByIdOrSlug(id);
      } catch (err) {
        throw asGraphQLError(err);
      }
    },
  },

  // ---- Field resolvers: map row columns → schema fields, resolve relations ---
  Post: {
    publishedAt: (p) => p.published_at,
    author: (p) => p.author || authorRepository.findById(p.author_id),
    categories: (p) => p.categories || postRepository.getCategories(p.id),
    tags: (p) => p.tags || postRepository.getTags(p.id),
    comments: (p) => p.comments || commentRepository.findApprovedForPost(p.id),
    commentCount: (p) =>
      p.commentCount != null ? p.commentCount : commentRepository.countApprovedForPost(p.id),
  },

  Author: {
    avatarUrl: (a) => a.avatar_url,
  },

  Category: {
    postCount: (c) => (c.post_count != null ? c.post_count : null),
  },

  Comment: {
    authorName: (c) => c.author_name,
    createdAt: (c) => c.created_at,
  },
};

module.exports = resolvers;
