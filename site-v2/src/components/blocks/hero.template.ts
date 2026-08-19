import type { Template } from "tinacms";

export const heroBlockSchema: Template = {
  name: "hero",
  label: "Capa principal",
  fields: [
    { type: "string", name: "eyebrow", label: "Identificação" },
    { type: "string", name: "headline", label: "Título principal", required: true },
    { type: "string", name: "tagline", label: "Texto de apoio", ui: { component: "textarea" } },
    { type: "image", name: "image", label: "Imagem / logomarca" },
    { type: "string", name: "primaryLabel", label: "Botão principal" },
    { type: "string", name: "primaryHref", label: "Link do botão principal" },
    { type: "string", name: "secondaryLabel", label: "Botão secundário" },
    { type: "string", name: "secondaryHref", label: "Link do botão secundário" },
  ],
  ui: {
    defaultItem: {
      eyebrow: "ESCOLA IÊDA MCPM",
      headline: "Educação que acolhe, ensina e transforma.",
      tagline: "Informação, aprendizagem e participação da comunidade escolar em um só lugar.",
      primaryLabel: "Conheça a escola",
      primaryHref: "/institucional/",
    },
  },
};
