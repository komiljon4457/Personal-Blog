# Step 5 — Client-Side Rendered (CSR) view

This step adds a **client-side rendered** page at `/explore`. Unlike the SSR pages
(where the server sends finished HTML), the server sends an almost-empty **shell** and
the browser fetches the data by **AJAX** and builds the DOM itself — from **both** the
**REST API** and the **GraphQL API**, switchable with a live toggle.

- Shell (SSR): [`src/views/explore.ejs`](../src/views/explore.ejs) — header/footer +
  a toolbar + an empty `#app` root + `<script src="/js/csr.js">`.
- Client script: [`prototype/js/csr.js`](../prototype/js/csr.js) — vanilla JS, served
  statically at `/js`. No build step, no framework.

## SSR vs CSR — the difference this page shows

| | SSR (`/`, `/posts/:slug`) | CSR (`/explore`) |
| --- | --- | --- |
| Who builds the HTML | the **server** (EJS) | the **browser** (`csr.js`) |
| First response | full page | empty shell + a script |
| Data arrives via | already in the HTML | **AJAX** after load (`fetch`) |
| Needs JavaScript | no | yes |

## What the client does

1. On load, `fetch`es the post list from the selected source and renders post cards
   into `#app`.
2. A **Data source** toggle (REST / GraphQL) re-fetches the *same* view from the other
   API — proof that one UI is fed by two different backends.
3. **Hash routing** (`#/posts/:slug`) is pure client-side: selecting a post fetches
   its detail (content, tags, approved comments) and renders it — no full page reload.
4. The comment form submits by **AJAX** (REST `POST /api/posts/:slug/comments` or the
   GraphQL `addComment` mutation, depending on the toggle) and shows the result inline.
5. A status line reports which source was used and how long the fetch took.

### One render path, two shapes

REST returns `snake_case` (`published_at`, `author_name`) and GraphQL returns
`camelCase` (`publishedAt`, `author { name }`). `csr.js` has a small `normalizePost()`
that folds both into a single shape, so the rendering code doesn't care which API
produced the data.

```js
// REST
const posts = await (await fetch("/api/posts")).json();

// GraphQL
const { data } = await (await fetch("/graphql", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ query: "{ posts { title slug author { name } } }" }),
})).json();
```

## Wiring

- `GET /explore` → [`blogController.explore`](../src/controllers/blogController.js)
  renders the shell.
- Static scripts are served from `prototype/js` at `/js` (added in
  [`app.js`](../src/app.js)).
- Styles: [`scss/components/_explore.scss`](../scss/components/_explore.scss)
  (toolbar + source toggle), compiled into `style.css`.
- A **noscript** fallback points visitors without JS to the SSR home page.

## Verification performed

Because the browser extension wasn't available, the client script was executed in a
real DOM using **jsdom**, pointed at the running server:

- REST list → 3 post cards rendered in the browser DOM.
- Toggle to **GraphQL** → same view re-fetched and re-rendered; toggle state updates.
- Hash route to a post → detail view with article body + approved comments (Marco/Lena).
- Comment form submitted via **GraphQL mutation** → “received (pending)”.
- Invalid comment via **REST** → field-level validation errors shown inline.

> The jsdom run also caught a real bug: reading `form.name.value` returns the form's
> own `name` property, not the `<input name="name">` — fixed to read the fields by id.
```
