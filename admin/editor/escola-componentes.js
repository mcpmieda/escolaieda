(() => {
  if (!window.Vvveb?.Blocks?.add) return;

  const grupo = "Escola Iêda";
  Vvveb.BlocksGroup[grupo] = [
    "ieda/aviso",
    "ieda/destaque",
    "ieda/cartoes",
    "ieda/texto",
    "ieda/chamada",
    "ieda/galeria"
  ];

  Vvveb.Blocks.add("ieda/aviso", {
    name: "Aviso importante",
    image: "",
    html: `
<section style="max-width:1150px;margin:34px auto;padding:0 20px">
  <div style="border-radius:20px;padding:24px 26px;background:#fff7df;border:1px solid #f0d58d;box-shadow:0 12px 32px rgba(31,41,55,.08)">
    <p style="margin:0 0 7px;color:#856313;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em">Aviso importante</p>
    <h2 style="margin:0 0 8px;color:#263645;font-size:1.55rem">Digite o título do aviso</h2>
    <p style="margin:0;color:#596875;line-height:1.65">Clique neste texto para editar a informação.</p>
  </div>
</section>`
  });

  Vvveb.Blocks.add("ieda/destaque", {
    name: "Destaque com botão",
    image: "",
    html: `
<section style="max-width:1150px;margin:34px auto;padding:0 20px">
  <div style="position:relative;overflow:hidden;border-radius:26px;padding:44px;background:linear-gradient(135deg,#07223a,#0b649f);color:white;box-shadow:0 22px 60px rgba(7,34,58,.20)">
    <p style="margin:0 0 8px;color:#9bd7fa;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em">Destaque</p>
    <h2 style="max-width:700px;margin:0 0 12px;font-size:clamp(2rem,4vw,3.5rem);line-height:1;letter-spacing:-.04em">Uma informação que merece destaque</h2>
    <p style="max-width:680px;margin:0 0 24px;color:rgba(255,255,255,.75);line-height:1.7">Edite este texto e use o botão quando precisar direcionar a comunidade para outra página.</p>
    <a href="#" style="display:inline-block;padding:11px 18px;border-radius:12px;background:white;color:#07375b;font-weight:800;text-decoration:none">Saiba mais</a>
  </div>
</section>`
  });

  Vvveb.Blocks.add("ieda/cartoes", {
    name: "Três cartões",
    image: "",
    html: `
<section style="max-width:1150px;margin:34px auto;padding:0 20px">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">
    <article style="padding:24px;border-radius:20px;background:white;border:1px solid #e4e9ee;box-shadow:0 10px 28px rgba(20,40,60,.07)"><h3 style="margin:0 0 8px;color:#173149">Primeiro cartão</h3><p style="margin:0;color:#63717d;line-height:1.6">Edite este conteúdo.</p></article>
    <article style="padding:24px;border-radius:20px;background:white;border:1px solid #e4e9ee;box-shadow:0 10px 28px rgba(20,40,60,.07)"><h3 style="margin:0 0 8px;color:#173149">Segundo cartão</h3><p style="margin:0;color:#63717d;line-height:1.6">Edite este conteúdo.</p></article>
    <article style="padding:24px;border-radius:20px;background:white;border:1px solid #e4e9ee;box-shadow:0 10px 28px rgba(20,40,60,.07)"><h3 style="margin:0 0 8px;color:#173149">Terceiro cartão</h3><p style="margin:0;color:#63717d;line-height:1.6">Edite este conteúdo.</p></article>
  </div>
</section>`
  });

  Vvveb.Blocks.add("ieda/texto", {
    name: "Título e texto",
    image: "",
    html: `
<section style="max-width:900px;margin:40px auto;padding:0 20px;text-align:center">
  <p style="margin:0 0 8px;color:#0e659f;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em">Escola Iêda</p>
  <h2 style="margin:0 0 14px;color:#132d44;font-size:clamp(1.8rem,4vw,2.8rem);letter-spacing:-.035em">Digite um título</h2>
  <p style="margin:0;color:#647482;line-height:1.75;font-size:1.02rem">Clique no texto para editar. Este bloco funciona bem para explicações, apresentações e informações institucionais.</p>
</section>`
  });

  Vvveb.Blocks.add("ieda/chamada", {
    name: "Chamada para ação",
    image: "",
    html: `
<section style="max-width:1150px;margin:34px auto;padding:0 20px">
  <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;padding:26px 30px;border-radius:22px;background:#edf6fb;border:1px solid #cfe5f2">
    <div><h2 style="margin:0 0 6px;color:#123551;font-size:1.55rem">Precisa destacar um acesso?</h2><p style="margin:0;color:#637582">Edite o texto e o endereço do botão.</p></div>
    <a href="#" style="display:inline-block;padding:11px 18px;border-radius:12px;background:#0d649f;color:white;font-weight:800;text-decoration:none">Abrir</a>
  </div>
</section>`
  });

  Vvveb.Blocks.add("ieda/galeria", {
    name: "Galeria de imagens",
    image: "",
    html: `
<section style="max-width:1150px;margin:34px auto;padding:0 20px">
  <h2 style="margin:0 0 18px;color:#15334c;font-size:1.8rem">Galeria</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
    <img src="/fundo_logo_ieda.jpg" alt="Imagem da escola" style="width:100%;height:220px;object-fit:cover;border-radius:18px">
    <img src="/fundo_logo_ieda.jpg" alt="Imagem da escola" style="width:100%;height:220px;object-fit:cover;border-radius:18px">
    <img src="/fundo_logo_ieda.jpg" alt="Imagem da escola" style="width:100%;height:220px;object-fit:cover;border-radius:18px">
  </div>
</section>`
  });
})();
