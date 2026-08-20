const livroNav = document.getElementById("navLivroPonto");
const livroView = document.getElementById("view-livro");
const livroFrame = document.getElementById("livroPontoFrame");
const sidebar = document.getElementById("sidebar");
const tituloView = document.getElementById("tituloView");
const viewEyebrow = document.getElementById("viewEyebrow");

inicializarLivroPontoEmbutido();

function inicializarLivroPontoEmbutido() {
  document.querySelectorAll("[data-open-livro-ponto]").forEach((controle) => {
    controle.addEventListener("click", abrirLivroPonto);
  });

  document.addEventListener("click", (event) => {
    const outraNavegacao = event.target.closest("[data-view], [data-view-target], .navLink");
    if (outraNavegacao && !event.target.closest("[data-open-livro-ponto]")) {
      livroNav?.classList.remove("active");
    }
  });

  livroFrame?.addEventListener("load", prepararFrameLivroPonto);
}

function abrirLivroPonto(event) {
  event?.preventDefault();

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelectorAll("[data-view]").forEach((controle) => controle.classList.remove("active"));

  livroView?.classList.add("active");
  livroNav?.classList.add("active");
  sidebar?.classList.remove("open");

  if (tituloView) tituloView.textContent = "Livro de Ponto";
  if (viewEyebrow) viewEyebrow.textContent = "Secretaria";

  if (livroFrame && !livroFrame.getAttribute("src")) {
    livroFrame.setAttribute("src", livroFrame.dataset.src || "./livro-ponto/");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function prepararFrameLivroPonto() {
  try {
    const documento = livroFrame?.contentDocument;
    if (!documento) return;

    const cabecalhoInterno = documento.querySelector(".top");
    const app = documento.querySelector(".app");
    const main = documento.querySelector(".main");

    if (cabecalhoInterno) cabecalhoInterno.style.display = "none";
    if (app) app.style.minHeight = "100vh";
    if (main) main.style.height = "100vh";
  } catch (erro) {
    console.warn("Livro de Ponto carregado sem ajuste visual embutido.", erro);
  }
}
