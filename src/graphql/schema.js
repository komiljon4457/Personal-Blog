// =============================================================================
// graphql/schema.js — GraphQL type definitions (SDL, schema-first).
// Exposes a subset of the app's functionality over a single /graphql endpoint.
// =============================================================================

const typeDefs = /* GraphQL */ `
  type Author {
    id: ID!
    name: String!
    bio: String
    avatarUrl: String
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    postCount: Int
  }

  type Tag {
    id: ID!
    name: String!
    slug: String!
  }

  type Comment {
    id: ID!
    authorName: String!
    content: String!
    status: String!
    createdAt: String!
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    excerpt: String
    content: String!
    status: String!
    publishedAt: String
    author: Author
    categories: [Category!]!
    tags: [Tag!]!
    comments: [Comment!]!
    commentCount: Int!
  }

  type Query {
    "Published posts by default; pass status: \\"all\\" or a specific status."
    posts(status: String): [Post!]!
    "A single post by numeric id OR slug (supply one)."
    post(id: ID, slug: String): Post
    categories: [Category!]!
    postsByCategory(slug: String!): [Post!]!
    tags: [Tag!]!
  }

  input PostInput {
    title: String!
    slug: String
    excerpt: String
    content: String!
    status: String
    category: ID
    tags: String
    publishDate: String
  }

  type Mutation {
    "Add a reader comment (created as 'pending'). Supply postId OR slug."
    addComment(
      postId: ID
      slug: String
      name: String!
      email: String!
      comment: String!
    ): Comment
    "Create a post (admin; auth stubbed). Reuses the same business rules as REST/SSR."
    createPost(input: PostInput!): Post
  }
`;

module.exports = typeDefs;
