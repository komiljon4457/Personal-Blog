# Step 3 — Persistence & Business Logic (Node.js)

This step turns the static click prototype into a **running web application** with a
**SQLite database** and a **layered Node.js backend**. Pages are now rendered on the
server (EJS) from live data, forms actually persist, and the admin area performs real
CRUD. Authentication is intentionally **stubbed** for this step.

- **Runtime:** Node.js + [Express 5](https://expressjs.com/)
- **Rendering:** server-side, [EJS](https://ejs.co/) templates (reuse the Step 1/2 HTML & CSS)
- **Database:** [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Architecture:** Controller → Service (business logic) → Repository (persistence) → DB

---

## Layered architecture

The core idea: each layer has **one responsibility** and only talks to the layer
directly below it. This keeps business rules out of the database code and out of the
HTTP code.

```
HTTP request
   │
   ▼
┌───────────────┐   routes/         maps URLs + HTTP verbs to a controller method
│    Routes     │   (index.js, admin.js)
└──────┬────────┘
       ▼
┌───────────────┐   controllers/    thin: read req, call a service, render a view
│  Controllers  │   (blogController, adminController)
└──────┬────────┘
       ▼
┌───────────────┐   services/       BUSINESS LOGIC: validation, slug rules, publish
│   Services    │   timestamps, moderation workflow, transactions
└──────┬────────┘
       ▼
┌───────────────┐   repositories/   PERSISTENCE: SQL only, returns/writes rows
│ Repositories  │   (postRepository, commentRepository, …)
└──────┬────────┘
       ▼
┌───────────────┐   db/connection   a single better-sqlite3 handle
│   SQLite DB   │   data/blog.db
└───────────────┘
```

**Why layer it?** You can change the SQL (repository) without touching business
rules; you can change a rule (service) without touching HTTP; and you can change a
URL or template (controller/route) without touching either. Each layer is testable on
its own.

### Folder map

```
src/
├── server.js               → boots the HTTP server
├── app.js                  → Express config: EJS, static /css & /assets, view helpers, routes
├── db/
│   ├── connection.js       → the shared SQLite connection (WAL + foreign keys on)
│   ├── schema.sql          → DDL for every table
│   ├── migrate.js          → applies schema.sql          (npm run db:migrate)
│   └── seed.js             → inserts the sample content   (npm run db:seed)
├── repositories/           → PERSISTENCE (one file per aggregate)
│   ├── postRepository.js   authorRepository.js  categoryRepository.js
│   ├── tagRepository.js    commentRepository.js contactRepository.js
├── services/               → BUSINESS LOGIC
│   ├── postService.js      commentService.js
│   ├── contactService.js   blogQueryService.js
├── controllers/
│   ├── blogController.js    (public)   adminController.js (admin)
├── middleware/
│   └── auth.js             → requireAuth (STUB — pass-through for now)
├── routes/
│   ├── index.js            (public)   admin.js (admin)
├── lib/
│   ├── slugify.js          errors.js  (ValidationError)
└── views/                  → EJS templates + partials (reuse the BEM/public CSS)
```

---

## The persistence layer (SQLite)

The schema in [`src/db/schema.sql`](../src/db/schema.sql) mirrors the
[domain model](domain-model.md) exactly:

- `authors`, `posts`, `categories`, `tags`, `comments`
- join tables `post_categories` and `post_tags` for the two **many-to-many**
  relationships
- `contact_messages` — an operational table backing the contact form
- `CHECK` constraints enforce the enums (`posts.status`, `comments.status`);
  `FOREIGN KEY … ON DELETE CASCADE` means deleting a post removes its comments and
  taxonomy links automatically.

Repositories contain **only SQL** — for example `postRepository.findBySlug()` or
`commentRepository.findApprovedForPost()`. They never make decisions; they read and
write rows.

### Setup / commands

```bash
npm install          # installs express, ejs, better-sqlite3 (+ sass from Step 2)
npm run db:migrate   # create tables (idempotent)
npm run db:seed      # reset + load the sample content
npm start            # run the server → http://localhost:3000
npm run dev          # same, with auto-restart on file changes
```

The database file is created at `data/blog.db` on first run (git-ignored).

---

## The business-logic layer (services)

This is where the **rules** live. Highlights:

| Rule | Where |
| --- | --- |
| A post's **slug** is generated from its title if omitted, and made **unique** (`-2`, `-3`, …). | `postService.uniqueSlug` |
| Moving a post to **published** stamps `published_at` (once). | `postService.createPost` / `updatePost` |
| Saving a post writes the row **and** its category/tag links in **one transaction**. | `postService` (`db.transaction`) |
| Tags typed as `"hiking, italy"` are split, slugified, and **created on demand**. | `postService.resolveTagIds` + `tagRepository.findOrCreate` |
| New comments default to **pending** and are hidden until the author **approves** them. | `commentService.addCommentByPostSlug` |
| Every form is **server-validated**; failures throw `ValidationError` and re-render the form with messages (HTTP 400) instead of crashing. | all services + `lib/errors.js` |

Server-side validation complements the Step 1 **client-side** HTML validation — the
browser catches obvious mistakes early; the server is the authority and never trusts
the client.

---

## Request handling (controllers, routes, views)

- **Routes** ([`routes/`](../src/routes)) map URL + verb to a controller method.
  Because HTML forms only support `GET`/`POST`, mutations use `POST` with explicit
  paths (`/admin/posts/:id/delete`, `/admin/comments/:id/approve`).
- **Controllers** stay thin: parse `req`, call a service, render a view or redirect.
  Successful POSTs use the **Post/Redirect/Get** pattern to avoid duplicate submits.
- **Views** ([`views/`](../src/views)) are EJS derived from the prototype's semantic
  HTML. They reuse the **same compiled CSS** from Step 2 (served at `/css`), so the
  BEM admin branch and the public branch look identical to the prototype — now driven
  by real data.

### Routes at a glance

| Method & path | Purpose |
| --- | --- |
| `GET /` | Home — latest published posts |
| `GET /posts/:slug` | Single post + approved comments |
| `POST /posts/:slug/comments` | Submit a comment (→ pending) |
| `GET /category/:slug` | Posts in a category |
| `GET /about` · `GET /contact` · `POST /contact` | About page · contact form · submit |
| `GET /login` · `POST /login` | Auth (stub — POST just enters the admin area) |
| `GET /admin` | Dashboard: posts + pending comments |
| `GET /admin/posts/new` · `POST /admin/posts` | Create a post |
| `GET /admin/posts/:id/edit` · `POST /admin/posts/:id` | Edit a post |
| `POST /admin/posts/:id/delete` | Delete a post (cascades) |
| `POST /admin/comments/:id/approve` · `…/delete` | Moderate comments |

---

## Authentication — stubbed (by design)

`middleware/auth.js` exports `requireAuth`, which currently just calls `next()`. All
admin routes already pass through it, so when real auth is added later it is the
**single** place to enforce it (check a session, redirect to `/login`). The login
form posts to `/login`, which today simply redirects to `/admin`.

---

## REST API (JSON) — added alongside SSR

The app now also exposes a **REST API** under `/api`, in addition to the
server-rendered pages. Both surfaces call the **same service layer**, so every
business rule (slug generation, publish timestamps, moderation, validation) behaves
identically — only the representation differs (JSON vs HTML).

- Controller: [`controllers/apiController.js`](../src/controllers/apiController.js) — JSON in / JSON out.
- Routes: [`routes/api.js`](../src/routes/api.js), mounted at `/api`.
- JSON body parsing (`express.json()`) and a **JSON error handler** on the API router
  translate `ValidationError → 400 { error, fields }` and anything else → `500`.
- Because API clients (unlike HTML forms) can send any verb, the API uses the full
  REST verb set: `GET` / `POST` / `PUT` / `PATCH` / `DELETE`, with proper status
  codes (`201 Created`, `204 No Content`, `400`, `404`).

### Endpoints

| Method & path | Purpose | Success |
| --- | --- | --- |
| `GET /api/posts` | List posts (`?status=published\|all\|draft…`) | `200` |
| `POST /api/posts` | Create a post | `201` + resource |
| `GET /api/posts/:id` | One post (`:id` = numeric id **or** slug) + taxonomy + comments | `200` |
| `PUT /api/posts/:id` | Update a post | `200` |
| `DELETE /api/posts/:id` | Delete a post (cascades) | `204` |
| `GET /api/posts/:id/comments` | Approved comments for a post | `200` |
| `POST /api/posts/:id/comments` | Add a comment (→ pending) | `201` |
| `PATCH /api/comments/:id` | Moderate (`{ "status": "approved" }`) | `200` |
| `DELETE /api/comments/:id` | Delete a comment | `204` |
| `GET /api/categories` | Categories with published-post counts | `200` |
| `GET /api/categories/:slug/posts` | `{ category, posts }` | `200` |
| `GET /api/tags` | All tags | `200` |
| `POST /api/contact` | Submit a contact message | `201` |

Admin write endpoints (`POST/PUT/DELETE /api/posts`, comment moderation) pass through
`requireAuth` — the same stub as the SSR admin routes.

### Examples

```bash
# list published posts
curl http://localhost:3000/api/posts

# create a post
curl -X POST http://localhost:3000/api/posts \
  -H 'content-type: application/json' \
  -d '{"title":"Hello API","content":"A body longer than twenty characters.","status":"published","category":2,"tags":"api, rest"}'

# validation failure -> 400 with field messages
curl -i -X POST http://localhost:3000/api/posts \
  -H 'content-type: application/json' -d '{"title":"no"}'

# moderate a comment
curl -X PATCH http://localhost:3000/api/comments/4 \
  -H 'content-type: application/json' -d '{"status":"approved"}'
```

> This is the natural bridge to a future framework frontend (React/Vue): it can
> consume `/api/*` while the SSR pages keep working for readers and no-JS clients.

---

## Verification performed

With the server running and the DB seeded, the full stack was exercised:

- All public GET routes return `200`; a **draft** post and unknown URLs return `404`.
- Home renders seeded posts + sidebar counts; a post shows its **approved** comments.
- **Add comment** → `302` redirect, stored as *pending*; invalid input → `400` re-render.
- **Contact submit** → persisted to `contact_messages`; invalid input → `400`.
- **Create post** → slug auto-generated, `published_at` set, appears on the home page.
- **Edit post** → changes persisted. **Approve comment** → becomes visible publicly.
- **Delete post** → row removed and comments/links cascade away.

REST API (all via JSON over `/api`):

- `GET /api/posts` returns 3 published; `?status=all` returns 4.
- `GET /api/posts/:id` works by **numeric id and by slug**; missing → `404`.
- `POST /api/posts` → `201` with auto-generated slug + `published_at`; invalid → `400`
  with `fields`.
- `PUT` updates; `POST …/comments` → `201` *pending*; `PATCH …/comments/:id` approves
  (then it appears in the approved list); `DELETE` → `204`.
- `GET /api/categories` (with counts), `/api/categories/:slug/posts`, `/api/tags`,
  `POST /api/contact` all behave as specified; unknown `/api/*` → JSON `404`.
- SSR pages and the JSON API run **side by side** on the same server.
