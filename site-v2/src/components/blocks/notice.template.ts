import type { Template } from "tinacms";

export const noticeBlockSchema: Template = {
  name: "notice",
  label: "Aviso importante",
  fields: [
    { type: "string", name: "kicker", label: "Rótulo" },
    { type: "string", name: "title", label: "Título", required: true },
    { type: "string", name: "text", label: "Texto", ui: { component: "textarea" } },
    { type: "string", name: "buttonLabel", label: "Texto do botão" },
    { type: "string", name: "href", label: "Link" },
  ],
};
