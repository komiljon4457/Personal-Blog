<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api } from "../services/api.js";
import PostCard from "../components/PostCard.vue";

const route = useRoute();
const category = ref(null);
const posts = ref([]);
const loading = ref(true);
const error = ref("");

async function load(slug) {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.getCategoryPosts(slug);
    category.value = data.category;
    posts.value = data.posts;
  } catch (e) {
    error.value = e.status === 404 ? "Category not found." : e.message;
    category.value = null;
    posts.value = [];
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.slug, (slug) => slug && load(slug), { immediate: true });
</script>

<template>
  <main class="page">
    <div class="layout-narrow">
      <p v-if="loading" class="explorer__loading">Loading…</p>
      <p v-else-if="error" class="notice notice--error">{{ error }}</p>

      <template v-else>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><RouterLink to="/">Home</RouterLink></li>
            <li aria-current="page">Category: {{ category.name }}</li>
          </ol>
        </nav>
        <header class="page-intro">
          <h1>Category: {{ category.name }}</h1>
          <p v-if="category.description">{{ category.description }}</p>
        </header>
        <PostCard v-for="p in posts" :key="p.slug" :post="p" />
        <p v-if="!posts.length">No published posts in this category yet.</p>
      </template>
    </div>
  </main>
</template>
