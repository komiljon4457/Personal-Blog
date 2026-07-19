// =============================================================================
// graphql/index.js — build the GraphQL Yoga middleware for the /graphql endpoint.
// Yoga also serves an interactive GraphiQL playground when opened in a browser.
// =============================================================================

const { createYoga, createSchema } = require("graphql-yoga");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/graphql",
  graphiql: {
    title: "Personal Blog — GraphQL",
    defaultQuery: `# Try me:
query LatestPosts {
  posts {
    title
    slug
    publishedAt
    author { name }
    categories { name }
    tags { slug }
    commentCount
  }
}`,
  },
});

module.exports = yoga;
