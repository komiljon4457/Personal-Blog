# Step 6 — Vue SPA (Vite)

This step adds a **Vue 3 single-page application** in [`spa/`](../spa), built with
**Vite**. It is a standalone client that talks to the existing backend entirely by
**AJAX** (`fetch` → the REST API). The UI is composed of **Single-File Components
(SFCs)** and navigation is handled by **Vue Router** — no full-page reloads.

- Framework: **Vue 3** (`<script setup>` composition API)
- Tooling: **Vite** (dev server, HMR, production build, code-splitting)
- Routing: **Vue Router** (history mode)
- Data: **AJAX** to `/api` (REST); responses normalised in one service module

## How it differs from the earlier views

| | SSR (`/`) | CSR view (`/explore`) | **Vue SPA (`spa/`)** |
| --- | --- | --- | --- |
| HTML built by | server | browser (vanilla JS) | **browser (Vue components)** |
| Structure | EJS templates | one script file | **SFCs (components + views)** |
| Routing | server routes | hash routing | **Vue Router (history mode)** |
| Data | in the HTML | AJAX | **AJAX (service module)** |

## Project structure

```
spa/
├── index.html              # app shell; links the shared /css, loads /src/main.js
├── vite.config.js          # Vue plugin + dev proxy (/api, /graphql, /css, /assets → :3000)
├── src/
│   ├── main.js             # createApp(App).use(router).mount('#app')
│   ├── App.vue             # root: <SiteHeader/> <RouterView/> <SiteFooter/>
│   ├── router/index.js     # routes, history mode, lazy-loaded views
│   ├── services/api.js     # AJAX layer (fetch → REST), response normalisation
│   ├── lib/format.js       # date / paragraph helpers
│   ├── components/         # reusable SFCs
│   │   ├── SiteHeader.vue  SiteFooter.vue
│   │   ├── PostCard.vue    CommentList.vue  CommentForm.vue
│   └── views/              # one SFC per route (code-split)
│       ├── HomeView.vue    PostView.vue  CategoryView.vue
│       ├── AboutView.vue   NotFoundView.vue
```

## Routing (Vue Router)

```js
const routes = [
  { path: "/",               component: () => import("../views/HomeView.vue") },
  { path: "/posts/:slug",    component: () => import("../views/PostView.vue") },
  { path: "/category/:slug", component: () => import("../views/CategoryView.vue") },
  { path: "/about",          component: () => import("../views/AboutView.vue") },
  { path: "/:pathMatch(.*)*",component: () => import("../views/NotFoundView.vue") },
];
```

- **History mode** (clean URLs, no `#`). Views are **lazy-loaded**, so each route is
  its own JS chunk (visible in the build output).
- `<RouterLink>` is used for navigation and sets `aria-current="page"` on the active
  link — which the shared CSS already styles.
- `PostView` / `CategoryView` `watch` the `:slug` route param and re-fetch when it
  changes (same component instance, different data).

## AJAX layer

All server communication lives in [`src/services/api.js`](../spa/src/services/api.js).
Components never call `fetch` directly (except the form via the service) — they call
`api.listPosts()`, `api.getPost(slug)`, `api.addComment(slug, body)`, etc. The service
also **normalises** REST's `snake_case` (`published_at`) into `camelCase`
(`publishedAt`) so templates are clean.

```js
export const api = {
  listPosts: () => request("/api/posts").then((r) => r.map(normalizePost)),
  getPost:   (slug) => request(`/api/posts/${slug}`).then(normalizePost),
  addComment:(slug, body) => request(`/api/posts/${slug}/comments`, { method: "POST", ... }),
};
```

### Dev proxy (no CORS)

In development the SPA runs on **:5173** and the API on **:3000**. `vite.config.js`
proxies `/api`, `/graphql`, `/css` and `/assets` to `:3000`, so browser requests stay
same-origin. The SPA even **reuses the same compiled stylesheet** as the rest of the
site (linked from `index.html`).

## Running it

The Express API must be running (it serves the data and the CSS):

```bash
# terminal 1 — the backend
npm start                       # http://localhost:3000

# terminal 2 — the SPA dev server
cd spa
npm install                     # first time
npm run dev                     # http://localhost:5173
```

Production build:

```bash
cd spa
npm run build     # → spa/dist (SFCs compiled, routes code-split)
npm run preview   # serve the built app
```

## Verification performed

- `npm run build` → **all 35 modules transformed**, each view emitted as its own
  code-split chunk; build succeeds.
- Dev server on :5173 serves the shell, transforms SFCs (`App.vue` → JS), and the
  **`/api/posts` proxy returns live data** (3 posts) — the AJAX path works end-to-end.
- Components rendered through Vite's SSR loader + Vue's renderer (no browser needed):
  `PostCard` renders the title, author, formatted date, tag pill, and correct
  `/posts/:slug` + `/category/:slug` links; `CommentList` renders comments and its
  empty state.

> The build also caught a real issue: a literal `<img src="/assets/…">` made Vite try
> to bundle a runtime asset — fixed by binding `:src` so it stays a runtime URL.
