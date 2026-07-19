<script setup>
// Bound (not literal) src so Vite leaves it as a runtime URL served by the API
// host (/assets is proxied in dev), rather than trying to bundle it at build time.
const authorImage = "/assets/author.svg";
</script>

<template>
  <main class="page">
    <div class="layout-narrow">
      <article>
        <header class="page-intro"><h1>About me</h1></header>
        <figure class="article-hero">
          <img :src="authorImage" alt="Portrait of Admin" width="1200" height="600" />
          <figcaption>Admin</figcaption>
        </figure>
        <div class="article-body">
          <p>
            This is <strong>My Blog</strong>. This page is part of a Vue single-page
            application: navigation happens entirely in the browser via Vue Router,
            and content is fetched from the REST API by AJAX.
          </p>
          <p>
            The SPA reuses the same backend and stylesheet as the server-rendered
            site — it is simply a different client on top of the same API.
          </p>
        </div>
      </article>
    </div>
  </main>
</template>
