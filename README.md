# Personal Blog

A personal blogging platform where a single author can publish articles, organise
them by category and tag, and let readers respond through comments. 

---

## Table of Contents

- [Purpose & Benefits](#purpose--benefits)
- [Problem It Solves](#problem-it-solves)
- [Target Group](#target-group)
- [Functionalities](#functionalities)
- [Domain Model (UML)](#domain-model-uml)

---

## Purpose & Benefits

The **Personal Blog** gives an individual author a self-owned space to publish
writing on the web without depending on a third-party platform (Medium, Substack,
social networks). It is intentionally small, fast, and fully under the author's
control.

**Benefits:**

- **Ownership** — content and presentation belong to the author, not a platform.
- **Simplicity** — a clean reading experience with no ads, trackers, or clutter.
- **Structure** — posts are organised by categories and tags so readers can browse
  by topic.
- **Engagement** — readers can leave comments and reach the author via a contact form.
- **Accessibility & SEO** — a strictly semantic HTML structure improves screen-reader
  support and search-engine indexing.

## Problem It Solves

Writers who want an online presence face a trade-off:

- **Social platforms** own the audience, inject ads, and can change the rules or
  disappear at any time.
- **Full CMS systems** (e.g. WordPress) are powerful but heavy, need maintenance,
  and are overkill for one person.

This project solves that gap by offering a **lightweight, author-owned blog** that is
easy to run, easy to read, and easy to extend — while remaining standards-based
(semantic HTML, external CSS, progressive enhancement).

## Target Group

| Group | Need |
| --- | --- |
| **Primary — The Author** | A single writer (hobbyist, developer, freelancer, student) who wants to publish and manage articles. |
| **Secondary — Readers** | Visitors who read articles, browse by category/tag, and leave comments. |
| **Tertiary — Contacts** | People who want to reach the author (collaboration, feedback) via the contact form. |

## Functionalities

### Public (Readers)
- Browse a **home page** with a list of the latest posts (title, excerpt, meta).
- Read a **single post** with full content, author, publish date, categories and tags.
- Filter posts by **category** and by **tag**.
- Read and submit **comments** on a post.
- View an **About** page.
- Send a message through the **Contact** form (client-side validated).

### Author / Admin (authenticated)
- **Log in** to a private area.
- View an **admin dashboard** listing all posts with their status (published/draft).
- **Create, edit, and delete** posts (title, content, categories, tags, status).
- **Moderate comments** (approve / delete).

> Authentication and persistence are conceptual in this step — the prototype
> demonstrates the screens and flows, not a live backend.

---

## Domain Model (UML)

The full UML class diagram and an entity description live in
[`docs/domain-model.md`](docs/domain-model.md).

**Core entities:** `Author`, `Post`, `Category`, `Tag`, `Comment`.

```
Author 1 ──── * Post
Post   * ──── * Category
Post   * ──── * Tag
Post   1 ──── * Comment
```

---

## Styling & Build (Step 2)

- **Sass (whole prototype)** — modular `scss/` sources (variables, mixins, partials)
  compile to the two `prototype/css/*.css` files the pages link. Uses Sass
  **variables** (colours, spacing/breakpoint maps), **modularization** (abstracts /
  base / components / layout partials) and **mixins** (`card`, `respond-to`,
  `button-variant`, `form-control`, …).
- **BEM (admin branch)** — `login.html`, `admin.html`, `post-editor.html` are written
  with `block__element--modifier` classes (`auth`, `dashboard`, `admin-table`,
  `post-form`, …) styled in [`scss/components/_admin.scss`](scss/components/_admin.scss).

---

## Backend: Persistence & Business Logic (Step 3)

The static prototype is now a running **Node.js** app: pages are **server-rendered**
from a **SQLite** database, forms persist, and the admin area does real CRUD. It also
exposes a **REST API** (JSON) alongside the rendered pages. Full write-up:
[`docs/step-3-backend.md`](docs/step-3-backend.md).

- **Stack** — Express 5 + EJS (server-side rendering) + SQLite via `better-sqlite3`.
- **Layered architecture** — `routes → controllers → services (business logic) →
  repositories (persistence) → SQLite`. Each layer has one responsibility.
- **Two surfaces, one core** — server-rendered HTML pages **and** a JSON REST API
  under `/api` both call the **same services**, so business rules behave identically.
- **Business logic** — slug generation & uniqueness, publish timestamps, tag
  auto-creation, comment **moderation** (pending → approved), transactional saves,
  and server-side validation (complements the Step 1 client-side HTML validation).
- **REST API** — `GET/POST/PUT/DELETE /api/posts`, `…/comments`, `PATCH
  /api/comments/:id`, `/api/categories`, `/api/tags`, `POST /api/contact`, with
  proper status codes (`201`, `204`, `400`, `404`).
- **Auth** — stubbed for this step (`requireAuth` is a pass-through; `/login` enters
  the admin area). The single place to enforce real auth later.

```bash
curl http://localhost:3000/api/posts                 # list published posts (JSON)
curl http://localhost:3000/api/posts/three-days-in-the-dolomites   # one post by slug
```

```bash
npm install        # express, ejs, better-sqlite3 (+ sass from Step 2)
npm run db:seed    # create tables + load sample content into data/blog.db
npm start          # run the app → http://localhost:3000
npm run dev        # auto-restart on changes
```

### Project structure (backend)

```
src/
├── server.js · app.js          # entry + Express config (view engine, static, helpers)
├── db/        schema.sql · connection.js · migrate.js · seed.js
├── repositories/               # persistence (SQL only)
├── services/                   # business logic (rules, validation, transactions)
├── controllers/                # thin handlers: blog (public) · admin · api (JSON)
├── middleware/auth.js          # requireAuth (stub)
├── routes/    index.js · admin.js · api.js
├── lib/       slugify.js · errors.js
└── views/     EJS templates + partials (reuse the Step 2 CSS)
```

> The prototype's compiled CSS (`prototype/css/`) is reused by the app, served at
> `/css`. The SQLite file `data/blog.db` is generated and git-ignored.

---

## GraphQL API (Step 4)

A **GraphQL endpoint** at `/graphql` now runs alongside the SSR pages and the REST
API — a **third surface over the same service layer**. Full write-up:
[`docs/step-4-graphql.md`](docs/step-4-graphql.md).

- **Library** — [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server), schema-first
  (SDL in [`src/graphql/schema.js`](src/graphql/schema.js), resolvers in
  [`src/graphql/resolvers.js`](src/graphql/resolvers.js)).
- **Queries** — `posts(status)`, `post(id | slug)`, `categories`,
  `postsByCategory(slug)`, `tags` — a single query can fetch a post *with* its author,
  categories, tags and comments in one round-trip.
- **Mutations** — `addComment` and `createPost` (reuse the same slug/publish/validation
  rules; `ValidationError` → GraphQL `BAD_USER_INPUT` with a `fields` map).
- **Playground** — open `/graphql` in a browser for the interactive **GraphiQL** UI.

```bash
# open the playground
open http://localhost:3000/graphql

# or query directly
curl -X POST http://localhost:3000/graphql -H 'content-type: application/json' \
  -d '{"query":"{ posts { title author { name } commentCount } }"}'
```

