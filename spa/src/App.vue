<script setup>
// Root component: persistent chrome + the routed view.
import SiteHeader from "./components/SiteHeader.vue";
import SiteFooter from "./components/SiteFooter.vue";
</script>

<template>
  <SiteHeader />
  <RouterView />
  <SiteFooter />
</template>
