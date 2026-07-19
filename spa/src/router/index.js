// =============================================================================
// router/index.js — Vue Router configuration (history mode).
// Views are lazy-loaded so each route becomes its own code-split chunk.
// =============================================================================

import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/", name: "home", component: () => import("../views/HomeView.vue") },
  {
    path: "/posts/:slug",
    name: "post",
    component: () => import("../views/PostView.vue"),
  },
  {
    path: "/category/:slug",
    name: "category",
    component: () => import("../views/CategoryView.vue"),
  },
  { path: "/about", name: "about", component: () => import("../views/AboutView.vue") },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFoundView.vue"),
  },
];

const router = createRouter({
  // BASE_URL is "/" in dev and "/app/" in the production build (see vite.config.js),
  // so routing works whether the SPA is served standalone or under /app by Express.
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
