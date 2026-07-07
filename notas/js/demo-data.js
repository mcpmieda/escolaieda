const turmas = [
  { id: "turma-demo-6a", codigo: "6A", nome: "6A - Demonstração", anoLetivo: 2026, etapa: "Anos Finais", turno: "Matutino", sala: "Sala 06", ultimaSincronizacao: "2026-07-07T12:32:46Z" },
  { id: "turma-demo-7b", codigo: "7B", nome: "7B - Demonstração", anoLetivo: 2026, etapa: "Anos Finais", turno: "Vespertino", sala: "Sala 09", ultimaSincronizacao: "2026-07-07T12:18:10Z" },
  { id: "turma-demo-8c", codigo: "8C", nome: "8C - Demonstração", anoLetivo: 2026, etapa: "Anos Finais", turno: "Matutino", sala: "Sala 11", ultimaSincronizacao: "2026-07-07T11:54:38Z" },
  { id: "turma-demo-9a", codigo: "9A", nome: "9A - Demonstração", anoLetivo: 2026, etapa: "Anos Finais", turno: "Vespertino", sala: "Sala 13", ultimaSincronizacao: "2026-07-07T10:42:05Z" }
];

const componentes = [
  { id: "comp-demo-p", codigo: "P", nome: "Língua Portuguesa", area: "Linguagens" },
  { id: "comp-demo-m", codigo: "M", nome: "Matemática", area: "Matemática" },
  { id: "comp-demo-c", codigo: "C", nome: "Ciências", area: "Ciências da Natureza" },
  { id: "comp-demo-h", codigo: "H", nome: "História", area: "Ciências Humanas" },
  { id: "comp-demo-g", codigo: "G", nome: "Geografia", area: "Ciências Humanas" },
  { id: "comp-demo-a", codigo: "A", nome: "Arte", area: "Linguagens" },
  { id: "comp-demo-ef", codigo: "EF", nome: "Educação Física", area: "Linguagens" },
  { id: "comp-demo-i", codigo: "I", nome: "Inglês", area: "Linguagens" },
  { id: "comp-demo-er", codigo: "ER", nome: "Ensino Religioso", area: "Formação Humana" },
  { id: "comp-demo-r", codigo: "R", nome: "Redação", area: "Linguagens" },
  { id: "comp-demo-pv", codigo: "PV", nome: "Projeto de Vida", area: "Formação Humana" },
  { id: "comp-demo-eo", codigo: "EO", nome: "Estudos Orientados", area: "Acompanhamento" }
];

const estudantes = turmas.flatMap((turma, turmaIndex) =>
  Array.from({ length: 10 }, (_, index) => ({
    id: `${turma.id}-est-${index + 1}`,
    nome: `Estudante ${turma.codigo}-${String(index + 1).padStart(2, "0")}`,
    codigo: `DEMO-${turma.codigo}-${String(index + 1).padStart(2, "0")}`,
    turmaId: turma.id,
    linhaOrigem: index + 1,
    situacaoMatricula: index === 9 && turmaIndex % 2 === 0 ? "transferência simulada" : "ativo"
  }))
);

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function umaCasa(valor) {
  return Math.round(valor * 10) / 10;
}

const lancamentos = estudantes.flatMap((estudante, estudanteIndex) =>
  componentes.map((componente, componenteIndex) => {
    const assinatura = estudanteIndex * 11 + componenteIndex * 7 + estudante.linhaOrigem * 3;
    const vulnerabilidade = estudante.linhaOrigem % 9 === 0 ? -9 : estudante.linhaOrigem % 6 === 0 ? -5 : 0;
    const ajusteTransferencia = estudante.situacaoMatricula === "ativo" ? 0 : -6;
    const notaT1 = umaCasa(limitar(16 + (assinatura % 15) + vulnerabilidade, 8, 30));
    const notaT2 = umaCasa(limitar(15 + ((assinatura + 5) % 16) + vulnerabilidade, 8, 30));
    const notaT3 = umaCasa(limitar(21 + ((assinatura + 9) % 19) + vulnerabilidade + ajusteTransferencia, 10, 40));
    const total = umaCasa(notaT1 + notaT2 + notaT3);
    const recT1 = total < 60 ? umaCasa(limitar(notaT1 + 2 + (componenteIndex % 3), notaT1, 30)) : notaT1;
    const recT2 = total < 60 ? umaCasa(limitar(notaT2 + 2 + (estudanteIndex % 3), notaT2, 30)) : notaT2;
    const recT3 = total < 60 ? umaCasa(limitar(notaT3 + 3 + (assinatura % 4), notaT3, 40)) : notaT3;
    const totalRec = umaCasa(limitar(recT1 + recT2 + recT3, total, 100));
    const notaFinal = umaCasa(Math.max(total, totalRec));

    return {
      id: `${estudante.id}-${componente.id}`,
      estudanteId: estudante.id,
      turmaId: estudante.turmaId,
      componenteId: componente.id,
      periodo: "Anual",
      notaT1,
      notaT2,
      notaT3,
      total,
      recT1,
      recT2,
      recT3,
      totalRec,
      notaFinal,
      faltas: (assinatura + estudanteIndex) % 8,
      origem: "fixture-demo"
    };
  })
);

const importacoes = [
  {
    id: "imp-demo-001",
    arquivo: "POC_TB_EXPORT_NOTAS_CORRIGIDO_20260707.xlsb",
    professor: "Docente demonstração 01",
    status: "concluido",
    inicio: "2026-07-07T12:32:46Z",
    fim: "2026-07-07T12:33:18Z",
    linhas: 138,
    alertas: 0
  },
  {
    id: "imp-demo-002",
    arquivo: "agenda-demo-matematica.xlsb",
    professor: "Docente demonstração 02",
    status: "concluido_com_alertas",
    inicio: "2026-07-07T12:10:11Z",
    fim: "2026-07-07T12:11:04Z",
    linhas: 322,
    alertas: 3
  },
  {
    id: "imp-demo-003",
    arquivo: "agenda-demo-portugues.xlsb",
    professor: "Docente demonstração 03",
    status: "pendente",
    inicio: "",
    fim: "",
    linhas: 0,
    alertas: 0
  },
  {
    id: "imp-demo-004",
    arquivo: "agenda-demo-ciencias.xlsb",
    professor: "Docente demonstração 04",
    status: "erro",
    inicio: "2026-07-07T10:40:11Z",
    fim: "2026-07-07T10:41:22Z",
    linhas: 46,
    alertas: 1
  }
];

const inconsistencias = [
  {
    id: "inc-demo-001",
    tipo: "aluno_sem_codigo",
    severidade: "alerta",
    turmaCodigo: "7B",
    componenteCodigo: "M",
    mensagem: "Linha fictícia sem identificador estável de estudante."
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
    mensagem: "Simulação de bloqueio temporário após leitura online."
  }
];

const statusPoc = [
  { rotulo: "Graph Workbook API", valor: "Aprovado em .xlsb" },
  { rotulo: "Excel Online Business", valor: "Pendente por conexão OAuth" },
  { rotulo: "Arquivo técnico", valor: "POC_TB_EXPORT_NOTAS_CORRIGIDO_20260707.xlsb" },
  { rotulo: "Tabela", valor: "TB_EXPORT_NOTAS com 138 linhas e 16 colunas" },
  { rotulo: "Listas NOTAS_*", valor: "Não provisionadas" },
  { rotulo: "Fluxo definitivo", valor: "Não criado" }
];

const estrutura = [
  "NOTAS_CONFIGURACOES",
  "NOTAS_ANOS_LETIVOS",
  "NOTAS_TURMAS",
  "NOTAS_COMPONENTES",
  "NOTAS_ALUNOS",
  "NOTAS_MATRICULAS",
  "NOTAS_PROFESSORES",
  "NOTAS_VINCULOS_PLANILHAS",
  "NOTAS_AVALIACOES",
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
