import type { Template } from "tinacms";

export const quickLinksBlockSchema: Template = {
  name: "quickLinks",
  label: "Acessos rápidos",
  fields: [
    { type: "string", name: "title", label: "Título", required: true },
    {
      type: "object",
      name: "items",
      label: "Acessos",
      list: true,
      ui: { defaultItem: { marker: "01", title: "Novo acesso", description: "Descrição curta", href: "/" } },
      fields: [
        { type: "string", name: "marker", label: "Marcador curto" },
        { type: "string", name: "title", label: "Nome", required: true },
        { type: "string", name: "description", label: "Descrição" },
        { type: "string", name: "href", label: "Link", required: true },
      ],
    },
  ],
};
