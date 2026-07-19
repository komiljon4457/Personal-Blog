// =============================================================================
// db/seed.js — populate the database with the prototype's sample content.
// Idempotent: wipes the content tables first, then re-inserts. Run with:
//   npm run db:seed
// =============================================================================

const db = require("./connection");
const migrate = require("./migrate");

const authors = [
  {
    name: "Admin",
    email: "admin@example.com",
    // Auth is stubbed in this step — this is a placeholder, not a real hash.
    password_hash: "stub$not-a-real-hash",
    bio: "The author behind My Blog — sharing short posts about tech, food, travel, and everyday life.",
    avatar_url: "/assets/author.svg",
  },
];

const categories = [
  { name: "Travel", slug: "travel", description: "Trips, places, and getting around." },
  { name: "Tech", slug: "tech", description: "Notes on building simple, useful software." },
  { name: "Food", slug: "food", description: "Easy recipes and kitchen ideas." },
  { name: "Life", slug: "life", description: "Everyday thoughts and updates." },
];

const tags = [
  "welcome", "general", "web", "tips", "minimalism",
  "recipes", "quick", "ideas", "getting-started",
].map((name) => ({ name, slug: name }));

// posts reference categories/tags by slug for readability
const posts = [
  {
    title: "Welcome to My Blog",
    slug: "welcome-to-my-blog",
    excerpt:
      "A quick introduction to this blog and what you can expect to find here.",
    content:
      "Welcome! This is the first post on My Blog. Here I'll share short articles across a few topics — from technology to food, travel, and everyday ideas.\n\nEvery post can have categories and tags, and readers can leave comments. Comments are moderated, so they appear once they've been approved.\n\nThanks for stopping by — take a look around.",
    status: "published",
    published_at: "2026-07-12 09:00:00",
    categories: ["life"],
    tags: ["welcome", "general"],
  },
  {
    title: "Building a simple website",
    slug: "building-a-simple-website",
    excerpt:
      "A few thoughts on keeping a personal website small, fast, and easy to maintain.",
    content:
      "A good website doesn't need heavy tooling. Semantic HTML, a little CSS, and a small backend go a long way.\n\nStart with the content and structure first, add styling next, and only reach for a framework once you actually need one. The result is a site that loads quickly and stays easy to understand.",
    status: "published",
    published_at: "2026-06-30 10:00:00",
    categories: ["tech"],
    tags: ["web", "tips", "minimalism"],
  },
  {
    title: "A quick and easy recipe",
    slug: "a-quick-and-easy-recipe",
    excerpt:
      "A no-fuss recipe you can put together on a busy weeknight.",
    content:
      "Some of the best meals come together in a single pot with whatever is already in the cupboard.\n\nCombine your base ingredients, season to taste, and let everything simmer until it's ready. Simple, warm, and satisfying — with very little washing up afterwards.",
    status: "published",
    published_at: "2026-06-18 18:00:00",
    categories: ["food"],
    tags: ["recipes", "quick"],
  },
  {
    title: "Ideas for upcoming posts",
    slug: "ideas-for-upcoming-posts",
    excerpt: "",
    content: "A work-in-progress draft listing a few topics to write about next.",
    status: "draft",
    published_at: null,
    categories: ["travel"],
    tags: ["ideas"],
  },
];

const comments = [
  {
    postSlug: "welcome-to-my-blog",
    author_name: "Sam",
    author_email: "sam@example.com",
    content: "Great to see the new blog up and running. Looking forward to more posts!",
    status: "approved",
    created_at: "2026-07-13 08:00:00",
  },
  {
    postSlug: "welcome-to-my-blog",
    author_name: "Jordan",
    author_email: "jordan@example.com",
    content: "Nice and clean design. Keep it up!",
    status: "approved",
    created_at: "2026-07-14 12:00:00",
  },
  {
    postSlug: "building-a-simple-website",
    author_name: "Alex",
    author_email: "alex@example.com",
    content: "Really useful — any tips for keeping CSS organised as a site grows?",
    status: "pending",
    created_at: "2026-07-01 09:30:00",
  },
];

function seed() {
  migrate(); // make sure the schema exists

  const wipe = db.transaction(() => {
    // order matters because of foreign keys
    db.exec(`
      DELETE FROM comments;
      DELETE FROM post_tags;
      DELETE FROM post_categories;
      DELETE FROM posts;
      DELETE FROM tags;
      DELETE FROM categories;
      DELETE FROM authors;
      DELETE FROM contact_messages;
      DELETE FROM sqlite_sequence;
    `);
  });

  const insert = db.transaction(() => {
    const authorIds = authors.map(
      (a) =>
        db
          .prepare(
            `INSERT INTO authors (name, email, password_hash, bio, avatar_url)
             VALUES (@name, @email, @password_hash, @bio, @avatar_url)`
          )
          .run(a).lastInsertRowid
    );

    const catId = {};
    for (const c of categories) {
      catId[c.slug] = db
        .prepare(
          `INSERT INTO categories (name, slug, description)
           VALUES (@name, @slug, @description)`
        )
        .run(c).lastInsertRowid;
    }

    const tagId = {};
    for (const t of tags) {
      tagId[t.slug] = db
        .prepare(`INSERT INTO tags (name, slug) VALUES (@name, @slug)`)
        .run(t).lastInsertRowid;
    }

    const postId = {};
    for (const p of posts) {
      postId[p.slug] = db
        .prepare(
          `INSERT INTO posts
             (author_id, title, slug, excerpt, content, status, published_at)
           VALUES (@author_id, @title, @slug, @excerpt, @content, @status, @published_at)`
        )
        .run({
          author_id: authorIds[0],
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: p.content,
          status: p.status,
          published_at: p.published_at,
        }).lastInsertRowid;

      for (const cslug of p.categories) {
        db.prepare(
          `INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)`
        ).run(postId[p.slug], catId[cslug]);
      }
      for (const tslug of p.tags) {
        db.prepare(
          `INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)`
        ).run(postId[p.slug], tagId[tslug]);
      }
    }

    for (const c of comments) {
      db.prepare(
        `INSERT INTO comments
           (post_id, author_name, author_email, content, status, created_at)
         VALUES (@post_id, @author_name, @author_email, @content, @status, @created_at)`
      ).run({
        post_id: postId[c.postSlug],
        author_name: c.author_name,
        author_email: c.author_email,
        content: c.content,
        status: c.status,
        created_at: c.created_at,
      });
    }
  });

  wipe();
  insert();

  console.log(
    `✓ Seeded: ${authors.length} author, ${categories.length} categories, ` +
      `${tags.length} tags, ${posts.length} posts, ${comments.length} comments.`
  );
}

if (require.main === module) {
  seed();
}

module.exports = seed;
