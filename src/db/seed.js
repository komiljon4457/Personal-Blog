// =============================================================================
// db/seed.js — populate the database with the prototype's sample content.
// Idempotent: wipes the content tables first, then re-inserts. Run with:
//   npm run db:seed
// =============================================================================

const db = require("./connection");
const migrate = require("./migrate");

const authors = [
  {
    name: "Anna Weber",
    email: "anna@example.com",
    // Auth is stubbed in this step — this is a placeholder, not a real hash.
    password_hash: "stub$not-a-real-hash",
    bio: "A software developer based in Berlin who spends far too much of her free time in the mountains.",
    avatar_url: "/assets/author.svg",
  },
];

const categories = [
  { name: "Travel", slug: "travel", description: "Slow, car-free journeys across Europe." },
  { name: "Tech", slug: "tech", description: "Notes on building simple, durable software." },
  { name: "Food", slug: "food", description: "The recipes I actually cook on weeknights." },
  { name: "Life", slug: "life", description: "Everything that doesn't fit the other boxes." },
];

const tags = [
  "hiking", "italy", "slow-travel", "webdev", "minimalism",
  "recipes", "vegetarian", "trains", "berlin",
].map((name) => ({ name, slug: name }));

// posts reference categories/tags by slug for readability
const posts = [
  {
    title: "Three days in the Dolomites without a car",
    slug: "three-days-in-the-dolomites",
    excerpt:
      "How I planned a three-day hut-to-hut route using only buses, cable cars, and my own two feet.",
    content:
      "Public transport in the Italian Alps is better than its reputation. Over a long weekend I linked together three mountain huts using nothing but regional buses, a cable car, and my own two feet — and never once wished for a car.\n\nDay one: from Dobbiaco station the 445 bus runs hourly up to the Auronzo hut. Day two was the long traverse. What I'd do differently: book the huts earlier.",
    status: "published",
    published_at: "2026-07-12 09:00:00",
    categories: ["travel"],
    tags: ["hiking", "italy", "slow-travel"],
  },
  {
    title: "Why I moved my blog to plain HTML and CSS",
    slug: "plain-html-and-css",
    excerpt:
      "After years of heavyweight tooling, I stripped my site back to semantic HTML and a single stylesheet.",
    content:
      "After years of wrestling with heavyweight tooling, I stripped my site back to semantic HTML and a single stylesheet. It loads instantly and I actually understand every line again.",
    status: "published",
    published_at: "2026-06-30 10:00:00",
    categories: ["tech"],
    tags: ["webdev", "minimalism"],
  },
  {
    title: "A slow-cooked lentil stew for grey days",
    slug: "lentil-stew",
    excerpt:
      "Comfort in a bowl — the one-pot recipe I come back to whenever the weather turns.",
    content:
      "Comfort in a bowl. This is the one-pot recipe I come back to whenever the weather turns and I want the kitchen to smell like home.",
    status: "published",
    published_at: "2026-06-18 18:00:00",
    categories: ["food"],
    tags: ["recipes", "vegetarian"],
  },
  {
    title: "Notes on the Berlin S-Bahn (untitled)",
    slug: "berlin-s-bahn-notes",
    excerpt: "",
    content: "A work-in-progress draft about getting around Berlin by rail.",
    status: "draft",
    published_at: null,
    categories: ["travel"],
    tags: ["berlin", "trains"],
  },
];

const comments = [
  {
    postSlug: "three-days-in-the-dolomites",
    author_name: "Marco",
    author_email: "marco@example.com",
    content: "Great write-up! Which app did you use to check the bus times?",
    status: "approved",
    created_at: "2026-07-13 08:00:00",
  },
  {
    postSlug: "three-days-in-the-dolomites",
    author_name: "Lena",
    author_email: "lena@example.com",
    content: "Doing this exact route next month — thanks for the hut-booking tip!",
    status: "approved",
    created_at: "2026-07-14 12:00:00",
  },
  {
    postSlug: "plain-html-and-css",
    author_name: "Sam",
    author_email: "sam@example.com",
    content: "Refreshing to read. Any tips for keeping CSS organised at scale?",
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
