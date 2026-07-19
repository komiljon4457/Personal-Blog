<script setup>
import { formatDate, isoDate } from "../lib/format.js";

defineProps({
  post: { type: Object, required: true },
});
</script>

<template>
  <article class="post-card">
    <h2><RouterLink :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink></h2>
    <p class="post-meta">
      <time :datetime="isoDate(post.publishedAt)">{{ formatDate(post.publishedAt) }}</time>
      · by {{ post.authorName }}
      <template v-if="post.categories.length">
        · in
        <template v-for="(c, i) in post.categories" :key="c.slug">
          <RouterLink :to="`/category/${c.slug}`">{{ c.name }}</RouterLink><span v-if="i < post.categories.length - 1">, </span>
        </template>
      </template>
    </p>
    <p v-if="post.excerpt">{{ post.excerpt }}</p>
    <p>
      <RouterLink class="btn btn--ghost btn--small" :to="`/posts/${post.slug}`">Read more</RouterLink>
    </p>
    <ul v-if="post.tags.length" class="taxonomy" aria-label="Tags">
      <li v-for="t in post.tags" :key="t.slug"><span class="pill">#{{ t.slug }}</span></li>
    </ul>
  </article>
</template>
