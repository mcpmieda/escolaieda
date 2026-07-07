const CONFIG = Object.freeze({
  clientId: "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  tenantId: "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  redirectUri: `${window.location.origin}/`,
  postLoginPath: "/notas/",
  siteId: "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17",
  lists: {
    configuracoes: "NOTAS_CONFIGURACOES",
    turmas: "NOTAS_TURMAS",
    componentes: "NOTAS_COMPONENTES",
    alunos: "NOTAS_ALUNOS",
    matriculas: "NOTAS_MATRICULAS",
    professores: "NOTAS_PROFESSORES",
    vinculosPlanilhas: "NOTAS_VINCULOS_PLANILHAS",
    lancamentos: "NOTAS_LANCAMENTOS",
    importacoes: "NOTAS_IMPORTACOES",
    inconsistencias: "NOTAS_INCONSISTENCIAS"
  },
  requiredLists: [
    "NOTAS_CONFIGURACOES",
    "NOTAS_TURMAS",
    "NOTAS_COMPONENTES",
    "NOTAS_ALUNOS",
    "NOTAS_MATRICULAS",
    "NOTAS_LANCAMENTOS",
    "NOTAS_IMPORTACOES",
    "NOTAS_INCONSISTENCIAS"
  ]
});

const loginRequest = Object.freeze({
  scopes: ["User.Read", "Sites.ReadWrite.All"],
  prompt: "select_account"
});

const tokenRequest = Object.freeze({
  scopes: ["User.Read", "Sites.ReadWrite.All"]
});

export { CONFIG, loginRequest, tokenRequest };
