/* PASTELARIA EL SHADDAI — CARDÁPIO + PROMOÇÕES + DESTAQUE */
(function(){
  "use strict";
  function esc(v){return String(v??"").replace(/[&<>'"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]})}
  function moeda(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
  function arr(v){return Array.isArray(v)?v:[]}
  function categoriaId(nome){return "cat-"+String(nome||"categoria").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
  function ingredientesDo(p){return arr(p.ingredientes).map(x=>typeof x==="string"?x:(x&&x.nome)||"").filter(Boolean)}
  function adicionaisDo(p){return arr(p.adicionais).map(x=>({nome:(x&&x.nome)||"",preco:Number(x&&x.preco||0)})).filter(x=>x.nome)}
  function interpretarPromo(p){
    const original=String(p?.descricao||"").trim();
    const marker="__ELSHADDAI_PROMO_V2__";
    if(original.startsWith(marker)){
      const bruto=original.slice(marker.length).trim();
      try{
        const meta=JSON.parse(bruto);
        if(meta.primeiraCompra===undefined)meta.primeiraCompra=/primeir[oa]/i.test(String(meta.descricao||""))&&/pastel|compra/i.test(String(meta.descricao||""));
        return {...p,...meta,descricao:String(meta.descricao||"").trim()};
      }catch(e){
        const m=bruto.match(/"descricao"\s*:\s*"((?:\\.|[^"])*)"/i);
        let descricao="";
        if(m){try{descricao=JSON.parse('"'+m[1]+'"')}catch(_){descricao=m[1].replace(/\\n/g," ").replace(/\\"/g,'"')}}
        return {...p,descricao:descricao,primeiraCompra:/primeir[oa]/i.test(descricao)&&/pastel|compra/i.test(descricao),destaque:false};
      }
    }
    const primeira=/(primeir[oa]\s+(?:compra|pastel))/i.test(original)||(/primeir[oa]/i.test(original)&&/pastel/i.test(original));
    return {...p,_tipo:"percentual",descricao:original,primeiraCompra:primeira,destaque:false}
  }
  function formatarValidade(v){if(!v)return "";const d=new Date(String(v)+"T00:00:00");return isNaN(d)?String(v):d.toLocaleDateString("pt-BR")}
  function aplicarConfiguracao(c){
    if(!c)return;
    const nome=c.nome_loja||"Pastelaria El Shaddai",slogan=c.slogan||"Feito a dois, no ponto pra você!";
    const h1=document.querySelector("header h1"),p=document.querySelector("header p"),logo=document.querySelector(".logo-area img");
    if(h1)h1.textContent=nome;if(p)p.textContent=slogan;if(logo&&c.logo){logo.src=c.logo;logo.alt=nome}document.title=nome;
    const banner=document.querySelector(".banner-principal");
    if(banner&&c.banner){banner.style.backgroundImage="linear-gradient(rgba(198,40,40,.78),rgba(255,179,0,.72)),url('"+String(c.banner).replace(/'/g,"%27")+"')";banner.style.backgroundSize="cover";banner.style.backgroundPosition="center"}
  }
  function renderCategorias(categorias,produtos){
    const box=document.getElementById("categorias");if(!box)return;const nomes=categorias.filter(c=>c&&c.ativo!==false).map(c=>c.nome).filter(Boolean);
    produtos.forEach(p=>{if(p&&p.categoria&&nomes.indexOf(p.categoria)===-1)nomes.push(p.categoria)});box.innerHTML="";
    nomes.forEach(nome=>{const b=document.createElement("button");b.className="botao";b.type="button";b.textContent=nome;b.onclick=function(){const alvo=document.getElementById(categoriaId(nome));if(alvo){alvo.scrollIntoView({behavior:"smooth",block:"start"});return}if(typeof window.irParaSecao==="function")window.irParaSecao(categoriaId(nome))};b.setAttribute("aria-label","Ir para categoria "+nome);box.appendChild(b)})
  }
  function renderProdutos(categorias,produtos){
    const container=document.querySelector(".container");if(!container)return;container.querySelectorAll(".secao").forEach(s=>s.remove());
    const nomes=[];categorias.forEach(c=>{if(c&&c.nome&&c.ativo!==false)nomes.push(c.nome)});produtos.forEach(p=>{if(p&&p.categoria&&nomes.indexOf(p.categoria)===-1)nomes.push(p.categoria)});
    nomes.forEach(nomeCategoria=>{
      const secao=document.createElement("section");secao.id=categoriaId(nomeCategoria);secao.className="secao";const h2=document.createElement("h2");h2.textContent=nomeCategoria;secao.appendChild(h2);
      const grid=document.createElement("div");grid.className="produtos";
      produtos.filter(p=>p&&p.categoria===nomeCategoria&&p.ativo!==false).forEach(produto=>{
        const card=document.createElement("div");card.className="card-produto";card.style.display="flex";card.style.flexDirection="column";card.style.height="100%";card.style.minWidth="0";
        const foto=produto.foto?'<img src="'+esc(produto.foto)+'" alt="'+esc(produto.nome)+'" style="width:100%;height:180px;object-fit:cover;border-radius:12px;margin-bottom:10px;">':"";
        card.innerHTML=foto+"<h3>"+esc(produto.nome)+"</h3><p>"+esc(produto.descricao||"")+"</p><p class=\"preco\">"+(arr(produto.tamanhos).length?"Escolha um tamanho":moeda(produto.preco))+"</p><button class=\"botao\" type=\"button\">"+(produto.disponivel===false?"Indisponível":"Personalizar")+"</button>";
        const btn=card.querySelector("button");if(btn){btn.style.marginTop="auto";btn.style.width="100%"}
        if(produto.disponivel===false){btn.disabled=true;btn.style.opacity=".55";btn.style.cursor="not-allowed"}else{btn.onclick=function(){const ing=ingredientesDo(produto),ad=adicionaisDo(produto),tam=arr(produto.tamanhos).map(t=>({nome:String(t.nome||""),preco:Number(t.preco||0)})).filter(t=>t.nome);if(tam.length){escolherTamanhoProduto(produto.nome,tam,ing,ad)}else{if(typeof window.personalizarProduto!=="function")window.personalizarProduto=personalizarProdutoFallback;window.personalizarProduto(produto.nome,Number(produto.preco||0),ing,ad)}}}
        grid.appendChild(card)
      });secao.appendChild(grid);const acoes=container.querySelector(".acoes");if(acoes)acoes.after(secao);else container.appendChild(secao)
    })
  }
  function renderBannerPromocao(promocoes){
    const box=document.querySelector(".banner-promocao");if(!box)return;
    const agora=new Date();
    const elegiveis=promocoes.filter(p=>p&&p.ativo!==false&&(!p.validade||new Date(String(p.validade)+"T23:59:59")>=agora));
    const destaque=elegiveis.map(interpretarPromo).find(p=>p.destaque);
    if(!destaque){box.style.display="none";return}
    box.style.display="block";box.innerHTML="<h2>PROMOÇÃO DA SEMANA</h2><p><strong>"+esc(destaque.codigo||"")+"</strong> — "+esc(destaque._tipo==="valor"?moeda(destaque.desconto)+" de desconto":destaque._tipo==="quantidade"?"A cada "+destaque.quantidade+" compra(s): "+(destaque.premioNome||"benefício"):Number(destaque.desconto||0)+"% de desconto")+"</p>"+(destaque.descricao?"<p>"+esc(destaque.descricao)+"</p>":"")+(destaque.validade?"<small>Válido até "+formatarValidade(destaque.validade)+"</small>":"")
  }
  async function renderPromocoes(promocoes){
    const old=document.getElementById("promocoesCliente");if(old)old.remove();
    const agora=new Date();let elegiveis=promocoes.filter(p=>p&&p.ativo!==false&&(!p.validade||new Date(String(p.validade)+"T23:59:59")>=agora));
    let cliente=null;const tel=localStorage.getItem("elshaddai_telefone_cliente")||"";
    if(tel){try{const r=await supabaseClient.from("clientes").select("quantidade_pedidos").eq("telefone",tel).limit(1);if(!r.error)cliente=r.data?.[0]||null}catch(e){}}
    elegiveis=elegiveis.map(interpretarPromo).filter(p=>!(p.primeiraCompra&&cliente&&Number(cliente.quantidade_pedidos||0)>0));
    if(!elegiveis.length)return;
    const sec=document.createElement("section");sec.id="promocoesCliente";sec.style.cssText="margin:14px 0;padding:12px;border:2px solid #ffb300;border-radius:14px;background:#fff8d8";
    sec.innerHTML='<h2 style="margin:0 0 10px;color:#8d1b2d;font-size:20px">OFERTAS E CUPONS</h2>'+elegiveis.map(p=>'<div style="background:#fff;border:1px solid #ffd54f;border-radius:10px;padding:10px;margin:8px 0"><strong>'+esc(p.codigo||"")+'</strong><br><b>'+esc(p._tipo==="valor"?moeda(p.desconto)+" de desconto":p._tipo==="quantidade"?"A cada "+p.quantidade+" compra(s): "+(p.premioNome||"benefício"):Number(p.desconto||0)+"% de desconto")+'</b>'+(p.descricao?'<br><span>'+esc(p.descricao)+'</span>':'')+(p.validade?'<br><small>Válido até '+formatarValidade(p.validade)+'</small>':'')+'</div>').join("");
    const container=document.querySelector(".container"),secoes=container?.querySelectorAll(".secao");if(secoes?.length)secoes[secoes.length-1].after(sec);else if(container)container.appendChild(sec)
  }
  async function sincronizar(){
    if(typeof supabaseClient==="undefined"){console.error("supabaseClient não encontrado.");return}
    try{
      const r=await Promise.all([
        supabaseClient.from("configuracoes_loja").select("*").order("id",{ascending:true}).limit(1),
        supabaseClient.from("categorias").select("*").eq("ativo",true).order("id",{ascending:true}),
        supabaseClient.from("produtos").select("*").eq("ativo",true).order("id",{ascending:true}),
        supabaseClient.from("promocoes").select("*").eq("ativo",true).order("id",{ascending:false})
      ]);
      r.forEach(x=>{if(x.error)throw x.error});
      const config=(r[0].data||[])[0]||null,categorias=r[1].data||[],produtos=r[2].data||[],promocoes=r[3].data||[];
      aplicarConfiguracao(config);renderCategorias(categorias,produtos);renderProdutos(categorias,produtos);renderBannerPromocao(promocoes);await renderPromocoes(promocoes);
      document.documentElement.dataset.cardapioSupabase="ok";console.log("Cardápio sincronizado:",{config:!!config,categorias:categorias.length,produtos:produtos.length,promocoes:promocoes.length})
    }catch(e){console.error("Erro na sincronização do cardápio:",e)}
  }
  document.addEventListener("DOMContentLoaded",function(){setTimeout(sincronizar,0)});window.sincronizarCardapioSupabase=sincronizar;
})();
