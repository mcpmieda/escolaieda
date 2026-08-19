import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tina from "@tinacms/astro/integration";
import { tinaAdminDevRedirect } from "@tinacms/astro/vite";

export default defineConfig({
  site: process.env.SITE_URL || "http://localhost:4321",
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [tina()],
  vite: {
    plugins: [tinaAdminDevRedirect()],
  },
});
