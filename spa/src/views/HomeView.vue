<script setup>
import { ref, onMounted } from "vue";
import { api } from "../services/api.js";
import PostCard from "../components/PostCard.vue";

const posts = ref([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    posts.value = await api.listPosts();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="page">
    <div class="layout-narrow">
      <header class="page-intro">
        <h1>Latest posts</h1>
        <p>This is a Vue SPA — posts are loaded via AJAX from the REST API.</p>
      </header>

      <p v-if="loading" class="explorer__loading">Loading…</p>
      <p v-else-if="error" class="notice notice--error">{{ error }}</p>
      <template v-else>
        <PostCard v-for="p in posts" :key="p.slug" :post="p" />
        <p v-if="!posts.length">No posts yet.</p>
      </template>
    </div>
  </main>
</template>
