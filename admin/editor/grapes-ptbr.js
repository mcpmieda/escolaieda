(function configurarGrapesPtBR() {
  const grapes = window.grapesjs;
  if (!grapes?.init) return;

  const initOriginal = grapes.init.bind(grapes);
  const mensagens = {
    assetManager: {
      addButton: "Adicionar imagem",
      inputPlh: "https://caminho/para/imagem.jpg",
      modalTitle: "Selecionar imagem",
      uploadTitle: "Solte os arquivos aqui ou toque para enviar"
    },
    domComponents: {
      names: {
        "": "Bloco",
        wrapper: "Página",
        text: "Texto",
        comment: "Comentário",
        image: "Imagem",
        video: "Vídeo",
        label: "Rótulo",
        link: "Link",
        map: "Mapa",
        tfoot: "Rodapé da tabela",
        tbody: "Corpo da tabela",
        thead: "Cabeçalho da tabela",
        table: "Tabela",
        row: "Linha da tabela",
        cell: "Célula da tabela",
        section: "Seção",
        body: "Corpo"
      }
    },
    styleManager: {
      empty: "Selecione algo na página para alterar a aparência",
      layer: "Camada",
      fileButton: "Imagens",
      properties: {
        display: "Exibição",
        position: "Posição",
        top: "Topo",
        right: "Direita",
        left: "Esquerda",
        bottom: "Inferior",
        width: "Largura",
        height: "Altura",
        "max-width": "Largura máxima",
        "max-height": "Altura máxima",
        "min-height": "Altura mínima",
        margin: "Margem externa",
        "margin-top-sub": "Superior",
        "margin-right-sub": "Direita",
        "margin-left-sub": "Esquerda",
        "margin-bottom-sub": "Inferior",
        padding: "Espaço interno",
        "padding-top-sub": "Superior",
        "padding-left-sub": "Esquerda",
        "padding-right-sub": "Direita",
        "padding-bottom-sub": "Inferior",
        "font-family": "Fonte",
        "font-size": "Tamanho da fonte",
        "font-weight": "Peso da fonte",
        "letter-spacing": "Espaço entre letras",
        color: "Cor do texto",
        "line-height": "Altura da linha",
        "text-align": "Alinhamento",
        "text-decoration": "Decoração do texto",
        "text-shadow": "Sombra do texto",
        "border-radius": "Arredondamento",
        "border-top-left-radius-sub": "Superior esquerdo",
        "border-top-right-radius-sub": "Superior direito",
        "border-bottom-left-radius-sub": "Inferior esquerdo",
        "border-bottom-right-radius-sub": "Inferior direito",
        border: "Borda",
        "border-width-sub": "Espessura",
        "border-style-sub": "Estilo",
        "border-color-sub": "Cor",
        "box-shadow": "Sombra",
        "box-shadow-h": "Horizontal",
        "box-shadow-v": "Vertical",
        "box-shadow-blur": "Desfoque",
        "box-shadow-spread": "Expansão",
        "box-shadow-color": "Cor da sombra",
        "box-shadow-type": "Tipo de sombra",
        background: "Fundo",
        "background-color": "Cor de fundo",
        "background-image": "Imagem de fundo",
        opacity: "Opacidade"
      }
    },
    traitManager: {
      empty: "Selecione um elemento para ver suas opções",
      label: "Opções do elemento",
      traits: {
        labels: {
          id: "Identificador",
          alt: "Descrição da imagem",
          title: "Título",
          href: "Link",
          target: "Abrir em"
        },
        attributes: {
          href: { placeholder: "https://" }
        },
        options: {
          target: {
            false: "Esta janela",
            _blank: "Nova janela"
          }
        }
      }
    }
  };

  grapes.init = function initComPtBR(config = {}) {
    const i18nAtual = config.i18n || {};
    const mensagensAdicionais = i18nAtual.messagesAdd || {};
    const editor = initOriginal({
      ...config,
      i18n: {
        ...i18nAtual,
        locale: "pt-BR",
        localeFallback: "en",
        detectLocale: false,
        messagesAdd: {
          ...mensagensAdicionais,
          "pt-BR": mensagens
        }
      }
    });

    configurarSelecaoDeImagem(editor);
    return editor;
  };

  function configurarSelecaoDeImagem(editor) {
    const assetManager = editor?.AssetManager;
    if (!assetManager?.open || assetManager.__iedaSelecaoImagem) return;

    const abrirOriginal = assetManager.open.bind(assetManager);

    assetManager.open = function abrirComSelecaoPersistente(opcoes = {}) {
      const alvoInicial = localizarImagem(editor.getSelected());
      const selecionarOriginal = opcoes?.select;

      return abrirOriginal({
        ...opcoes,
        select(asset, complete) {
          const src = obterSrcAsset(asset);
          const alvo = localizarImagem(editor.getSelected()) || alvoInicial;

          if (src && alvo?.addAttributes) {
            alvo.addAttributes({ src });
          }

          if (typeof selecionarOriginal === "function") {
            selecionarOriginal(asset, complete);
          }

          if (complete && assetManager.isOpen?.()) {
            assetManager.close();
          }
        }
      });
    };

    Object.defineProperty(assetManager, "__iedaSelecaoImagem", {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }

  function localizarImagem(componente) {
    if (!componente) return null;

    const tag = String(componente.get?.("tagName") || "").toLowerCase();
    if (tag === "img" || componente.is?.("image")) return componente;

    const filhos = componente.components?.();
    const modelos = filhos?.models || filhos || [];
    for (const filho of modelos) {
      const imagem = localizarImagem(filho);
      if (imagem) return imagem;
    }

    return null;
  }

  function obterSrcAsset(asset) {
    return asset?.getSrc?.() || asset?.get?.("src") || asset?.src || "";
  }
})();
