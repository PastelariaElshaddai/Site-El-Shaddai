/* PASTELARIA EL SHADDAI — INTEGRAÇÃO FINAL DO CARDÁPIO */

(function () {
  "use strict";

  function esc(v) {
    return String(v ?? "").replace(/[&<>'"]/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c];
    });
  }

  function moeda(v) {
    return Number(v || 0).toLocaleString("pt-BR", {
      style: "currency", currency: "BRL"
    });
  }

  function arr(v) { return Array.isArray(v) ? v : []; }

  function categoriaId(nome) {
    return "cat-" + String(nome || "categoria")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function ingredientesDo(produto) {
    return arr(produto.ingredientes).map(function (x) {
      return typeof x === "string" ? x : (x && x.nome) || "";
    }).filter(Boolean);
  }

  function adicionaisDo(produto) {
    return arr(produto.adicionais).map(function (x) {
      return {nome:(x && x.nome) || "", preco:Number(x && x.preco || 0)};
    }).filter(function (x) { return x.nome; });
  }

  function aplicarConfiguracao(c) {
    if (!c) return;

    var nome = c.nome_loja || "Pastelaria El Shaddai";
    var slogan = c.slogan || "Feito a dois, no ponto pra você!";

    var h1 = document.querySelector("header h1");
    var p = document.querySelector("header p");
    var logo = document.querySelector(".logo-area img");

    if (h1) h1.textContent = nome;
    if (p) p.textContent = slogan;
    if (logo && c.logo) {
      logo.src = c.logo;
      logo.alt = nome;
    }

    document.title = nome;

    var banner = document.querySelector(".banner-principal");
    if (banner && c.banner) {
      banner.style.backgroundImage =
        "linear-gradient(rgba(198,40,40,.78),rgba(255,179,0,.72)),url('" +
        String(c.banner).replace(/'/g, "%27") + "')";
      banner.style.backgroundSize = "cover";
      banner.style.backgroundPosition = "center";
    }

    var status = document.getElementById("statusLojaCliente");
    if (!status) {
      status = document.createElement("div");
      status.id = "statusLojaCliente";
      status.style.cssText =
        "display:none;margin:10px 0;padding:12px;border-radius:12px;text-align:center;font-weight:bold;";
      var container = document.querySelector(".container");
      if (container) container.prepend(status);
    }

    if (status) {
      if (c.loja_aberta === false) {
        status.textContent = "🔴 A loja está fechada no momento.";
        status.style.display = "block";
        status.style.background = "#ffe5e5";
        status.style.color = "#a11";
      } else {
        status.style.display = "none";
      }
    }
  }

  function renderCategorias(categorias, produtos) {
    var box = document.getElementById("categorias");
    if (!box) return;

    var nomes = categorias
      .filter(function(c){return c && c.ativo !== false;})
      .map(function(c){return c.nome;})
      .filter(Boolean);

    produtos.forEach(function(p){
      if (p && p.categoria && nomes.indexOf(p.categoria) === -1)
        nomes.push(p.categoria);
    });

    box.innerHTML = "";

    nomes.forEach(function(nome){
      var b = document.createElement("button");
      b.className = "botao";
      b.type = "button";
      b.textContent = nome;
      b.onclick = function(){ irParaSecao(categoriaId(nome)); };
      box.appendChild(b);
    });
  }

  function renderProdutos(categorias, produtos) {
    var container = document.querySelector(".container");
    if (!container) return;

    container.querySelectorAll(".secao").forEach(function(s){s.remove();});

    var nomes = [];
    categorias.forEach(function(c){
      if (c && c.nome && c.ativo !== false) nomes.push(c.nome);
    });
    produtos.forEach(function(p){
      if (p && p.categoria && nomes.indexOf(p.categoria) === -1)
        nomes.push(p.categoria);
    });

    nomes.forEach(function(nomeCategoria){
      var secao = document.createElement("section");
      secao.id = categoriaId(nomeCategoria);
      secao.className = "secao";

      var h2 = document.createElement("h2");
      h2.textContent = nomeCategoria;
      secao.appendChild(h2);

      var grid = document.createElement("div");
      grid.className = "produtos";

      produtos.filter(function(p){
        return p && p.categoria === nomeCategoria && p.ativo !== false;
      }).forEach(function(produto){
        var card = document.createElement("div");
        card.className = "card-produto";

        var foto = produto.foto
          ? '<img src="' + esc(produto.foto) + '" alt="' + esc(produto.nome) +
            '" style="width:100%;height:180px;object-fit:cover;border-radius:12px;margin-bottom:10px;">'
          : "";

        card.innerHTML =
          foto +
          "<h3>" + esc(produto.nome) + "</h3>" +
          "<p>" + esc(produto.descricao || "") + "</p>" +
          '<p class="preco">' + moeda(produto.preco) + "</p>" +
          '<button class="botao" type="button">' +
          (produto.disponivel === false ? "Indisponível" : "Personalizar") +
          "</button>";

        var btn = card.querySelector("button");

        if (produto.disponivel === false) {
          btn.disabled = true;
          btn.style.opacity = ".55";
          btn.style.cursor = "not-allowed";
        } else {
          btn.onclick = function(){
            var ingredientes = ingredientesDo(produto);
            var adicionais = adicionaisDo(produto);
            var tamanhos = arr(produto.tamanhos).map(function(t){return {nome:String(t.nome||""),preco:Number(t.preco||0)}}).filter(function(t){return t.nome;});

            if (tamanhos.length) {
              escolherTamanhoProduto(produto.nome,tamanhos,ingredientes,adicionais);
            } else if (typeof personalizarProduto === "function") {
              personalizarProduto(
                produto.nome,
                Number(produto.preco || 0),
                ingredientes,
                adicionais
              );
            } else if (typeof adicionarProduto === "function") {
              adicionarProduto(produto.nome, Number(produto.preco || 0));
            }
          };
        }

        grid.appendChild(card);
      });

      secao.appendChild(grid);

      var acoes = container.querySelector(".acoes");
      if (acoes) acoes.after(secao);
      else container.appendChild(secao);
    });
  }

  async function sincronizar() {
    if (typeof supabaseClient === "undefined") {
      console.error("supabaseClient não encontrado.");
      return;
    }

    try {
      var r = await Promise.all([
        supabaseClient.from("configuracoes_loja").select("*").order("id",{ascending:true}).limit(1),
        supabaseClient.from("categorias").select("*").eq("ativo",true).order("id",{ascending:true}),
        supabaseClient.from("produtos").select("*").eq("ativo",true).order("id",{ascending:true})
      ]);

      if (r[0].error) throw r[0].error;
      if (r[1].error) throw r[1].error;
      if (r[2].error) throw r[2].error;

      var config = (r[0].data || [])[0] || null;
      var categorias = r[1].data || [];
      var produtos = r[2].data || [];

      aplicarConfiguracao(config);
      renderCategorias(categorias, produtos);
      renderProdutos(categorias, produtos);

      document.documentElement.dataset.cardapioSupabase = "ok";
      console.log("Cardápio sincronizado:", {config:!!config,categorias:categorias.length,produtos:produtos.length});
    } catch (e) {
      console.error("Erro na sincronização do cardápio:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(sincronizar, 0);
  });

  window.sincronizarCardapioSupabase = sincronizar;
})();


function escolherTamanhoProduto(nome,tamanhos,ingredientes,adicionais){
  // Esta função fica fora do escopo interno do catálogo; por isso precisa
  // ter suas próprias funções auxiliares.
  var escLocal=function(v){return String(v==null?"":v).replace(/[&<>'"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c];});};
  var moedaLocal=function(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});};
  var antigo=document.getElementById("tamanhoProdutoModal");
  if(antigo) antigo.remove();

  var fundo=document.createElement("div");
  fundo.id="tamanhoProdutoModal";
  fundo.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:15px;";

  var caixa=document.createElement("div");
  caixa.style.cssText="width:100%;max-width:500px;background:#fff8e7;border:3px solid #ffb300;border-radius:20px;padding:20px;max-height:90vh;overflow:auto;";

  var html="<h2 style='text-align:center;color:#c62828;margin-top:0'>Escolha o tamanho</h2>"+
           "<p style='text-align:center;font-weight:bold'>"+escLocal(nome)+"</p>";

  tamanhos.forEach(function(t,i){
    html += "<label style='display:flex;justify-content:space-between;align-items:center;background:white;border:2px solid #ddd;border-radius:12px;padding:14px;margin-bottom:9px;cursor:pointer'>"+
      "<span><strong>"+escLocal(t.nome)+"</strong> — <span style='color:#c62828;font-weight:bold'>"+moedaLocal(t.preco)+"</span></span>"+
      "<input type='radio' name='tamanhoProduto' value='"+i+"' "+(i===0?"checked":"")+" style='width:22px;height:22px'></label>";
  });

  html += "<button id='confirmarTamanhoProduto' style='width:100%;padding:15px;background:#ffb300;border:0;border-radius:12px;font-weight:bold;font-size:18px'>Continuar personalização</button>"+
          "<button id='fecharTamanhoProduto' style='width:100%;padding:13px;margin-top:9px;background:white;border:2px solid #c62828;border-radius:12px;color:#c62828;font-weight:bold'>Fechar</button>";

  caixa.innerHTML=html;
  fundo.appendChild(caixa);
  document.body.appendChild(fundo);

  caixa.querySelector("#confirmarTamanhoProduto").onclick=function(){
    var r=caixa.querySelector("input[name='tamanhoProduto']:checked");
    if(!r){ alert("Escolha um tamanho."); return; }

    var t=tamanhos[Number(r.value)];
    var nomeComTamanho=nome+" - "+t.nome;

    fundo.remove();

    // Depois de escolher o tamanho, segue pelo MESMO fluxo de personalização
    // usado pelos demais produtos. Assim ingredientes e adicionais continuam disponíveis.
    if(typeof personalizarProduto === "function"){
      personalizarProduto(nomeComTamanho,Number(t.preco||0),ingredientes,adicionais);
    } else if(typeof adicionarProduto === "function"){
      adicionarProduto(nomeComTamanho,Number(t.preco||0));
    } else {
      alert("Não foi possível abrir a personalização deste produto.");
    }
  };

  caixa.querySelector("#fecharTamanhoProduto").onclick=function(){fundo.remove();};
}
