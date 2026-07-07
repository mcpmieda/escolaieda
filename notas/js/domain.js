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
    atencao: "Atencao",
    critico: "Critico"
  }[situacao] || "Critico";
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
    return {
      ...estudante,
      turma: mapas.turmas.get(estudante.turmaId),
      componentes: notas.length,
      mediaFinal,
      situacao,
      lancamentos: notas.map((nota) => ({
        ...nota,
        componente: mapas.componentes.get(nota.componenteId)
      }))
    };
  });
}

function resumirTurmas(dados) {
  const estudantesResumo = listarEstudantesComResumo(dados);
  return dados.turmas.map((turma) => {
    const estudantesTurma = estudantesResumo.filter((estudante) => estudante.turmaId === turma.id);
    const contagem = contarSituacoes(estudantesTurma);
    return {
      ...turma,
      totalEstudantes: estudantesTurma.length,
      mediaFinal: media(estudantesTurma.map((estudante) => estudante.mediaFinal)),
      regular: contagem.regular,
      atencao: contagem.atencao,
      critico: contagem.critico
    };
  });
}

function contarSituacoes(estudantes) {
  return estudantes.reduce((total, estudante) => {
    total[estudante.situacao] = (total[estudante.situacao] || 0) + 1;
    return total;
  }, { regular: 0, atencao: 0, critico: 0 });
}

function filtrarEstudantes(estudantes, filtros) {
  const busca = normalizarTexto(filtros.busca);
  return estudantes.filter((estudante) => {
    const turmaCodigo = estudante.turma?.codigo || "";
    const texto = normalizarTexto(`${estudante.nome} ${estudante.codigo} ${turmaCodigo}`);
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
  const importacoesComProblema = dados.importacoes.filter((item) => item.status !== "concluido").length;
  return {
    totalTurmas: dados.turmas.length,
    totalEstudantes: estudantesResumo.length,
    mediaGeral: media(estudantesResumo.map((estudante) => estudante.mediaFinal)),
    importacoesComProblema,
    inconsistencias: dados.inconsistencias.length,
    regular: contagem.regular,
    atencao: contagem.atencao,
    critico: contagem.critico
  };
}

function filtrarTurmasPorEstudantes(turmas, estudantesFiltrados) {
  const ids = new Set(estudantesFiltrados.map((estudante) => estudante.turmaId));
  return turmas.filter((turma) => ids.has(turma.id));
}

export {
  calcularResumoGeral,
  classificarMedia,
  filtrarEstudantes,
  filtrarTurmasPorEstudantes,
  formatarMedia,
  listarEstudantesComResumo,
  normalizarTexto,
  resumirTurmas,
  rotuloSituacao
};
