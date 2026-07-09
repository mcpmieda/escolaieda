function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function classificarMedia(media) {
  if (!Number.isFinite(media)) return "critico";
  if (media >= 70) return "regular";
  if (media >= 60) return "atencao";
  return "critico";
}

function rotuloSituacao(situacao) {
  return {
    regular: "Regular",
    atencao: "Atenção",
    critico: "Crítico"
  }[situacao] || "Crítico";
}

function formatarMedia(valor) {
  if (!Number.isFinite(valor)) return "0,0";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function media(lista) {
  const numeros = lista.filter((valor) => Number.isFinite(valor));
  if (!numeros.length) return 0;
  return numeros.reduce((total, valor) => total + valor, 0) / numeros.length;
}

function obterMapas(dados) {
  return {
    turmas: new Map(dados.turmas.map((turma) => [turma.id, turma])),
    componentes: new Map(dados.componentes.map((componente) => [componente.id, componente])),
    estudantes: new Map(dados.estudantes.map((estudante) => [estudante.id, estudante]))
  };
}

function listarEstudantesComResumo(dados) {
  const mapas = obterMapas(dados);
  return dados.estudantes.map((estudante) => {
    const notas = dados.lancamentos.filter((lancamento) => lancamento.estudanteId === estudante.id);
    const mediaFinal = media(notas.map((nota) => Number(nota.notaFinal)));
    const situacao = classificarMedia(mediaFinal);
    const lancamentos = notas.map((nota) => ({
      ...nota,
      componente: mapas.componentes.get(nota.componenteId)
    }));
    return {
      ...estudante,
      turma: mapas.turmas.get(estudante.turmaId),
      componentes: notas.length,
      mediaFinal,
      situacao,
      resultadoFinal: calcularResultadoEstudante({ ...estudante, lancamentos }),
      lancamentos
    };
  });
}

function resumirTurmas(dados) {
  const estudantesResumo = listarEstudantesComResumo(dados);
  return dados.turmas.map((turma) => {
    const estudantesTurma = estudantesResumo.filter((estudante) => estudante.turmaId === turma.id);
    const contagem = contarSituacoes(estudantesTurma);
    const resultados = contarResultados(estudantesTurma);
    return {
      ...turma,
      totalEstudantes: estudantesTurma.length,
      mediaFinal: media(estudantesTurma.map((estudante) => estudante.mediaFinal)),
      regular: contagem.regular,
      atencao: contagem.atencao,
      critico: contagem.critico,
      resultados
    };
  });
}

function contarSituacoes(estudantes) {
  return estudantes.reduce((total, estudante) => {
    total[estudante.situacao] = (total[estudante.situacao] || 0) + 1;
    return total;
  }, { regular: 0, atencao: 0, critico: 0 });
}

function contarResultados(estudantes) {
  return estudantes.reduce((total, estudante) => {
    total[estudante.resultadoFinal] = (total[estudante.resultadoFinal] || 0) + 1;
    return total;
  }, {
    "APROVADO DIRETO": 0,
    "APROVADO APÓS RECUPERAÇÃO": 0,
    "APROVADO PELO CONSELHO": 0,
    "REPROVADO PELO CONSELHO": 0,
    "REPROVADO": 0
  });
}

function filtrarEstudantes(estudantes, filtros) {
  const busca = normalizarTexto(filtros.busca);
  return estudantes.filter((estudante) => {
    const turmaCodigo = estudante.turma?.codigo || "";
    const componentes = estudante.lancamentos.map((nota) => `${nota.componente?.codigo || ""} ${nota.componente?.nome || ""}`).join(" ");
    const texto = normalizarTexto(`${estudante.nome} ${estudante.codigo} ${turmaCodigo} ${componentes}`);
    const combinaBusca = !busca || texto.includes(busca);
    const combinaTurma = filtros.turma === "todas" || estudante.turmaId === filtros.turma;
    const combinaSituacao = filtros.situacao === "todas" || estudante.situacao === filtros.situacao;
    const combinaComponente = filtros.componente === "todos" || estudante.lancamentos.some((nota) => nota.componenteId === filtros.componente);
    return combinaBusca && combinaTurma && combinaSituacao && combinaComponente;
  });
}

function calcularResumoGeral(dados) {
  const estudantesResumo = listarEstudantesComResumo(dados);
  const contagem = contarSituacoes(estudantesResumo);
  const resultados = contarResultados(estudantesResumo);
  const importacoesComProblema = dados.importacoes.filter((item) => item.status !== "concluido").length;
  return {
    totalTurmas: dados.turmas.length,
    totalEstudantes: estudantesResumo.length,
    totalComponentes: dados.componentes.length,
    mediaGeral: media(estudantesResumo.map((estudante) => estudante.mediaFinal)),
    importacoesComProblema,
    inconsistencias: dados.inconsistencias.length,
    regular: contagem.regular,
    atencao: contagem.atencao,
    critico: contagem.critico,
    resultados
  };
}

function filtrarTurmasPorEstudantes(turmas, estudantesFiltrados) {
  const ids = new Set(estudantesFiltrados.map((estudante) => estudante.turmaId));
  return turmas.filter((turma) => ids.has(turma.id));
}

function calcularResultadoEstudante(estudante) {
  const notas = estudante.lancamentos || [];
  if (!notas.length) return "REPROVADO";
  const todasDiretas = notas.every((nota) => Number(nota.total) >= 60);
  const todasComRecuperacao = notas.every((nota) => Number(nota.total) >= 60 || Number(nota.totalRec) >= 60);
  if (todasDiretas) return "APROVADO DIRETO";
  if (todasComRecuperacao) return "APROVADO APÓS RECUPERAÇÃO";
  if (estudante.decisaoConselho === "aprovado") return "APROVADO PELO CONSELHO";
  if (estudante.decisaoConselho === "reprovado") return "REPROVADO PELO CONSELHO";
  return "REPROVADO";
}

function resumirEtapas(lancamentos) {
  return [
    { codigo: "T1", rotulo: "I trimestre", maximo: 30, media: media(lancamentos.map((nota) => Number(nota.notaT1))) },
    { codigo: "T2", rotulo: "II trimestre", maximo: 30, media: media(lancamentos.map((nota) => Number(nota.notaT2))) },
    { codigo: "T3", rotulo: "III trimestre", maximo: 40, media: media(lancamentos.map((nota) => Number(nota.notaT3))) },
    { codigo: "TOT", rotulo: "Total anual", maximo: 100, media: media(lancamentos.map((nota) => Number(nota.total))) },
    { codigo: "REC", rotulo: "Após recuperação", maximo: 100, media: media(lancamentos.map((nota) => Number(nota.totalRec))) }
  ];
}

function resumirComponentes(dados, estudantesFiltrados = null) {
  const estudantesIds = estudantesFiltrados ? new Set(estudantesFiltrados.map((estudante) => estudante.id)) : null;
  return dados.componentes.map((componente) => {
    const lancamentos = dados.lancamentos.filter((nota) => nota.componenteId === componente.id && (!estudantesIds || estudantesIds.has(nota.estudanteId)));
    const situacoes = contarSituacoes(lancamentos.map((nota) => ({ situacao: classificarMedia(Number(nota.notaFinal)) })));
    return {
      ...componente,
      lancamentos: lancamentos.length,
      mediaT1: media(lancamentos.map((nota) => Number(nota.notaT1))),
      mediaT2: media(lancamentos.map((nota) => Number(nota.notaT2))),
      mediaT3: media(lancamentos.map((nota) => Number(nota.notaT3))),
      mediaTotal: media(lancamentos.map((nota) => Number(nota.total))),
      mediaFinal: media(lancamentos.map((nota) => Number(nota.notaFinal))),
      regular: situacoes.regular,
      atencao: situacoes.atencao,
      critico: situacoes.critico
    };
  });
}

export {
  calcularResultadoEstudante,
  calcularResumoGeral,
  classificarMedia,
  filtrarEstudantes,
  filtrarTurmasPorEstudantes,
  formatarMedia,
  listarEstudantesComResumo,
  normalizarTexto,
  resumirComponentes,
  resumirEtapas,
  resumirTurmas,
  rotuloSituacao
};
