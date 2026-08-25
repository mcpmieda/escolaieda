const INTEGRATION_CONFIG = Object.freeze({
  clientId: "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  tenantId: "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  redirectUri: `${window.location.origin}/`,
  siteId: "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17",
  lists: Object.freeze({
    model: "NOTAS_POC_MODELO_NINA",
    events: "NOTAS_POC_EVENTOS"
  }),
  scopes: Object.freeze(["User.Read", "Sites.ReadWrite.All"]),
  modelTable: "TB_LANCAMENTOS",
  pollingMs: 1000,
  editDebounceMs: 250,
  arrivalTargetMs: 3000,
  retry: Object.freeze({ attempts: 4, baseDelayMs: 350, maxDelayMs: 5000 })
});

export { INTEGRATION_CONFIG };
