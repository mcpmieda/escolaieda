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

const nomesFicticios = [
  "Beatriz Rocha Dantas",
  "Caio Henrique Lopes",
  "Dara Vitória Melo",
  "Enzo Gabriel Nunes",
  "Fernanda Luz Pires",
  "Gustavo Martins Souza",
  "Heloísa Prado Lima",
  "Igor Matheus Barreto",
  "Júlia Andrade Costa",
  "Kauã Rafael Moura",
  "Laura Cristina Farias",
  "Miguel Arantes Silva",
  "Nicolas Porto Santana",
  "Otávio Prado Ribeiro",
  "Pietra Souza Carvalho",
  "Rafaela Dias Teixeira",
  "Samuel Correia Lima",
  "Tainá Barbosa Reis",
  "Victor Hugo Ramos",
  "Yasmin Monteiro Alves",
  "Bruno César Almeida",
  "Camila Neves Rocha",
  "Diego Vinícius Araújo",
  "Eduarda Melo Torres",
  "Fábio Henrique Macedo",
  "Giovana Duarte Reis",
  "Heitor Paiva Gomes",
  "Isadora Lima Castro",
  "João Vitor Cardoso",
  "Larissa Queiroz Nunes",
  "Marcos Paulo Vieira",
  "Natália Fontes Brito",
  "Pedro Lucas Matos",
  "Raquel Fernandes Assis",
  "Sofia Valença Moreira",
  "Thiago Almeida Prado",
  "Valentina Campos Neves",
  "Wesley Brito Sampaio",
  "Yuri Gabriel Azevedo",
  "Zoe Martins Peixoto"
];

const perfisResultado = [
  "direto",
  "recuperacao",
  "conselho_aprovado",
  "conselho_reprovado",
  "reprovado",
  "direto",
  "recuperacao",
  "direto",
  "conselho_aprovado",
  "reprovado"
];

const estudantes = turmas.flatMap((turma, turmaIndex) =>
  Array.from({ length: 10 }, (_, index) => {
    const perfilResultado = perfisResultado[(index + turmaIndex) % perfisResultado.length];
    return {
      id: `${turma.id}-est-${index + 1}`,
      nome: nomesFicticios[turmaIndex * 10 + index],
      codigo: `DEMO-${turma.codigo}-${String(index + 1).padStart(2, "0")}`,
      turmaId: turma.id,
      linhaOrigem: index + 1,
      perfilResultado,
      decisaoConselho: perfilResultado === "conselho_aprovado" ? "aprovado" : perfilResultado === "conselho_reprovado" ? "reprovado" : "",
      situacaoMatricula: index === 9 && turmaIndex % 2 === 0 ? "transferência simulada" : "ativo"
    };
  })
);

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function umaCasa(valor) {
  return Math.round(valor * 10) / 10;
}

function gerarNotasDemo(estudante, estudanteIndex, componenteIndex) {
  const assinatura = estudanteIndex * 11 + componenteIndex * 7 + estudante.linhaOrigem * 3;
  const ajusteTransferencia = estudante.situacaoMatricula === "ativo" ? 0 : -4;
  const perfil = estudante.perfilResultado;
  const componenteCritico = componenteIndex % 4 === 0;
  const componenteMuitoCritico = componenteIndex % 5 === 0;
  let notaT1;
  let notaT2;
  let notaT3;
  let recT1;
  let recT2;
  let recT3;

  if (perfil === "direto") {
    notaT1 = limitar(20 + (assinatura % 8), 0, 30);
    notaT2 = limitar(20 + ((assinatura + 3) % 8), 0, 30);
    notaT3 = limitar(25 + ((assinatura + 7) % 12) + ajusteTransferencia, 0, 40);
  } else if (perfil === "recuperacao" && componenteCritico) {
    notaT1 = limitar(14 + (assinatura % 3), 0, 30);
    notaT2 = limitar(15 + ((assinatura + 2) % 3), 0, 30);
    notaT3 = limitar(19 + ((assinatura + 4) % 4) + ajusteTransferencia, 0, 40);
  } else if (perfil === "recuperacao") {
    notaT1 = limitar(18 + (assinatura % 5), 0, 30);
    notaT2 = limitar(18 + ((assinatura + 2) % 5), 0, 30);
    notaT3 = limitar(24 + ((assinatura + 4) % 7) + ajusteTransferencia, 0, 40);
  } else if (componenteMuitoCritico) {
    notaT1 = limitar(10 + (assinatura % 4), 0, 30);
    notaT2 = limitar(12 + ((assinatura + 2) % 4), 0, 30);
    notaT3 = limitar(16 + ((assinatura + 4) % 5) + ajusteTransferencia, 0, 40);
  } else {
    notaT1 = limitar(17 + (assinatura % 6), 0, 30);
    notaT2 = limitar(17 + ((assinatura + 2) % 6), 0, 30);
    notaT3 = limitar(22 + ((assinatura + 4) % 8) + ajusteTransferencia, 0, 40);
  }

  const total = umaCasa(notaT1 + notaT2 + notaT3);
  if (total < 60 && perfil === "recuperacao") {
    recT1 = limitar(20 + (assinatura % 4), notaT1, 30);
    recT2 = limitar(19 + ((assinatura + 2) % 4), notaT2, 30);
    recT3 = limitar(24 + ((assinatura + 4) % 6), notaT3, 40);
  } else if (total < 60) {
    recT1 = limitar(notaT1 + 3, notaT1, 30);
    recT2 = limitar(notaT2 + 3, notaT2, 30);
    recT3 = limitar(notaT3 + 4, notaT3, 40);
  } else {
    recT1 = notaT1;
    recT2 = notaT2;
    recT3 = notaT3;
  }

  recT1 = umaCasa(recT1);
  recT2 = umaCasa(recT2);
  recT3 = umaCasa(recT3);
  const totalRec = umaCasa(limitar(recT1 + recT2 + recT3, total, 100));
  const notaFinal = umaCasa(total >= 60 ? total : Math.max(total, totalRec));
  return {
    notaT1: umaCasa(notaT1),
    notaT2: umaCasa(notaT2),
    notaT3: umaCasa(notaT3),
    total,
    recT1,
    recT2,
    recT3,
    totalRec,
    notaFinal,
    faltas: (assinatura + estudanteIndex) % 8
  };
}

const lancamentos = estudantes.flatMap((estudante, estudanteIndex) =>
  componentes.map((componente, componenteIndex) => {
    const notas = gerarNotasDemo(estudante, estudanteIndex, componenteIndex);

    return {
      id: `${estudante.id}-${componente.id}`,
      estudanteId: estudante.id,
      turmaId: estudante.turmaId,
      componenteId: componente.id,
      periodo: "Anual",
      ...notas,
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
