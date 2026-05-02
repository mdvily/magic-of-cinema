// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://magic-of-cinema.vercel.app",
  trailingSlash: "never",
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
