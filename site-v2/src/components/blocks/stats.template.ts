import type { Template } from "tinacms";

export const statsBlockSchema: Template = {
  name: "stats",
  label: "Números da escola",
  fields: [
    { type: "string", name: "title", label: "Título", required: true },
    { type: "string", name: "description", label: "Descrição" },
    {
      type: "object",
      name: "items",
      label: "Indicadores",
      list: true,
      ui: { defaultItem: { value: "100+", label: "Indicador" } },
      fields: [
        { type: "string", name: "value", label: "Valor", required: true },
        { type: "string", name: "label", label: "Descrição", required: true },
      ],
    },
  ],
};
