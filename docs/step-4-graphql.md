# Step 4 — GraphQL API

This step adds a **GraphQL endpoint** at `/graphql`, alongside the server-rendered
pages (Step 3) and the REST API (Step 3 addendum). It exposes **a subset** of the
app's functionality — the read queries plus two mutations — and, crucially, reuses
the **same service layer**, so every business rule behaves identically across SSR,
REST, and GraphQL.

- Library: [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) (`graphql-yoga` + `graphql`)
- Style: **schema-first** (SDL in [`schema.js`](../src/graphql/schema.js), resolvers in [`resolvers.js`](../src/graphql/resolvers.js))
- Playground: opening `/graphql` in a browser serves an interactive **GraphiQL** UI

```
                       ┌──────────────┐
SSR pages  ───────────▶│              │
REST /api  ───────────▶│  SERVICES    │──▶ repositories ──▶ SQLite
GraphQL /graphql ─────▶│ (business    │
                       │   logic)     │
                       └──────────────┘
```

---

## Why only "some" endpoints?

The task asks for GraphQL over **some** of the endpoints, which also plays to
GraphQL's strengths: a single query can fetch a post *with* its author, categories,
tags and comments in one round-trip (no over- or under-fetching). The endpoints most
worth exposing this way are the **reads**, plus a representative **mutation** of each
kind (create a comment, create a post). Full admin CRUD (update/delete) stays on REST.

---

## Files

```
src/graphql/
├── schema.js      # SDL type definitions (Post, Category, Tag, Comment, Author, Query, Mutation)
├── resolvers.js   # resolvers → call the same services; map snake_case rows → camelCase
└── index.js       # builds the Yoga middleware (schema + GraphiQL)
```

The Yoga middleware is mounted in [`app.js`](../src/app.js) **before** the body
parsers — Yoga parses its own request body, and letting `express.json()` run first
would consume the stream and hang the endpoint:

```js
app.use(yoga.graphqlEndpoint, yoga); // /graphql — before express.json()/urlencoded
```

---

## Schema

```graphql
type Query {
  posts(status: String): [Post!]!        # published by default; "all" or a status
  post(id: ID, slug: String): Post       # by numeric id OR slug
  categories: [Category!]!               # includes postCount
  postsByCategory(slug: String!): [Post!]!
  tags: [Tag!]!
}

type Mutation {
  addComment(postId: ID, slug: String, name: String!, email: String!, comment: String!): Comment
  createPost(input: PostInput!): Post
}

type Post {
  id: ID!  title: String!  slug: String!  excerpt: String  content: String!
  status: String!  publishedAt: String
  author: Author  categories: [Category!]!  tags: [Tag!]!
  comments: [Comment!]!  commentCount: Int!
}
```

**Field resolvers** map the database's `snake_case` columns to the schema's
`camelCase` fields (`published_at → publishedAt`, `author_name → authorName`) and
resolve relations lazily (a `Post`'s `comments`/`tags` are only fetched if the query
asks for them).

**Errors:** a domain `ValidationError` is converted to a GraphQL error with
`extensions.code = "BAD_USER_INPUT"` and an `extensions.fields` map — the same field
messages the REST API returns as JSON.

---

## Usage

Open **http://localhost:3000/graphql** in a browser for the GraphiQL playground, or
POST queries directly:

```bash
# a post with everything, in one request
curl -X POST http://localhost:3000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ post(slug:\"three-days-in-the-dolomites\") { title author { name } categories { name } tags { slug } comments { authorName content } } }"}'

# create a comment (mutation)
curl -X POST http://localhost:3000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"mutation { addComment(postId: 1, name: \"Sam\", email: \"s@example.com\", comment: \"Nice post!\") { id status } }"}'
```

Example query:

```graphql
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
}
```

---

## Verification performed

With the server running and the DB seeded:

- `GET /graphql` (browser) → `200 text/html` (GraphiQL loads).
- `posts` → 3 published, each with nested `author`, `categories`, `tags`,
  `commentCount`.
- `post(slug: …)` → returns the post with its **approved** comments (Marco, Lena).
- `categories` → names with `postCount`; `postsByCategory(slug:"travel")` and `tags`
  return the expected data.
- `addComment` → creates a **pending** comment and returns it.
- `createPost` → **reuses business rules**: slug auto-generated, `publishedAt` set,
  tags auto-created.
- `createPost` with invalid input → GraphQL error `BAD_USER_INPUT` with a `fields`
  map (`title`, `content`).
- SSR, REST, and GraphQL all serve from the **same running server**.
```
