// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://magic-of-cinema.vercel.app",
  trailingSlash: "never",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
