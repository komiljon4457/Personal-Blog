<script setup>
// RouterLink sets aria-current="page" on the active link, which the shared CSS
// (.main-nav a[aria-current="page"]) already styles.
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <p class="site-title"><RouterLink to="/">My Blog</RouterLink></p>
      <nav class="main-nav" aria-label="Primary">
        <ul>
          <li><RouterLink to="/">Home</RouterLink></li>
          <li><RouterLink to="/category/travel">Travel</RouterLink></li>
          <li><RouterLink to="/about">About</RouterLink></li>
        </ul>
      </nav>
    </div>
  </header>
</template>
