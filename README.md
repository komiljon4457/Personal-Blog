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
curl http://localhost:3000/api/posts/welcome-to-my-blog   # one post by slug
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

---

## Client-Side Rendered view (Step 5)

A **CSR page** at `/explore` where the server sends only a shell and the **browser
fetches the data via AJAX** — from **both** the REST API and the GraphQL API, switchable
with a live toggle. Full write-up: [`docs/step-5-csr.md`](docs/step-5-csr.md).

- **Shell** — [`src/views/explore.ejs`](src/views/explore.ejs): header/footer + toolbar
  + empty `#app` root + `<script src="/js/csr.js">`.
- **Client script** — [`prototype/js/csr.js`](prototype/js/csr.js): vanilla JS (no
  framework, no build). Fetches the post list & detail, renders the DOM, does
  hash-based routing, and submits comments by AJAX.
- **Two backends, one UI** — a REST/GraphQL toggle re-fetches the same view from the
  other API; a `normalizePost()` helper folds `snake_case` (REST) and `camelCase`
  (GraphQL) into one shape so the render code is source-agnostic.
- **SSR vs CSR** — the rest of the site is server-rendered; this page is built in the
  browser. Open **http://localhost:3000/explore** and toggle the source.

The four rendering/data surfaces now sit over one core:

```
SSR pages (EJS)   ─┐
CSR view (/explore)├─▶ REST /api  ─┐
                   │               ├─▶ services ─▶ repositories ─▶ SQLite
                   └─▶ GraphQL ────┘
```

---

## Vue SPA (Step 6)

A standalone **Vue 3 single-page application** in [`spa/`](spa), built with **Vite**,
that consumes the same backend by **AJAX**. Full write-up:
[`docs/step-6-vue-spa.md`](docs/step-6-vue-spa.md).

- **Vite project** — dev server + HMR + production build with route code-splitting.
- **SFCs** — modularised into `components/` (reusable: `PostCard`, `CommentList`,
  `CommentForm`, `SiteHeader/Footer`) and `views/` (one per route).
- **Vue Router** — history-mode routing for `/`, `/posts/:slug`, `/category/:slug`,
  `/about`, and a 404; views are lazy-loaded.
- **AJAX** — all communication via a single [`services/api.js`](spa/src/services/api.js)
  (`fetch` → REST), with responses normalised to camelCase.
- **Dev proxy** — Vite forwards `/api`, `/graphql`, `/css`, `/assets` to the Express
  server (`:3000`), so requests stay same-origin and the SPA reuses the site's CSS.

```bash
npm start            # backend + API on :3000 (from the project root)
cd spa && npm install && npm run dev   # SPA on http://localhost:5173
```

---

## Production build — single port (Step 7)

For production the SPA is **built to static files and served by Express**, so
everything runs on **one port** (no separate Vite server). Full write-up:
[`docs/step-7-production.md`](docs/step-7-production.md).

- **`npm run build`** — minifies the CSS (Sass) and builds the SPA (`spa/dist`).
- **Express serves the SPA at `/app`** with a **history-mode fallback**, so deep
  links like `/app/posts/:slug` work on reload. Built under Vite `base: "/app/"`;
  routing uses `import.meta.env.BASE_URL`, so no code changes between dev and prod.
- **Same origin** — the built SPA loads the shared CSS from `/css` and calls `/api`
  directly (no proxy needed in production).

```bash
npm run build     # compile CSS + build the Vue SPA
npm start         # single server on http://localhost:3000
```

| One server, everything on `:3000` | |
| --- | --- |
| `/` | SSR site |
| `/explore` | CSR view (vanilla JS) |
| `/api/…` · `/graphql` | REST · GraphQL APIs |
| `/app` | built Vue SPA |

