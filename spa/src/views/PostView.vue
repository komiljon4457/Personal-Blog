<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api } from "../services/api.js";
import { formatDate, isoDate, paragraphs } from "../lib/format.js";
import CommentList from "../components/CommentList.vue";
import CommentForm from "../components/CommentForm.vue";

const route = useRoute();
const post = ref(null);
const loading = ref(true);
const error = ref("");

async function load(slug) {
  loading.value = true;
  error.value = "";
  try {
    post.value = await api.getPost(slug);
  } catch (e) {
    error.value = e.status === 404 ? "Post not found." : e.message;
    post.value = null;
  } finally {
    loading.value = false;
  }
}

// Re-fetch whenever the :slug param changes (same component, different post).
watch(() => route.params.slug, (slug) => slug && load(slug), { immediate: true });
</script>

<template>
  <main class="page">
    <div class="layout-narrow">
      <p v-if="loading" class="explorer__loading">Loading…</p>
      <p v-else-if="error" class="notice notice--error">{{ error }}</p>

      <template v-else-if="post">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><RouterLink to="/">Home</RouterLink></li>
            <li v-if="post.categories.length">
              <RouterLink :to="`/category/${post.categories[0].slug}`">{{ post.categories[0].name }}</RouterLink>
            </li>
            <li aria-current="page">{{ post.title }}</li>
          </ol>
        </nav>

        <article>
          <header>
            <h1>{{ post.title }}</h1>
            <p class="post-meta">
              <time :datetime="isoDate(post.publishedAt)">{{ formatDate(post.publishedAt) }}</time>
              · by {{ post.authorName }}
            </p>
          </header>
          <div class="article-body">
            <p v-for="(para, i) in paragraphs(post.content)" :key="i">{{ para }}</p>
          </div>
          <ul v-if="post.tags.length" class="taxonomy" aria-label="Tags">
            <li v-for="t in post.tags" :key="t.slug"><span class="pill">#{{ t.slug }}</span></li>
          </ul>
        </article>

        <section id="comments" aria-labelledby="c-heading">
          <h2 id="c-heading">Comments ({{ post.commentCount }})</h2>
          <CommentList :comments="post.comments" />
          <h3>Leave a comment</h3>
          <CommentForm :slug="post.slug" />
        </section>
      </template>
    </div>
  </main>
</template>
