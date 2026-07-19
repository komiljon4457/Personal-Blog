// =============================================================================
// services/api.js — the SPA's AJAX layer.
// All server communication goes through here (fetch → REST API at /api).
// Responses are normalised to camelCase so components stay source-agnostic.
// =============================================================================

async function request(url, options) {
  const res = await fetch(url, options);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.fields = data.fields || null;
    throw err;
  }
  return data;
}

function normalizeComment(c) {
  return {
    id: c.id,
    authorName: c.authorName || c.author_name,
    content: c.content,
    createdAt: c.createdAt || c.created_at,
  };
}

function normalizePost(p) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    status: p.status,
    publishedAt: p.publishedAt || p.published_at || null,
    authorName: (p.author && p.author.name) || p.author_name || "",
    categories: p.categories || [],
    tags: p.tags || [],
    comments: (p.comments || []).map(normalizeComment),
    commentCount:
      p.commentCount != null ? p.commentCount : (p.comments ? p.comments.length : 0),
  };
}

export const api = {
  listPosts() {
    return request("/api/posts").then((rows) => rows.map(normalizePost));
  },

  getPost(slug) {
    return request(`/api/posts/${encodeURIComponent(slug)}`).then(normalizePost);
  },

  getCategories() {
    return request("/api/categories");
  },

  getCategoryPosts(slug) {
    return request(`/api/categories/${encodeURIComponent(slug)}/posts`).then((d) => ({
      category: d.category,
      posts: d.posts.map(normalizePost),
    }));
  },

  addComment(slug, body) {
    return request(`/api/posts/${encodeURIComponent(slug)}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};
