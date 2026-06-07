import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const STATUS_UPLOAD_ENVIADO = "Enviado";
const STATUS_UPLOAD_AVISO = "Enviado — não reenviar";
const STATUS_UPLOAD_NAO_ENVIADO = "Não enviado";
const STATUS_UPLOAD_REPROCESSAVEIS = new Set(["Pendente", STATUS_UPLOAD_NAO_ENVIADO]);
const STATUS_UPLOAD_NAO_REENVIAR = new Set([STATUS_UPLOAD_ENVIADO, STATUS_UPLOAD_AVISO, "Conflito"]);
const LIMITE_UPLOAD_SIMPLES_BYTES = 25 * 1024 * 1024;
const LIMITE_RECENTES = 20;
const TAMANHO_PAGINA = 50;
const LIMITE_ANALISE_DUPLICIDADES_EXAUSTIVA = 120;
const LIMITE_PAINEL_ABRE_ANTES_CONTEUDO_MS = 20;

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function limparNomeArquivoPdf(nome) {
  const base = String(nome || "DOCUMENTO")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`;
}

function separarNomePdf(nome) {
  const nomeLimpo = limparNomeArquivoPdf(nome);
  return {
    base: nomeLimpo.replace(/\.pdf$/i, "").trim() || "DOCUMENTO",
    extensao: ".pdf"
  };
}

function gerarNomeLivreUploadPdfComOcupados(nomeSolicitado, ocupados) {
  const partes = separarNomePdf(nomeSolicitado);
  let candidato = `${partes.base}${partes.extensao}`;

  if (!ocupados.has(normalizarTexto(candidato))) return candidato;

  for (let numero = 2; numero <= 9999; numero++) {
    candidato = `${partes.base} (${numero})${partes.extensao}`;
    if (!ocupados.has(normalizarTexto(candidato))) return candidato;
  }

  return `${partes.base} (${Date.now()})${partes.extensao}`;
}

function criarDocumentos(quantidade) {
  const gavetas = ["MATRICULA", "HISTORICO", "DECLARACOES", "TRANSFERENCIA"];
  const ativos = [];
  const lixeira = [];

  for (let indice = 0; indice < quantidade; indice++) {
    const numero = String(indice + 1).padStart(5, "0");
    const grupoDuplicado = Math.floor(indice / 18);
    const nomeComum = indice % 9 === 0 ? `ALUNO COMUM ${String(grupoDuplicado).padStart(5, "0")}.pdf` : "";
    const nomeAcento = indice % 37 === 0 ? `JOAO ACENTUACAO ${numero}.pdf` : "";
    const nome = nomeComum || nomeAcento || `ALUNO TESTE ${numero} TURMA ${indice % 12}.pdf`;
    const documento = {
      id: `arquivo-${numero}`,
      nome,
      gaveta: gavetas[indice % gavetas.length],
      status: indice % 11 === 0 ? "ARQUIVADO" : "ATIVO",
      modificado: new Date(Date.now() - indice * 60000).toISOString(),
      nomeBusca: normalizarTexto(nome)
    };

    if (documento.status === "ARQUIVADO") lixeira.push(documento);
    else ativos.push(documento);
  }

  return { ativos, lixeira };
}

function montarRecentes(ativos) {
  return [...ativos].sort((a, b) => new Date(b.modificado) - new Date(a.modificado)).slice(0, LIMITE_RECENTES);
}

function escolherBaseLista({ modo, termo, ativos, lixeira }) {
  if (modo === "na Lixeira") return lixeira;
  if (modo === "recentes" && termo) return ativos;
  if (modo === "recentes") return montarRecentes(ativos);
  return ativos;
}

function filtrarDocumentos({ modo, termo, gaveta, ativos, lixeira }) {
  const termoNormalizado = normalizarTexto(termo);
  const base = escolherBaseLista({ modo, termo: termoNormalizado, ativos, lixeira });
  return base.filter(doc => {
    if (modo === "ativos" && gaveta && doc.gaveta !== gaveta) return false;
    if (!termoNormalizado) return true;
    return doc.nomeBusca.includes(termoNormalizado);
  });
}

function paginar(lista, pagina = 1) {
  return lista.slice(0, pagina * TAMANHO_PAGINA);
}

function chaveNomeVisual(nome) {
  return normalizarTexto(String(nome || "").replace(/\s+\(\d+\)(?=\.pdf$)/i, ""));
}

function gerarParesDuplicidadesIndexado(documentos, ignorados = new Set()) {
  const grupos = new Map();
  for (const doc of documentos) {
    const chave = chaveNomeVisual(doc.nome);
    if (!chave) continue;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(doc);
  }

  const pares = [];
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue;
    for (let i = 0; i < grupo.length; i++) {
      for (let j = i + 1; j < grupo.length; j++) {
        const chavePar = [grupo[i].id, grupo[j].id].sort().join("|");
        if (!ignorados.has(chavePar)) pares.push([grupo[i], grupo[j]]);
      }
    }
  }
  return pares;
}

function analisarDuplicidades(documentos, ignorados = new Set()) {
  const usaIndice = documentos.length > LIMITE_ANALISE_DUPLICIDADES_EXAUSTIVA;
  return {
    usaIndice,
    pares: gerarParesDuplicidadesIndexado(documentos, ignorados)
  };
}

function assinaturaDuplicidades(documentos, ignorados = new Set()) {
  const docs = documentos
    .map(doc => `${doc.id}:${doc.nome}:${doc.status || ""}:${doc.modificado || ""}`)
    .sort()
    .join("||");
  return `${docs}::${[...ignorados].sort().join("|")}`;
}

function renderizarPrimeiraPaginaSimulada(documentos) {
  return paginar(documentos).map(doc => ({
    id: doc.id,
    nome: doc.nome,
    gaveta: doc.gaveta,
    status: doc.status
  }));
}

function abrirPainelSimulado(documento) {
  const inicio = performance.now();
  const estado = {
    aberto: true,
    documentoId: documento.id,
    conteudoPesadoCarregado: false
  };
  const tempoAbertura = performance.now() - inicio;
  const carregarConteudoPesado = () => {
    estado.conteudoPesadoCarregado = true;
    return estado;
  };
  return { estado, tempoAbertura, carregarConteudoPesado };
}

function calcularAnaliseUpload(arquivos, documentosAtivos, statusArquivos = [], resultados = []) {
  const ocupadosAntesEnvio = new Set(documentosAtivos.map(doc => normalizarTexto(doc.nome)));
  const ocupadosDuranteAnalise = new Set(ocupadosAntesEnvio);
  const vistosNaSelecao = new Set();

  return arquivos.map((arquivo, indice) => {
    const nomeSolicitado = limparNomeArquivoPdf(arquivo.name);
    const chave = normalizarTexto(nomeSolicitado);
    const statusAtual = statusArquivos[indice] || "Pendente";
    const resultado = resultados[indice];
    const jaEnviado = STATUS_UPLOAD_NAO_REENVIAR.has(statusAtual) && resultado?.nomeFinal;
    const nomeJaExistiaAntes = !jaEnviado && ocupadosAntesEnvio.has(chave);
    const repetidoNaSelecao = !jaEnviado && vistosNaSelecao.has(chave);
    const nomeFinalPrevisto = jaEnviado
      ? resultado.nomeFinal
      : gerarNomeLivreUploadPdfComOcupados(nomeSolicitado, ocupadosDuranteAnalise);
    const nomeFoiAjustado = normalizarTexto(nomeFinalPrevisto) !== chave;

    if (!jaEnviado) ocupadosDuranteAnalise.add(normalizarTexto(nomeFinalPrevisto));
    vistosNaSelecao.add(chave);

    return {
      nomeSolicitado,
      nomeJaExistiaAntes,
      repetidoNaSelecao,
      nomeFinalPrevisto,
      nomeFoiAjustado,
      nomeRepetido: nomeJaExistiaAntes || repetidoNaSelecao,
      arquivoGrande: (arquivo.size || 0) > LIMITE_UPLOAD_SIMPLES_BYTES
    };
  });
}

function resumirStatusUpload(statusArquivos) {
  return statusArquivos.reduce((resumo, status) => {
    if (status === STATUS_UPLOAD_AVISO) resumo.avisos++;
    else if (status === STATUS_UPLOAD_NAO_ENVIADO) resumo.naoEnviados++;
    else if (STATUS_UPLOAD_NAO_REENVIAR.has(status)) resumo.enviados++;
    resumo.processados++;
    return resumo;
  }, { processados: 0, enviados: 0, avisos: 0, naoEnviados: 0 });
}

function formatarResultadoFinalUpload(resumo) {
  const enviadosTotal = resumo.enviados + resumo.avisos;
  if (resumo.naoEnviados > 0) {
    return enviadosTotal > 0
      ? `${enviadosTotal} arquivo(s) enviado(s). ${resumo.naoEnviados} não foram enviados. Revise os itens em vermelho.`
      : "Nenhum arquivo foi enviado. Revise os itens em vermelho.";
  }
  if (resumo.avisos > 0) {
    return `${enviadosTotal} arquivo(s) enviado(s). ${resumo.avisos} precisam de atenção e não devem ser reenviados.`;
  }
  return `${enviadosTotal} arquivo(s) enviado(s) com sucesso.`;
}

function reconciliarUploadSimulado({ documentosAtivos, statusArquivos, resultados }) {
  const nomesAtivos = new Set(documentosAtivos.map(doc => normalizarTexto(doc.nome)));

  return resultados.map((resultado, indice) => {
    if (!resultado) return resultado;
    const statusAtual = statusArquivos[indice];
    const nomeFinal = resultado.nomeFinal || "";
    const existeNaLista = nomeFinal && nomesAtivos.has(normalizarTexto(nomeFinal));
    const temEvidenciaArquivoCriado = !!(resultado.arquivoExiste || resultado.documento || resultado.driveItemId || resultado.listItemId);

    if (existeNaLista && (statusAtual === STATUS_UPLOAD_NAO_ENVIADO || statusAtual === STATUS_UPLOAD_AVISO)) {
      const novoStatus = resultado.pendencias?.length ? STATUS_UPLOAD_AVISO : STATUS_UPLOAD_ENVIADO;
      statusArquivos[indice] = novoStatus;
      return { ...resultado, status: novoStatus, arquivoExiste: true };
    }

    if (!existeNaLista && statusAtual === STATUS_UPLOAD_AVISO && temEvidenciaArquivoCriado) {
      statusArquivos[indice] = STATUS_UPLOAD_AVISO;
      return {
        ...resultado,
        status: STATUS_UPLOAD_AVISO,
        arquivoExiste: true,
        pendencias: resultado.pendencias?.length ? resultado.pendencias : ["confirmar-listagem-sharepoint"]
      };
    }

    if (!existeNaLista && statusAtual === STATUS_UPLOAD_AVISO) {
      statusArquivos[indice] = STATUS_UPLOAD_NAO_ENVIADO;
      return { ...resultado, status: STATUS_UPLOAD_NAO_ENVIADO, arquivoExiste: false };
    }

    return resultado;
  });
}

function verificarSessaoInterrompidaIndexada(itens, documentos) {
  const porId = new Map(documentos.map(doc => [String(doc.listItemId || ""), doc]));
  const porNome = new Map(documentos.map(doc => [normalizarTexto(doc.nome), doc]));
  return itens.map(item => {
    const documento = porId.get(String(item.listItemId || ""))
      || porNome.get(normalizarTexto(item.nomeFinalReal || item.nomeFinalPrevisto));
    if (!documento) return { ...item, status: "nao-encontrado" };
    const tamanhoOk = Number(documento.size) === Number(item.tamanhoLocalBytes);
    return { ...item, status: tamanhoOk ? "enviado" : "enviado-atencao" };
  });
}

function selecionarReenvioNaoEncontradosIndexado(itens, arquivos) {
  const candidatos = new Map();
  itens.forEach((item, indice) => {
    if (item.status !== "nao-encontrado") return;
    const chave = `${normalizarTexto(item.nomeOriginal)}|${Number(item.tamanhoLocalBytes)}`;
    if (!candidatos.has(chave)) candidatos.set(chave, []);
    candidatos.get(chave).push(indice);
  });
  return arquivos.filter(arquivo => {
    const chave = `${normalizarTexto(arquivo.name)}|${Number(arquivo.size)}`;
    const fila = candidatos.get(chave);
    if (!fila?.length) return false;
    fila.shift();
    return true;
  });
}

function testar(nome, fn) {
  const inicio = performance.now();
  fn();
  const ms = performance.now() - inicio;
  console.log(`OK - ${nome} (${ms.toFixed(1)} ms)`);
  return ms;
}

function testarMassa(quantidade) {
  const { ativos, lixeira } = criarDocumentos(quantidade);
  const todos = [...ativos, ...lixeira];

  testar(`busca comum em ${quantidade} documentos`, () => {
    assert.ok(filtrarDocumentos({ modo: "ativos", termo: "ALUNO", ativos, lixeira }).length > 0);
  });

  testar(`busca rara em ${quantidade} documentos`, () => {
    assert.ok(filtrarDocumentos({ modo: "ativos", termo: "99999", ativos, lixeira }).length === 0);
    assert.equal(filtrarDocumentos({ modo: "ativos", termo: ativos[5].nome, ativos, lixeira })[0]?.id, ativos[5].id);
  });

  testar(`recentes com busca em ${quantidade} documentos`, () => {
    assert.ok(filtrarDocumentos({ modo: "ativos", termo: "TURMA 3", ativos, lixeira }).length > 0);
    assert.ok(filtrarDocumentos({ modo: "recentes", termo: "ALUNO", ativos, lixeira }).length > LIMITE_RECENTES);
  });

  testar(`lixeira e gaveta em ${quantidade} documentos`, () => {
    assert.ok(filtrarDocumentos({ modo: "na Lixeira", termo: "PDF", ativos, lixeira }).every(doc => doc.status === "ARQUIVADO"));
    assert.ok(filtrarDocumentos({ modo: "ativos", termo: "ALUNO", gaveta: "MATRICULA", ativos, lixeira }).every(doc => doc.gaveta === "MATRICULA"));
  });

  testar(`recentes sem busca e paginacao em ${quantidade} documentos`, () => {
    const recentesSemBusca = filtrarDocumentos({ modo: "recentes", termo: "", ativos, lixeira });
    const recentesComBusca = filtrarDocumentos({ modo: "recentes", termo: "ALUNO", ativos, lixeira });
    assert.ok(recentesSemBusca.length <= LIMITE_RECENTES);
    assert.ok(recentesComBusca.length > LIMITE_RECENTES);
    assert.equal(paginar(recentesComBusca).length, Math.min(TAMANHO_PAGINA, recentesComBusca.length));
    assert.equal(paginar(recentesComBusca, 2).length, Math.min(TAMANHO_PAGINA * 2, recentesComBusca.length));
  });

  testar(`renderizacao simulada/paginacao em ${quantidade} documentos`, () => {
    const primeiraPagina = renderizarPrimeiraPaginaSimulada(todos);
    assert.equal(primeiraPagina.length, Math.min(TAMANHO_PAGINA, todos.length));
    assert.ok(primeiraPagina.length < todos.length || todos.length <= TAMANHO_PAGINA);
  });

  testar(`duplicidades em ${quantidade} documentos`, () => {
    const inicio = performance.now();
    const analise = analisarDuplicidades(todos);
    const duracao = performance.now() - inicio;
    assert.equal(analise.usaIndice, todos.length > LIMITE_ANALISE_DUPLICIDADES_EXAUSTIVA);
    assert.ok(analise.pares.length > 0);
    assert.ok(duracao < 3000, `Duplicidades demorou ${duracao.toFixed(1)} ms`);

    const docA = { id: "a", nome: "João.2026.pdf" };
    const docB = { id: "b", nome: "JOAO 2026.pdf" };
    const ignorados = new Set(["a|b"]);
    assert.equal(analisarDuplicidades([docA, docB]).pares.length, 0);
    assert.equal(analisarDuplicidades([{ id: "c", nome: "MARIA 1.pdf" }, { id: "d", nome: "MARIA 1.pdf" }]).pares.length, 1);
    assert.equal(analisarDuplicidades([{ id: "a", nome: "MARIA 1.pdf" }, { id: "b", nome: "MARIA 1.pdf" }], ignorados).pares.length, 0);
  });

  testar(`assinatura/cache duplicidades em ${quantidade} documentos`, () => {
    const assinaturaA = assinaturaDuplicidades(todos);
    const assinaturaB = assinaturaDuplicidades([...todos].reverse());
    assert.equal(assinaturaA, assinaturaB);
    assert.ok(assinaturaA.length > todos.length);
  });

  testar(`painel abre antes de conteudo pesado em ${quantidade} documentos`, () => {
    const painel = abrirPainelSimulado(ativos[0]);
    assert.equal(painel.estado.aberto, true);
    assert.equal(painel.estado.conteudoPesadoCarregado, false);
    assert.ok(painel.tempoAbertura < LIMITE_PAINEL_ABRE_ANTES_CONTEUDO_MS, `Abertura visual demorou ${painel.tempoAbertura.toFixed(1)} ms`);
    painel.carregarConteudoPesado();
    assert.equal(painel.estado.conteudoPesadoCarregado, true);
  });

  testar(`upload e mensagens em ${quantidade} documentos`, () => {
    const arquivos = [
      { name: "DOCUMENTO NOVO.pdf", size: 1024 },
      { name: ativos[0].nome, size: 2048 },
      { name: "REPETIDO SELECAO.pdf", size: 4096 },
      { name: "REPETIDO SELECAO.pdf", size: 4096 },
      { name: "ARQUIVO GRANDE.pdf", size: LIMITE_UPLOAD_SIMPLES_BYTES + 1 }
    ];
    const analise = calcularAnaliseUpload(arquivos, ativos);
    assert.equal(analise[0].nomeRepetido, false);
    assert.equal(analise[0].nomeFinalPrevisto, "DOCUMENTO NOVO.pdf");
    assert.equal(analise[1].nomeJaExistiaAntes, true);
    assert.match(analise[1].nomeFinalPrevisto, /\(\d+\)\.pdf$/);
    assert.equal(analise[3].repetidoNaSelecao, true);
    assert.equal(analise[4].arquivoGrande, true);

    const status = [STATUS_UPLOAD_ENVIADO, STATUS_UPLOAD_AVISO, STATUS_UPLOAD_NAO_ENVIADO, "Pendente"];
    assert.deepEqual(status.map(item => STATUS_UPLOAD_REPROCESSAVEIS.has(item)), [false, false, true, true]);
    assert.match(formatarResultadoFinalUpload(resumirStatusUpload([STATUS_UPLOAD_ENVIADO, STATUS_UPLOAD_ENVIADO])), /com sucesso/);
    assert.match(formatarResultadoFinalUpload(resumirStatusUpload([STATUS_UPLOAD_AVISO, STATUS_UPLOAD_ENVIADO])), /precisam de atenção/);
    assert.match(formatarResultadoFinalUpload(resumirStatusUpload([STATUS_UPLOAD_ENVIADO, STATUS_UPLOAD_NAO_ENVIADO])), /não foram enviados/);
    assert.match(formatarResultadoFinalUpload(resumirStatusUpload([STATUS_UPLOAD_NAO_ENVIADO])), /Nenhum arquivo foi enviado/);
    assert.doesNotMatch(formatarResultadoFinalUpload(resumirStatusUpload([STATUS_UPLOAD_ENVIADO])), /0 enviado\(s\)|0 não enviado\(s\)|0 precisam/);
  });

  testar(`reconciliacao pos-upload em ${quantidade} documentos`, () => {
    const statusArquivos = [STATUS_UPLOAD_AVISO, STATUS_UPLOAD_AVISO, STATUS_UPLOAD_AVISO, STATUS_UPLOAD_NAO_ENVIADO];
    const resultados = [
      { nomeFinal: "AINDA NAO LISTADO.pdf", arquivoExiste: true, pendencias: ["historico"] },
      { nomeFinal: "DOCUMENTO POR ID.pdf", listItemId: "123" },
      { nomeFinal: "SEM EVIDENCIA.pdf" },
      { nomeFinal: ativos[0].nome }
    ];
    const reconciliados = reconciliarUploadSimulado({ documentosAtivos: ativos, statusArquivos, resultados });
    assert.equal(statusArquivos[0], STATUS_UPLOAD_AVISO);
    assert.equal(statusArquivos[1], STATUS_UPLOAD_AVISO);
    assert.equal(statusArquivos[2], STATUS_UPLOAD_NAO_ENVIADO);
    assert.equal(statusArquivos[3], STATUS_UPLOAD_ENVIADO);
    assert.equal(reconciliados[0].arquivoExiste, true);
    assert.ok(reconciliados[1].pendencias.includes("confirmar-listagem-sharepoint"));
  });

  testar(`sessao interrompida indexada em ${quantidade} documentos`, () => {
    const documentos = ativos.map((doc, indice) => ({ ...doc, listItemId: String(indice + 1), size: 1000 + indice }));
    const itens = documentos.map((doc, indice) => ({
      nomeOriginal: doc.nome,
      nomeFinalPrevisto: doc.nome,
      tamanhoLocalBytes: doc.size,
      listItemId: doc.listItemId
    }));
    itens.push({ nomeOriginal: "AUSENTE.pdf", nomeFinalPrevisto: "AUSENTE.pdf", tamanhoLocalBytes: 99, listItemId: "" });
    const resultado = verificarSessaoInterrompidaIndexada(itens, documentos);
    assert.equal(resultado.at(-1).status, "nao-encontrado");
    assert.ok(resultado.slice(0, -1).every(item => item.status === "enviado"));
  });

  testar(`reenvio indexado em ${quantidade} documentos`, () => {
    const itens = ativos.map((doc, indice) => ({
      nomeOriginal: doc.nome,
      tamanhoLocalBytes: 2000 + indice,
      status: indice % 3 === 0 ? "nao-encontrado" : "enviado"
    }));
    const arquivos = itens.map(item => ({ name: item.nomeOriginal, size: item.tamanhoLocalBytes }));
    arquivos.push({ name: "FORA DO LOTE.pdf", size: 1 });
    const selecionados = selecionarReenvioNaoEncontradosIndexado(itens, arquivos);
    assert.equal(selecionados.length, itens.filter(item => item.status === "nao-encontrado").length);
  });
}

const massas = [100, 1000, 5000, 6000, 10000, 20000];
const inicioTotal = performance.now();
for (const quantidade of massas) testarMassa(quantidade);

console.log(`Auditoria massiva sem SharePoint concluida em ${(performance.now() - inicioTotal).toFixed(1)} ms.`);
