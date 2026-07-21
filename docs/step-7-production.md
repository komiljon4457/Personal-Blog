# Step 7 — Production build (single port)

In development the SPA runs on its own Vite server (`:5173`) and proxies to the API
(`:3000`). For production that split goes away: the SPA is **built to static files**
and **served by the Express server itself**, so the whole app — SSR pages, REST +
GraphQL APIs, and the Vue SPA — runs on **one port**.

## What changed

- **Vite `base`** is production-aware ([`spa/vite.config.js`](../spa/vite.config.js)):
  `"/"` in dev, `"/app/"` for the build — so built asset URLs are `/app/assets/…`.
- **Router base** uses `import.meta.env.BASE_URL`
  ([`spa/src/router/index.js`](../spa/src/router/index.js)), so routing works both
  standalone (dev) and under `/app` (production) with no code change.
- **Express serves the build** ([`src/app.js`](../src/app.js)): if `spa/dist` exists,
  it is mounted at `/app` with a **history-mode fallback**.

```js
const spaDist = path.join(__dirname, "..", "spa", "dist");
if (fs.existsSync(path.join(spaDist, "index.html"))) {
  app.use("/app", express.static(spaDist));                 // assets, /app/, etc.
  app.use("/app", (req, res) => res.sendFile(".../index.html")); // deep-link fallback
}
```

The fallback is what makes **history mode** work: reloading `/app/posts/some-slug`
returns `index.html` (not a 404), and Vue Router then renders the right view on the
client. The check for `dist/index.html` means dev still works when the SPA hasn't been
built.

### Why `/app` (not `/`)

The SSR site already owns `/`, `/posts/:slug`, `/about`, etc. Mounting the SPA under
`/app` lets both coexist on one server. The built `index.html` keeps the shared
stylesheet at `/css/style.css` (served by Express) while its own scripts are prefixed
to `/app/assets/…` — so no proxy is needed in production; everything is same-origin.

## Build & run

```bash
# one-shot production build: minify CSS (Sass) + build the SPA
npm run build

# start the single server
npm start                     # http://localhost:3000
```

`npm run build` runs:
- `sass:build` → compressed `prototype/css/*.css`
- `spa:build`  → `npm install --prefix spa && vite build` → `spa/dist`

After that, one server hosts everything:

| URL | What |
| --- | --- |
| `http://localhost:3000/` | SSR site (home, posts, admin) |
| `http://localhost:3000/explore` | CSR view (vanilla JS) |
| `http://localhost:3000/api/...` | REST API |
| `http://localhost:3000/graphql` | GraphQL API + GraphiQL |
| `http://localhost:3000/app` | **built Vue SPA** |

> To return to expanded (readable) CSS for development after a production build,
> run `npm run sass`. `spa/dist` is git-ignored.

## Verification performed

With `npm run build` done and `npm start` running (single port :3000):

- `GET /app/` → `200`, HTML references `/app/assets/index-*.js`.
- `GET /app/assets/index-*.js` → `200 text/javascript` (bundle loads).
- `GET /app/posts/three-days-in-the-dolomites` and `/app/category/travel` →
  `200` returning the SPA shell (**history-mode fallback** works on deep links).
- `GET /css/style.css` → `200` (shared, now minified); `GET /api/posts` → `200` with
  3 posts (same-origin, no proxy).
- `GET /` → still the **SSR** site (no `/app/assets` references) — the two coexist.
