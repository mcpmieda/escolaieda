export function sanitizarNomeArquivo(nome) {
  let limpo = (nome || "")
    .toString()
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!limpo.toLowerCase().endsWith(".pdf")) {
    limpo += ".pdf";
  }

  return limpo;
}

export function nomeArquivoSemExtensaoVisual(nome) {
  return (nome || "").toString().replace(/\.pdf$/i, "");
}

export function nomeArquivoVisualLimpo(nome) {
  return nomeArquivoSemExtensaoVisual(nome).replace(/\s+\((?:[2-9]|\d{2,})\)$/i, "").trim();
}

export function escaparHtml(valor) {
  return (valor || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function limparNomeArquivoPdf(nomeOriginal) {
  let nome = (nomeOriginal || "DOCUMENTO.pdf")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!nome.toLowerCase().endsWith(".pdf")) {
    nome += ".pdf";
  }

  return nome.toUpperCase();
}
