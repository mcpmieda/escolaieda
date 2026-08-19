import { defineConfig } from 'tinacms';

const branch =
  process.env.TINA_BRANCH ||
  process.env.GITHUB_HEAD_REF ||
  process.env.GITHUB_REF_NAME ||
  'v2/cms-integration';

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
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
            label: 'Capa principal',
            fields: [
              { type: 'string', name: 'eyebrow', label: 'Linha superior' },
              { type: 'string', name: 'title', label: 'Título' },
              { type: 'string', name: 'description', label: 'Descrição', ui: { component: 'textarea' } },
              { type: 'string', name: 'location', label: 'Cidade' },
              { type: 'string', name: 'state', label: 'Estado' },
              { type: 'string', name: 'grade', label: 'Séries atendidas' },
              { type: 'string', name: 'gradeLabel', label: 'Etapa de ensino' },
            ],
          },
          {
            type: 'object',
            name: 'quickLinks',
            label: 'Acessos principais',
            list: true,
            fields: [
              { type: 'string', name: 'icon', label: 'Ícone' },
              { type: 'string', name: 'title', label: 'Título' },
              { type: 'string', name: 'description', label: 'Descrição' },
              { type: 'string', name: 'href', label: 'Destino do link' },
            ],
          },
          {
            type: 'object',
            name: 'info',
            label: 'Destaque informativo',
            fields: [
              { type: 'string', name: 'kicker', label: 'Linha superior' },
              { type: 'string', name: 'title', label: 'Título' },
              { type: 'string', name: 'description', label: 'Descrição', ui: { component: 'textarea' } },
            ],
          },
          {
            type: 'object',
            name: 'school',
            label: 'Nossa Escola',
            fields: [
              { type: 'string', name: 'kicker', label: 'Linha superior' },
              { type: 'string', name: 'title', label: 'Título' },
              { type: 'string', name: 'paragraphs', label: 'Textos', list: true, ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'stats',
                label: 'Informações resumidas',
                list: true,
                fields: [
                  { type: 'string', name: 'value', label: 'Valor' },
                  { type: 'string', name: 'label', label: 'Legenda' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contato',
            fields: [
              { type: 'string', name: 'kicker', label: 'Linha superior' },
              { type: 'string', name: 'title', label: 'Título' },
              { type: 'string', name: 'description', label: 'Descrição', ui: { component: 'textarea' } },
              { type: 'string', name: 'addressLine1', label: 'Endereço' },
              { type: 'string', name: 'addressLine2', label: 'Cidade / UF' },
              { type: 'string', name: 'email', label: 'E-mail' },
              { type: 'string', name: 'whatsappLabel', label: 'WhatsApp exibido' },
              { type: 'string', name: 'whatsappUrl', label: 'Link do WhatsApp' },
            ],
          },
        ],
      },
    ],
  },
});
