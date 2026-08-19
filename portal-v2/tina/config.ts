import { defineConfig } from 'tinacms';

const branch =
  process.env.TINA_BRANCH ||
  process.env.GITHUB_HEAD_REF ||
  process.env.GITHUB_REF_NAME ||
  'main';

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
    basePath: 'v2',
  },
  schema: {
    collections: [
      {
        name: 'home',
        label: 'Página inicial',
        path: 'content/home',
        format: 'json',
        match: { include: 'home' },
        ui: {
          global: true,
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Capa do site',
            fields: [
              { type: 'string', name: 'eyebrow', label: 'Texto pequeno acima do título' },
              { type: 'string', name: 'title', label: 'Título principal' },
              {
                type: 'string',
                name: 'description',
                label: 'Texto de apresentação',
                ui: { component: 'textarea' },
              },
              { type: 'string', name: 'location', label: 'Cidade exibida' },
              { type: 'string', name: 'state', label: 'Estado exibido' },
              { type: 'string', name: 'grade', label: 'Séries atendidas' },
              { type: 'string', name: 'gradeLabel', label: 'Etapa de ensino' },
            ],
          },
          {
            type: 'object',
            name: 'quickLinks',
            label: 'Acessos principais',
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.title || 'Acesso',
              }),
            },
            fields: [
              { type: 'string', name: 'icon', label: 'Ícone', ui: { component: 'hidden' } },
              { type: 'string', name: 'title', label: 'Nome do acesso' },
              {
                type: 'string',
                name: 'description',
                label: 'Texto curto',
                ui: { component: 'textarea' },
              },
              {
                type: 'string',
                name: 'href',
                label: 'Destino do link',
                ui: { component: 'hidden' },
              },
            ],
          },
          {
            type: 'object',
            name: 'info',
            label: 'Mensagem em destaque',
            fields: [
              { type: 'string', name: 'kicker', label: 'Texto pequeno acima do título' },
              { type: 'string', name: 'title', label: 'Título' },
              {
                type: 'string',
                name: 'description',
                label: 'Mensagem',
                ui: { component: 'textarea' },
              },
            ],
          },
          {
            type: 'object',
            name: 'school',
            label: 'Sobre a escola',
            fields: [
              { type: 'string', name: 'kicker', label: 'Texto pequeno acima do título' },
              { type: 'string', name: 'title', label: 'Título' },
              {
                type: 'string',
                name: 'paragraphs',
                label: 'Textos sobre a escola',
                list: true,
                ui: { component: 'textarea' },
              },
              {
                type: 'object',
                name: 'stats',
                label: 'Dados resumidos',
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.value
                      ? `${item.value}${item?.label ? ` — ${item.label}` : ''}`
                      : 'Dado resumido',
                  }),
                },
                fields: [
                  { type: 'string', name: 'value', label: 'Informação principal' },
                  { type: 'string', name: 'label', label: 'Descrição' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contato da escola',
            fields: [
              { type: 'string', name: 'kicker', label: 'Texto pequeno acima do título' },
              { type: 'string', name: 'title', label: 'Título' },
              {
                type: 'string',
                name: 'description',
                label: 'Texto de orientação',
                ui: { component: 'textarea' },
              },
              { type: 'string', name: 'addressLine1', label: 'Endereço' },
              { type: 'string', name: 'addressLine2', label: 'Cidade / UF' },
              { type: 'string', name: 'email', label: 'E-mail' },
              { type: 'string', name: 'whatsappLabel', label: 'WhatsApp' },
              {
                type: 'string',
                name: 'whatsappUrl',
                label: 'Link técnico do WhatsApp',
                ui: { component: 'hidden' },
              },
            ],
          },
        ],
      },
    ],
  },
});
