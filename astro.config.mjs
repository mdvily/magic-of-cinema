// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://magic-of-cinema.vercel.app",
  // Note: this is the official URL going forward. The alias
  // magicofcinema.vercel.app also resolves but is not the canonical.
  trailingSlash: "never",
  output: "static",
  adapter: vercel(),
  integrations: [sitemap()],
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
