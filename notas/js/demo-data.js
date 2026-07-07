const turmas = [
  { id: "turma-demo-6a", codigo: "6A", nome: "6A - Demonstracao", anoLetivo: 2026, turno: "Matutino", ultimaSincronizacao: "2026-07-07T12:32:46Z" },
  { id: "turma-demo-7b", codigo: "7B", nome: "7B - Demonstracao", anoLetivo: 2026, turno: "Vespertino", ultimaSincronizacao: "2026-07-07T12:18:10Z" },
  { id: "turma-demo-8c", codigo: "8C", nome: "8C - Demonstracao", anoLetivo: 2026, turno: "Matutino", ultimaSincronizacao: "2026-07-07T11:54:38Z" },
  { id: "turma-demo-9a", codigo: "9A", nome: "9A - Demonstracao", anoLetivo: 2026, turno: "Vespertino", ultimaSincronizacao: "2026-07-07T10:42:05Z" }
];

const componentes = [
  { id: "comp-demo-p", codigo: "P", nome: "Lingua Portuguesa" },
  { id: "comp-demo-m", codigo: "M", nome: "Matematica" },
  { id: "comp-demo-c", codigo: "C", nome: "Ciencias" },
  { id: "comp-demo-h", codigo: "H", nome: "Historia" },
  { id: "comp-demo-g", codigo: "G", nome: "Geografia" }
];

const estudantes = turmas.flatMap((turma, turmaIndex) =>
  Array.from({ length: 7 }, (_, index) => ({
    id: `${turma.id}-est-${index + 1}`,
    nome: `Estudante ${turma.codigo}-${String(index + 1).padStart(2, "0")}`,
    codigo: `DEMO-${turma.codigo}-${String(index + 1).padStart(2, "0")}`,
    turmaId: turma.id,
    situacaoMatricula: index === 6 && turmaIndex % 2 === 0 ? "transferencia simulada" : "ativo"
  }))
);

const lancamentos = estudantes.flatMap((estudante, estudanteIndex) =>
  componentes.map((componente, componenteIndex) => {
    const base = 54 + ((estudanteIndex * 7 + componenteIndex * 5) % 38);
    const ajuste = estudante.situacaoMatricula === "ativo" ? 0 : -4;
    const notaFinal = Math.max(35, Math.min(98, base + ajuste));
    return {
      id: `${estudante.id}-${componente.id}`,
      estudanteId: estudante.id,
      turmaId: estudante.turmaId,
      componenteId: componente.id,
      notaT1: Math.max(0, Math.round((notaFinal * 0.3) * 10) / 10),
      notaT2: Math.max(0, Math.round((notaFinal * 0.3) * 10) / 10),
      notaT3: Math.max(0, Math.round((notaFinal * 0.4) * 10) / 10),
      total: notaFinal,
      totalRec: notaFinal < 60 ? Math.min(60, notaFinal + 8) : notaFinal,
      notaFinal,
      origem: "fixture-demo"
    };
  })
);

const importacoes = [
  {
    id: "imp-demo-001",
    arquivo: "POC_TB_EXPORT_NOTAS_CORRIGIDO_20260707.xlsb",
    status: "concluido",
    inicio: "2026-07-07T12:32:46Z",
    fim: "2026-07-07T12:33:18Z",
    linhas: 138,
    alertas: 0
  },
  {
    id: "imp-demo-002",
    arquivo: "agenda-demo-matematica.xlsb",
    status: "concluido_com_alertas",
    inicio: "2026-07-07T12:10:11Z",
    fim: "2026-07-07T12:11:04Z",
    linhas: 322,
    alertas: 3
  },
  {
    id: "imp-demo-003",
    arquivo: "agenda-demo-portugues.xlsb",
    status: "pendente",
    inicio: "",
    fim: "",
    linhas: 0,
    alertas: 0
  }
];

const inconsistencias = [
  {
    id: "inc-demo-001",
    tipo: "aluno_sem_codigo",
    severidade: "alerta",
    turmaCodigo: "7B",
    componenteCodigo: "M",
    mensagem: "Linha ficticia sem identificador estavel de estudante."
  },
  {
    id: "inc-demo-002",
    tipo: "nota_fora_intervalo",
    severidade: "erro",
    turmaCodigo: "8C",
    componenteCodigo: "C",
    mensagem: "Valor demonstrativo fora da faixa esperada para a etapa."
  },
  {
    id: "inc-demo-003",
    tipo: "arquivo_bloqueado",
    severidade: "alerta",
    turmaCodigo: "9A",
    componenteCodigo: "P",
    mensagem: "Simulacao de bloqueio temporario apos leitura online."
  }
];

const statusPoc = [
  { rotulo: "Graph Workbook API", valor: "Aprovado em .xlsb" },
  { rotulo: "Excel Online Business", valor: "Pendente por conexao OAuth" },
  { rotulo: "Arquivo tecnico", valor: "POC_TB_EXPORT_NOTAS_CORRIGIDO_20260707.xlsb" },
  { rotulo: "Tabela", valor: "TB_EXPORT_NOTAS com 138 linhas e 16 colunas" },
  { rotulo: "Listas NOTAS_*", valor: "Nao provisionadas" },
  { rotulo: "Fluxo definitivo", valor: "Nao criado" }
];

const estrutura = [
  "NOTAS_CONFIGURACOES",
  "NOTAS_TURMAS",
  "NOTAS_COMPONENTES",
  "NOTAS_ALUNOS",
  "NOTAS_MATRICULAS",
  "NOTAS_LANCAMENTOS",
  "NOTAS_IMPORTACOES",
  "NOTAS_INCONSISTENCIAS",
  "NOTAS_AUDITORIA"
];

const demoData = Object.freeze({
  turmas,
  componentes,
  estudantes,
  lancamentos,
  importacoes,
  inconsistencias,
  statusPoc,
  estrutura
});

export { demoData };
