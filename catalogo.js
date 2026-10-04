/* PASTELARIA EL SHADDAI — CARDÁPIO DINÂMICO */
(function(){
"use strict";
const arr=v=>Array.isArray(v)?v:[];
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const moeda=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const COMBO_MARKER="__ELSHADDAI_COMBO_V1__";
const categoriaId=nome=>"cat-"+String(nome||"categoria").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function listaFlex(v){if(Array.isArray(v))return v;if(typeof v==="string"){try{const x=JSON.parse(v);return Array.isArray(x)?x:[]}catch{return[]}}return []}
const ingredientesDo=p=>listaFlex(p?.ingredientes).map(x=>typeof x==="string"?x:x?.nome||"").filter(Boolean);
const adicionaisDo=p=>listaFlex(p?.adicionais).map(x=>({nome:x?.nome||String(x||""),preco:Number(x?.preco||0)})).filter(x=>x.nome);
const descricaoVisivel=p=>{const t=String(p?.descricao||"");const i=t.indexOf("\n"+COMBO_MARKER+"|");return (i>=0?t.slice(0,i):t).trim()};
let produtos=[],categorias=[],config=null,promocoes=[];

function aplicarConfiguracao(c){
  config=c||null;
  const nome=c?.nome_loja||"Pastelaria El Shaddai",slogan=c?.slogan||"Feito a dois, no ponto pra você!";
  document.title=nome;
  const h=document.getElementById("nomeLojaCliente"),p=document.getElementById("sloganLojaCliente"),logo=document.getElementById("logoCliente");
  if(h)h.textContent=nome;if(p)p.textContent=slogan;if(logo){logo.src=c?.logo||"Logo.png";logo.alt=nome} const header=document.querySelector("header");if(header){if(c?.banner){header.style.backgroundImage=`url("${String(c.banner).replace(/"/g,"%22")}")`;header.style.backgroundSize="cover";header.style.backgroundPosition="center";header.style.backgroundRepeat="no-repeat"}else{header.style.backgroundImage="linear-gradient(135deg,var(--red),var(--red2) 55%,var(--gold))"}}
  const status=document.getElementById("statusLojaCliente"),aberta=c?.loja_aberta!==false;
  if(status){status.textContent=aberta?"Loja aberta":"Loja fechada";status.classList.toggle("open",aberta);status.classList.toggle("closed",!aberta)}
  const wa=document.getElementById("whatsappCliente"),ig=document.getElementById("instagramCliente");
  if(wa&&c?.whatsapp){const n=String(c.whatsapp).replace(/\D/g,"");wa.href="https://wa.me/"+n;wa.style.display="grid"}else if(wa)wa.style.display="none";
  if(ig&&c?.instagram&&c.instagram_ativo!==false){ig.href=c.instagram;ig.target="_blank";ig.rel="noopener";ig.style.display="grid"}else if(ig)ig.style.display="none";
  const infoBox=document.getElementById("informacoesLojaCliente");
  if(infoBox){const raw=String(c?.informacoes||"");const pos=raw.indexOf("ELSHADDAI_CONFIG_V3");const info=pos>=0?raw.slice(0,pos).trim():raw.trim();infoBox.textContent=info;infoBox.style.display=info?"block":"none";}
  window.elShaddaiConfig=c;
  prepararFidelidadeCliente();
}

function renderCategorias(){
  const box=document.getElementById("categorias");if(!box)return;
  box.innerHTML="";
  categorias.filter(c=>c?.ativo!==false).forEach(c=>{
    const b=document.createElement("button");b.className="botao";b.type="button";b.textContent=c.nome;b.onclick=()=>irParaSecao(categoriaId(c.nome));box.appendChild(b);
  });
}

function renderProdutos(){
  const root=document.getElementById("catalogoDinamico");if(!root)return;
  root.innerHTML="";
  const cats=categorias.filter(c=>c?.ativo!==false).map(c=>c.nome).filter(Boolean);
  produtos.forEach(p=>{if(p?.categoria&&!cats.includes(p.categoria))cats.push(p.categoria)});
  if(!cats.length){root.innerHTML='<div class="empty-client">Nenhum produto disponível no momento.</div>';return}
  cats.forEach(nomeCategoria=>{
    const ps=produtos.filter(p=>p?.categoria===nomeCategoria&&p.ativo!==false);
    if(!ps.length)return;
    const sec=document.createElement("section");sec.id=categoriaId(nomeCategoria);sec.className="secao";
    sec.innerHTML="<h2>"+esc(nomeCategoria)+"</h2>";
    const grid=document.createElement("div");grid.className="produtos";
    ps.forEach(produto=>{
      const card=document.createElement("article");card.className="card-produto";
      const tamanhos=listaFlex(produto.tamanhos).map(t=>({nome:String(t?.nome||""),preco:Number(t?.preco||0)})).filter(t=>t.nome);
      const preco=Number(produto.preco||0);
      const custom=ingredientesDo(produto).length||adicionaisDo(produto).length||tamanhos.length;
      const foto=produto.foto?`<img src="${esc(produto.foto)}" alt="${esc(produto.nome)}">`:"";
      const precoHtml=tamanhos.length?'<p class="preco">Escolha o tamanho</p>':(preco>0?`<p class="preco">${moeda(preco)}</p>`:"");
      card.innerHTML=foto+`<h3>${esc(produto.nome)}</h3><p>${esc(descricaoVisivel(produto))}</p>${precoHtml}<button class="botao" type="button">${produto.disponivel===false?"Indisponível":(custom?"Personalizar":"Adicionar")}</button>`;
      const btn=card.querySelector("button");
      if(produto.disponivel===false){btn.disabled=true}
      else if(config?.loja_aberta===false){btn.disabled=true;btn.title="A loja está fechada no momento"}
      else btn.onclick=()=>{
        if(tamanhos.length&&typeof window.escolherTamanhoProduto==="function")return window.escolherTamanhoProduto(produto.nome,tamanhos,ingredientesDo(produto),adicionaisDo(produto));
        if(custom&&typeof window.personalizarProduto==="function")return window.personalizarProduto(produto.nome,preco,ingredientesDo(produto),adicionaisDo(produto));
        if(typeof window.adicionarProduto==="function")window.adicionarProduto(produto.nome,preco);
      };
      grid.appendChild(card);
    });
    sec.appendChild(grid);root.appendChild(sec);
  });
  atualizarPesquisa("");
}
function aplicarPesquisa(termo){
  termo=String(termo||"").trim().toLowerCase();
  document.querySelectorAll(".secao").forEach(sec=>{
    let encontrou=false;
    sec.querySelectorAll(".card-produto").forEach(card=>{
      const ok=!termo||card.textContent.toLowerCase().includes(termo);
      card.style.display=ok?"":"none";if(ok)encontrou=true;
    });
    sec.style.display=encontrou?"":"none";
  });
}
function atualizarPesquisa(v){aplicarPesquisa(v)}
window.executarPesquisa=()=>{const p=document.getElementById("pesquisa");const termo=(p?.value||"").trim();aplicarPesquisa(termo);if(termo){const alvo=Array.from(document.querySelectorAll(".secao")).find(sec=>sec.style.display!=="none");if(alvo)alvo.scrollIntoView({behavior:"smooth",block:"start"})}};
window.irParaSecao=id=>{const sec=document.getElementById(id);const p=document.getElementById("pesquisa");if(p)p.value="";aplicarPesquisa("");if(sec)sec.scrollIntoView({behavior:"smooth",block:"start"})};

function renderPromocoesCliente(){
  const box=document.getElementById("promocoesCliente");if(!box)return;
  const agora=new Date();
  const ativas=promocoes.filter(p=>p?.ativo!==false&&(!p.validade||new Date(p.validade+"T23:59:59")>=agora));
  if(!ativas.length){box.style.display="none";box.innerHTML="";return}
  box.style.display="block";
  box.innerHTML=`<h2>Promoções e cupons</h2>`+ativas.map(p=>{let m=null;try{m=JSON.parse(p.descricao||"")}catch{};let titulo=m?.__elshaddai_promo?(m.tipo==="percentual"?`${Number(m.valor||0)}% de desconto`:m.tipo==="valor"?`${moeda(m.valor)} de desconto`:"Produto específico"):((Number(p.desconto||0)>0)?`${Number(p.desconto)}% de desconto`:"Promoção");let desc=m?.descricao||(!m?.__elshaddai_promo?p.descricao||"":"");return `<div class="promocao-card"><strong>${esc(titulo)}</strong>${desc?`<div>${esc(desc)}</div>`:""}<div>Cupom: <strong>${esc(p.codigo||"")}</strong></div>${p.validade?`<small>Válido até ${esc(p.validade)}</small>`:""}</div>`}).join("");
}
async function sincronizar(){
  if(!window.supabaseClient)return;
  try{
    const [rc,rp,rs,rpromo]=await Promise.all([
      window.supabaseClient.from("configuracoes_loja").select("*").order("id",{ascending:true}).limit(1),
      window.supabaseClient.from("categorias").select("*").eq("ativo",true).order("id",{ascending:true}),
      window.supabaseClient.from("produtos").select("*").eq("ativo",true).order("id",{ascending:true}),
      window.supabaseClient.from("promocoes").select("*").order("id",{ascending:false})
    ]);
    if(rc.error)throw rc.error;if(rp.error)throw rp.error;if(rs.error)throw rs.error;if(rpromo.error)throw rpromo.error;
    config=(rc.data||[])[0]||null;categorias=rp.data||[];produtos=rs.data||[];promocoes=rpromo.data||[];
    aplicarConfiguracao(config);renderCategorias();renderProdutos();renderPromocoesCliente();
    document.documentElement.dataset.cardapioSupabase="ok";
  }catch(e){console.error("Erro ao atualizar cardápio:",e)}
}
function metaConfigFidelidade(){const raw=String(config?.informacoes||"");const i=raw.lastIndexOf("ELSHADDAI_CONFIG_V3|");if(i<0)return null;try{const x=JSON.parse(raw.slice(i+"ELSHADDAI_CONFIG_V3|".length).trim());return x?.fidelidade||null}catch{return null}}
async function consultarFidelidadeCliente(){const box=document.getElementById("fidelidadeResultadoCliente"),tel=document.getElementById("fidelidadeTelefoneCliente")?.value.replace(/\D/g,"")||"",f=metaConfigFidelidade();if(!box)return;if(tel.length<10){box.innerHTML="<span>Informe um telefone válido.</span>";return}if(!f?.ativo){box.innerHTML="<span>A fidelidade dos clientes ainda não está configurada.</span>";return}try{const r=await window.supabaseClient.from("clientes").select("nome,telefone,quantidade_pedidos,total_gasto").eq("telefone",tel).limit(1);if(r.error)throw r.error;const c=(r.data||[])[0];if(!c){box.innerHTML="<span>Nenhum cadastro encontrado para este telefone.</span>";return}const meta=Math.max(1,Number(f.meta||1)),compras=Number(c.quantidade_pedidos||0),faltam=compras>=meta?0:meta-(compras%meta),beneficios=Math.floor(compras/meta);box.innerHTML=`<strong>${esc(c.nome||"Cliente")}</strong><br>${compras} compra(s) registrada(s).<br>${beneficios?`Benefício disponível: ${esc(f.beneficio||"Benefício")}.`:`Faltam ${faltam} compra(s) para: ${esc(f.beneficio||"Benefício")}.`}`;}catch(e){box.innerHTML="<span>Não foi possível consultar a fidelidade agora.</span>"}}
function prepararFidelidadeCliente(){const box=document.getElementById("fidelidadeCliente"),btn=document.getElementById("btnFidelidadeCliente");if(!box||!btn)return;const f=metaConfigFidelidade();if(!f?.ativo){box.style.display="none";return}box.style.display="block";btn.onclick=consultarFidelidadeCliente}
function registrarVisita(){
  if(sessionStorage.getItem("elshaddai_visita_registrada"))return;
  sessionStorage.setItem("elshaddai_visita_registrada","1");
  const n=Number(localStorage.getItem("elshaddai_visitas_total")||0)+1;localStorage.setItem("elshaddai_visitas_total",String(n));
}
document.addEventListener("DOMContentLoaded",()=>{
  registrarVisita();
  const p=document.getElementById("pesquisa"),b=document.getElementById("btnPesquisa");
  p?.addEventListener("input",e=>aplicarPesquisa(e.target.value));p?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();window.executarPesquisa()}});
  b?.addEventListener("click",window.executarPesquisa);
  sincronizar();
  setInterval(sincronizar,20000);
  window.addEventListener("focus",sincronizar);
});
window.sincronizarCardapioSupabase=sincronizar;
})();

/* Tamanho do produto */
window.escolherTamanhoProduto=function(nome,tamanhos,ingredientes,adicionais){
  const antigo=document.getElementById("tamanhoProdutoModal");if(antigo)antigo.remove();
  const fundo=document.createElement("div");fundo.id="tamanhoProdutoModal";fundo.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:15px";
  const caixa=document.createElement("div");caixa.style.cssText="width:100%;max-width:500px;background:#fff8e7;border:3px solid #ffb300;border-radius:18px;padding:18px;max-height:90vh;overflow:auto";
  caixa.innerHTML=`<h2 style="text-align:center;color:#c62828;margin-top:0">Escolha o tamanho</h2><p style="text-align:center;font-weight:700">${esc(nome)}</p>${tamanhos.map((t,i)=>`<label style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #ddd;border-radius:12px;padding:13px;margin-bottom:8px;cursor:pointer"><span><strong>${esc(t.nome)}</strong> — <span style="color:#c62828;font-weight:700">${moeda(t.preco)}</span></span><input type="radio" name="tamanhoProduto" value="${i}" ${i===0?"checked":""} style="width:21px;height:21px"></label>`).join("")}<button id="confirmarTamanhoProduto" style="width:100%;padding:14px;background:#ffb300;border:0;border-radius:11px;font-weight:700">Adicionar ao carrinho</button><button id="fecharTamanhoProduto" style="width:100%;padding:12px;margin-top:8px;background:#fff;border:1px solid #c62828;border-radius:11px;color:#c62828;font-weight:700">Fechar</button>`;
  fundo.appendChild(caixa);document.body.appendChild(fundo);
  caixa.querySelector("#confirmarTamanhoProduto").onclick=()=>{
    const r=caixa.querySelector("input[name='tamanhoProduto']:checked");if(!r)return;
    const t=tamanhos[Number(r.value)],itemNome=nome+" - "+t.nome;
    if((ingredientes?.length||adicionais?.length)&&typeof window.personalizarProduto==="function"){
      fundo.remove();
      window.personalizarProduto(itemNome,Number(t.preco),ingredientes,adicionais);
      return;
    }
    const existente=window.carrinho?.find(i=>i.nome===itemNome&&Number(i.preco)===Number(t.preco));
    if(existente)existente.quantidade=Number(existente.quantidade||1)+1;else window.carrinho.push({nome:itemNome,preco:Number(t.preco),quantidade:1,detalhes:["Tamanho: "+t.nome]});
    if(typeof window.salvarCarrinho==="function")window.salvarCarrinho();fundo.remove();
  };
  caixa.querySelector("#fecharTamanhoProduto").onclick=()=>fundo.remove();
};
