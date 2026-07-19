<script setup>
import { formatDate, isoDate } from "../lib/format.js";

defineProps({
  comments: { type: Array, default: () => [] },
});
</script>

<template>
  <div>
    <article v-for="c in comments" :key="c.id" class="comment">
      <p class="comment__meta">
        <strong>{{ c.authorName }}</strong> ·
        <time :datetime="isoDate(c.createdAt)">{{ formatDate(c.createdAt) }}</time>
      </p>
      <p>{{ c.content }}</p>
    </article>
    <p v-if="!comments.length">No comments yet. Be the first!</p>
  </div>
</template>
