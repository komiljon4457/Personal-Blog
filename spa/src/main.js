// Entry point: create the Vue app, install the router, mount into #app.
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

createApp(App).use(router).mount("#app");
