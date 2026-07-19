// =============================================================================
// csr.js — CLIENT-SIDE RENDERED view.
// The page ships as an (almost) empty shell; this script fetches data in the
// browser via AJAX from EITHER the REST API (/api) or the GraphQL API (/graphql)
// and renders the DOM on the client. A toggle switches the data source live.
// =============================================================================

(function () {
  "use strict";

  const app = document.getElementById("app");
  const statusEl = document.getElementById("explorer-status");
  const sourceButtons = Array.from(document.querySelectorAll("[data-source]"));

  // Current data source: "rest" | "graphql"
  let source = "rest";
  // Current view: { name: "list" } | { name: "detail", slug }
  let view = { name: "list" };

  // ---- tiny helpers ---------------------------------------------------------
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const fmtDate = (sql) => {
    if (!sql) return "";
    const [y, m, d] = String(sql).slice(0, 10).split("-").map(Number);
    const months = ["January","February","March","April","May","June","July",
      "August","September","October","November","December"];
    return y ? `${d} ${months[m - 1]} ${y}` : "";
  };

  const setStatus = (msg, kind) => {
    statusEl.textContent = msg;
    statusEl.className = "explorer__status" + (kind ? " explorer__status--" + kind : "");
  };

  // ---- data access: REST ----------------------------------------------------
  const rest = {
    async listPosts() {
      const r = await fetch("/api/posts");
      if (!r.ok) throw new Error("REST /api/posts -> " + r.status);
      return r.json();
    },
    async getPost(slug) {
      const r = await fetch("/api/posts/" + encodeURIComponent(slug));
      if (!r.ok) throw new Error("REST /api/posts/" + slug + " -> " + r.status);
      return r.json();
    },
    async addComment(slug, body) {
      const r = await fetch("/api/posts/" + encodeURIComponent(slug) + "/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, data };
    },
  };

  // ---- data access: GraphQL -------------------------------------------------
  async function gql(query, variables) {
    const r = await fetch("/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const json = await r.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
  }

  const graphql = {
    async listPosts() {
      const data = await gql(`{
        posts {
          title slug excerpt publishedAt
          author { name }
          categories { name slug }
          tags { slug }
          commentCount
        }
      }`);
      return data.posts;
    },
    async getPost(slug) {
      const data = await gql(
        `query($s:String){
          post(slug:$s){
            title slug content publishedAt
            author { name }
            categories { name slug }
            tags { slug }
            comments { authorName content createdAt }
            commentCount
          }
        }`,
        { s: slug }
      );
      return data.post;
    },
    async addComment(slug, body) {
      try {
        const data = await gql(
          `mutation($s:String!,$n:String!,$e:String!,$c:String!){
            addComment(slug:$s, name:$n, email:$e, comment:$c){ id status }
          }`,
          { s: slug, n: body.name, e: body.email, c: body.comment }
        );
        return { ok: true, status: 201, data: data.addComment };
      } catch (err) {
        return { ok: false, status: 400, data: { error: err.message } };
      }
    },
  };

  const api = () => (source === "rest" ? rest : graphql);

  // ---- normalisation --------------------------------------------------------
  // REST returns snake_case + author_name; GraphQL returns camelCase + author{name}.
  // Normalise both into ONE shape so the render code doesn't care about the source.
  function normalizePost(p) {
    return {
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      publishedAt: p.publishedAt || p.published_at || null,
      authorName: (p.author && p.author.name) || p.author_name || "",
      categories: p.categories || [],
      tags: p.tags || [],
      comments: (p.comments || []).map((c) => ({
        authorName: c.authorName || c.author_name,
        content: c.content,
        createdAt: c.createdAt || c.created_at,
      })),
      commentCount: p.commentCount != null ? p.commentCount : p.comments ? p.comments.length : 0,
    };
  }

  // ---- rendering ------------------------------------------------------------
  function renderLoading() {
    app.innerHTML = `<p class="explorer__loading">Loading…</p>`;
  }

  function metaLine(p) {
    const cats = p.categories.map((c) => `<a href="#" data-cat>${esc(c.name)}</a>`).join(", ");
    return `<p class="post-meta">
      <time datetime="${esc((p.publishedAt || "").slice(0, 10))}">${esc(fmtDate(p.publishedAt))}</time>
      · by ${esc(p.authorName)}${cats ? " · in " + cats : ""}
    </p>`;
  }

  function tagList(p) {
    if (!p.tags.length) return "";
    return `<ul class="taxonomy" aria-label="Tags">${p.tags
      .map((t) => `<li><span class="pill">#${esc(t.slug)}</span></li>`)
      .join("")}</ul>`;
  }

  function renderList(posts) {
    const cards = posts
      .map(normalizePost)
      .map(
        (p) => `<article class="post-card">
          <h2><a href="#/posts/${esc(p.slug)}" data-slug="${esc(p.slug)}">${esc(p.title)}</a></h2>
          ${metaLine(p)}
          ${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ""}
          <p><a href="#/posts/${esc(p.slug)}" class="btn btn--ghost btn--small" data-slug="${esc(p.slug)}">Read more</a></p>
          ${tagList(p)}
        </article>`
      )
      .join("");
    app.innerHTML = `<header class="page-intro">
        <h1>Explore posts</h1>
        <p>This page is rendered <strong>in your browser</strong> from data fetched via AJAX.</p>
      </header>${cards || "<p>No posts.</p>"}`;
  }

  function renderDetail(raw) {
    if (!raw) {
      app.innerHTML = `<p>Post not found. <a href="#/" data-home>Back to list</a></p>`;
      return;
    }
    const p = normalizePost(raw);
    const body = source === "rest"
      ? esc(p.content).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")
      : esc(p.content).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");

    const comments = p.comments
      .map(
        (c) => `<article class="comment">
          <p class="comment__meta"><strong>${esc(c.authorName)}</strong> · <time>${esc(fmtDate(c.createdAt))}</time></p>
          <p>${esc(c.content)}</p>
        </article>`
      )
      .join("");

    app.innerHTML = `
      <p><a href="#/" class="btn btn--ghost btn--small" data-home>← Back to list</a></p>
      <article>
        <header><h1>${esc(p.title)}</h1>${metaLine(p)}</header>
        <div class="article-body"><p>${body}</p></div>
        ${tagList(p)}
      </article>
      <section aria-labelledby="c-h" id="comments">
        <h2 id="c-h">Comments (${p.commentCount})</h2>
        ${comments || "<p>No comments yet.</p>"}
        <h3>Leave a comment</h3>
        <p><small>Submitted via AJAX to the <strong id="post-target"></strong> API. Comments are moderated.</small></p>
        <form id="comment-form">
          <div class="form-grid-2">
            <div class="form-row">
              <label for="cf-name">Name *</label>
              <input id="cf-name" name="name" required minlength="2" />
            </div>
            <div class="form-row">
              <label for="cf-email">Email *</label>
              <input id="cf-email" name="email" type="email" required />
            </div>
          </div>
          <div class="form-row">
            <label for="cf-comment">Comment *</label>
            <textarea id="cf-comment" name="comment" required minlength="5"></textarea>
          </div>
          <p id="cf-msg" class="explorer__status" role="status"></p>
          <div class="form-actions"><button class="btn" type="submit">Post comment</button></div>
        </form>
      </article>`;

    document.getElementById("post-target").textContent = source.toUpperCase();
    wireCommentForm(p.slug || raw.slug);
  }

  function wireCommentForm(slug) {
    const form = document.getElementById("comment-form");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("cf-msg");
      // NB: use ids, not form.name — `form.name` resolves to the form's own
      // name property, not the <input name="name"> field.
      const body = {
        name: document.getElementById("cf-name").value,
        email: document.getElementById("cf-email").value,
        comment: document.getElementById("cf-comment").value,
      };
      msg.textContent = "Submitting via " + source.toUpperCase() + "…";
      const res = await api().addComment(slug, body);
      if (res.ok) {
        msg.className = "explorer__status explorer__status--ok";
        msg.textContent = "✓ Comment received (pending moderation) via " + source.toUpperCase() + ".";
        form.reset();
      } else {
        msg.className = "explorer__status explorer__status--error";
        const fields = res.data && res.data.fields;
        msg.textContent =
          "✗ " + (fields ? Object.values(fields).join(" ") : res.data.error || "Failed.");
      }
    });
  }

  // ---- controller -----------------------------------------------------------
  async function load() {
    renderLoading();
    const t0 = performance.now();
    try {
      if (view.name === "list") {
        const posts = await api().listPosts();
        renderList(posts);
        setStatus(
          `Loaded ${posts.length} posts via ${source.toUpperCase()} in ${Math.round(performance.now() - t0)} ms`,
          "ok"
        );
      } else {
        const post = await api().getPost(view.slug);
        renderDetail(post);
        setStatus(
          `Loaded “${view.slug}” via ${source.toUpperCase()} in ${Math.round(performance.now() - t0)} ms`,
          "ok"
        );
      }
    } catch (err) {
      app.innerHTML = `<p class="explorer__loading">Could not load data.</p>`;
      setStatus(String(err.message || err), "error");
    }
  }

  // ---- routing (hash-based, so it's pure client-side) -----------------------
  function syncViewFromHash() {
    const m = location.hash.match(/^#\/posts\/(.+)$/);
    view = m ? { name: "detail", slug: decodeURIComponent(m[1]) } : { name: "list" };
  }

  window.addEventListener("hashchange", () => {
    syncViewFromHash();
    load();
  });

  // ---- source toggle --------------------------------------------------------
  sourceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      source = btn.dataset.source;
      sourceButtons.forEach((b) => {
        const active = b.dataset.source === source;
        b.classList.toggle("source-btn--active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      load(); // re-fetch the SAME view from the newly selected source
    });
  });

  // ---- boot -----------------------------------------------------------------
  syncViewFromHash();
  load();
})();
