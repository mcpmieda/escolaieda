import type { Collection } from "tinacms";
import { heroBlockSchema } from "../../src/components/blocks/hero.template";
import { quickLinksBlockSchema } from "../../src/components/blocks/quick-links.template";
import { noticeBlockSchema } from "../../src/components/blocks/notice.template";
import { statsBlockSchema } from "../../src/components/blocks/stats.template";

export const PageCollection: Collection = {
  name: "page",
  label: "Páginas",
  path: "src/content/pages",
  format: "json",
  ui: {
    router: ({ document }) => document._sys.filename === "home" ? "/" : `/${document._sys.filename}/`,
  },
  fields: [
    {
      type: "string",
      name: "seoTitle",
      label: "Título para Google",
      isTitle: true,
      required: true,
    },
    {
      type: "string",
      name: "seoDescription",
      label: "Descrição para Google",
      ui: { component: "textarea" },
    },
    {
      type: "object",
      name: "blocks",
      label: "Seções da página",
      list: true,
      ui: { visualSelector: true },
      templates: [heroBlockSchema, quickLinksBlockSchema, noticeBlockSchema, statsBlockSchema],
    },
  ],
};
