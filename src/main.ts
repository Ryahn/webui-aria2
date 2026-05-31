import { createApp, h } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import ErrorBoundary from "./components/layout/ErrorBoundary.vue";
import { i18n } from "./i18n";
import "./styles/app.css";

const app = createApp({
  render: () => h(ErrorBoundary, null, { default: () => h(App) }),
});
app.use(createPinia());
app.use(i18n);
app.mount("#app");
