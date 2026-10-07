/* PASTELARIA EL SHADDAI — CARDÁPIO DINÂMICO */
(function(){
"use strict";
const arr=v=>Array.isArray(v)?v:[];
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const moeda=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const COMBO_MARKER="__ELSHADDAI_COMBO_V1__";const MESCLA_MARKER="__ELSHADDAI_MESCLA_V1__";
const categoriaId=nome=>"cat-"+String(nome||"categoria").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function listaFlex(v){if(Array.isArray(v))return v;if(typeof v==="string"){try{const x=JSON.parse(v);return Array.isArray(x)?x:[]}catch{return[]}}return []}
const ingredientesDo=p=>listaFlex(p?.ingredientes).map(x=>typeof x==="string"?x:x?.nome||"").filter(Boolean);
const adicionaisDo=p=>listaFlex(p?.adicionais).map(x=>({nome:x?.nome||String(x||""),preco:Number(x?.preco||0)})).filter(x=>x.nome);
const descricaoVisivel=p=>String(p?.descricao||"").split("\n").filter(l=>!l.startsWith(COMBO_MARKER+"|")&&!l.startsWith(MESCLA_MARKER)).join("\n").trim();
const produtoMesclavel=p=>String(p?.descricao||"").split("\n").some(l=>l.trim()===MESCLA_MARKER);
function configExtra(){const raw=String(config?.informacoes||""),ls=raw.split("\n"),m=ls.filter(l=>l.startsWith("ELSHADDAI_CONFIG_V3|")).pop();if(!m)return {};try{return JSON.parse(m.slice("ELSHADDAI_CONFIG_V3|".length))||{}}catch{return {}}}
function pizzaCfg(){return configExtra().pizza||{ativo:false,modo_preco:"maior",max_sabores:2,categorias:[],produtos:[]}}
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
  const ri=document.getElementById("rodapeInfoTexto");if(ri){const raw=String(c?.informacoes||"");const pos=raw.indexOf("ELSHADDAI_CONFIG_V3");ri.textContent=pos>=0?raw.slice(0,pos).trim():(raw.trim()||"Consulte nossas informações de atendimento.")}const rw=document.getElementById("rodapeWhatsapp");if(rw&&c?.whatsapp)rw.innerHTML=`<a href="https://wa.me/${String(c.whatsapp).replace(/\D/g,"")}" target="_blank" rel="noopener">WhatsApp</a>`;const rg=document.getElementById("rodapeInstagram");if(rg&&c?.instagram&&c.instagram_ativo!==false)rg.innerHTML=`<a href="${esc(c.instagram)}" target="_blank" rel="noopener">Instagram</a>`;prepararFidelidadeCliente();
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
      const custom=ingredientesDo(produto).length||adicionaisDo(produto).length||tamanhos.length||produtoMesclavel(produto);
      const foto=produto.foto?`<img src="${esc(produto.foto)}" alt="${esc(produto.nome)}">`:"";
      const precoHtml=tamanhos.length?'<p class="preco">Escolha o tamanho</p>':(preco>0?`<p class="preco">${moeda(preco)}</p>`:"");
      card.innerHTML=foto+`<h3>${esc(produto.nome)}</h3><p>${esc(descricaoVisivel(produto))}</p>${precoHtml}<button class="botao" type="button">${produto.disponivel===false?"Indisponível":(custom?"Personalizar":"Adicionar")}</button>`;
      const btn=card.querySelector("button");
      if(produto.disponivel===false){btn.disabled=true}
      else if(config?.loja_aberta===false){btn.disabled=true;btn.title="A loja está fechada no momento"}
      else btn.onclick=()=>{
        const cat=String(produto.categoria||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
        if((produtoMesclavel(produto)||(pizzaCfg().produtos||[]).map(String).includes(String(produto.id)))&&typeof window.escolherMesclaProduto==="function"&&pizzaCfg().ativo)return window.escolherMesclaProduto(produto,produtos.filter(p=>p?.ativo!==false&&p?.disponivel!==false));
        if(tamanhos.length&&typeof window.adicionarProdutoComTamanhos==="function")return window.adicionarProdutoComTamanhos({produto,tamanhos,ingredientes:ingredientesDo(produto),adicionais:adicionaisDo(produto)});
        if((ingredientesDo(produto).length||adicionaisDo(produto).length)&&typeof window.personalizarProduto==="function")return window.personalizarProduto(produto.nome,preco,ingredientesDo(produto),adicionaisDo(produto));
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
window.irParaSecao=id=>{
  const alvo=String(id||"").trim();
  const normal=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"");
  const n=normal(alvo);
  const secoes=Array.from(document.querySelectorAll(".secao"));
  let sec=document.getElementById(alvo)||document.getElementById("cat-"+alvo);
  if(!sec&&n){
    sec=secoes.find(x=>{
      const idn=normal(x.id), hn=normal(x.querySelector("h2")?.textContent);
      return idn===n||hn===n||idn===n.replace(/s$/i,"")||idn===n+"s"||hn===n.replace(/s$/i,"")||hn===n+"s";
    });
  }
  const p=document.getElementById("pesquisa");if(p)p.value="";aplicarPesquisa("");
  if(sec)sec.scrollIntoView({behavior:"smooth",block:"start"});
};

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
function metaConfigFidelidade(){const raw=String(config?.informacoes||"");const i=raw.lastIndexOf("ELSHADDAI_CONFIG_V3|");if(i<0)return null;try{const x=JSON.parse(raw.slice(i+"ELSHADDAI_CONFIG_V3|".length).trim());return x?.fidelidade?{...x.fidelidade,reset_fidelidade_em:x.reset_fidelidade_em||null,mensagem_fidelidade:x.mensagem_fidelidade||x.fidelidade.mensagem||"Olá {nome}, você atingiu sua meta de fidelidade: {beneficio}."}:null}catch{return null}}
async function consultarFidelidadeCliente(){const box=document.getElementById("fidelidadeResultadoCliente"),tel=document.getElementById("fidelidadeTelefoneCliente")?.value.replace(/\D/g,"")||"",f=metaConfigFidelidade();if(!box)return;if(tel.length<10){box.innerHTML="<span>Informe um telefone válido.</span>";return}if(!f?.ativo){box.innerHTML="<span>A fidelidade dos clientes ainda não está configurada.</span>";return}try{const r=await window.supabaseClient.from("pedidos").select("cliente_nome,cliente_telefone,endereco,total,status,observacao,criado_em").eq("cliente_telefone",tel);if(r.error)throw r.error;const ps=(r.data||[]).filter(p=>{let meta={};try{meta=JSON.parse(p.observacao||"{}")}catch{}return (p.status||"novo")!=="cancelado"&&meta.modoTeste!==true&&(!f.reset_fidelidade_em||new Date(p.criado_em)>new Date(f.reset_fidelidade_em));});const c=ps[0];if(!c){box.innerHTML="<span>Nenhum cadastro encontrado para este telefone.</span>";return}const meta=Math.max(1,Number(f.meta||1)),compras=ps.length,faltam=compras>=meta?0:meta-(compras%meta),beneficios=Math.floor(compras/meta);const nomeCliente=c.cliente_nome||"Cliente",beneficio=f.beneficio||"Benefício",tpl=f.mensagem_fidelidade||f.mensagem||"Olá {nome}, você atingiu sua meta de fidelidade: {beneficio}.",msg=encodeURIComponent(tpl.replaceAll("{nome}",nomeCliente).replaceAll("{beneficio}",beneficio)),whats="https://wa.me/"+tel+"?text="+msg;box.innerHTML=`<strong>${esc(nomeCliente)}</strong><br>${compras} compra(s) registrada(s).<br>${beneficios?`Benefício disponível: ${esc(beneficio)}.<br><a class="botao" href="${whats}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px">WhatsApp — avisar que atingiu a meta</a>`:`Faltam ${faltam} compra(s) para: ${esc(beneficio)}.`}`;}catch(e){box.innerHTML="<span>Não foi possível consultar a fidelidade agora.</span>"}}
function prepararFidelidadeCliente(){const box=document.getElementById("fidelidadeCliente"),btn=document.getElementById("btnFidelidadeCliente");if(!box||!btn)return;const f=metaConfigFidelidade();if(!f?.ativo){box.style.display="none";return}box.style.display="block";btn.onclick=consultarFidelidadeCliente}
function registrarVisita(){
  if(sessionStorage.getItem("elshaddai_visita_registrada"))return;
  sessionStorage.setItem("elshaddai_visita_registrada","1");
  const h=JSON.parse(localStorage.getItem("elshaddai_visitas_historico")||"[]");h.push(new Date().toISOString());localStorage.setItem("elshaddai_visitas_historico",JSON.stringify(h.slice(-10000)));localStorage.setItem("elshaddai_visitas_total",String(h.length));
}
document.addEventListener("DOMContentLoaded",()=>{
  registrarVisita();
  if(new URLSearchParams(location.search).get("modo")==="manual"){const n=document.getElementById("modoManualAviso");if(n)n.style.display="block"}
  const p=document.getElementById("pesquisa"),b=document.getElementById("btnPesquisa");
  p?.addEventListener("input",e=>aplicarPesquisa(e.target.value));p?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();window.executarPesquisa()}});
  b?.addEventListener("click",window.executarPesquisa);
  sincronizar();
  setInterval(sincronizar,20000);
  window.addEventListener("focus",sincronizar);
});
window.sincronizarCardapioSupabase=sincronizar;
})();

/* Funções auxiliares para a combinação configurável */
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const moeda=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const listaFlex=v=>Array.isArray(v)?v:(typeof v==="string"?(()=>{try{const x=JSON.parse(v);return Array.isArray(x)?x:[]}catch{return[]}})():[]);
function pizzaCfg(){const c=window.elShaddaiConfig||{},raw=String(c.informacoes||""),m=raw.split("\n").filter(l=>l.startsWith("ELSHADDAI_CONFIG_V3|")).pop();if(!m)return {ativo:false,modo_preco:"maior",max_sabores:2,categorias:[],produtos:[]};try{return JSON.parse(m.slice("ELSHADDAI_CONFIG_V3|".length)).pizza||{}}catch{return {}}}
/* Pizza metade/metade */
window.escolherMesclaProduto=function(produto,lista){
 const cfg=pizzaCfg(),max=Math.max(2,Number(cfg.max_sabores||2)),permitidos=new Set((cfg.produtos||[]).map(String)),cats=new Set((cfg.categorias||[]).map(String));
 let disponiveis=(lista||[]).filter(p=>String(p.id)!==String(produto.id)&&p.ativo!==false&&p.disponivel!==false);
 if(permitidos.size)disponiveis=disponiveis.filter(p=>permitidos.has(String(p.id))||permitidos.has(String(produto.id)));
 else if(cats.size)disponiveis=disponiveis.filter(p=>cats.has(String(p.categoria))||cats.has(String(produto.categoria)));
 const antigo=document.getElementById("mesclaProdutoModal");if(antigo)antigo.remove();const fundo=document.createElement("div");fundo.id="mesclaProdutoModal";fundo.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:99999;display:flex;align-items:center;justify-content:center;padding:15px";
 const caixa=document.createElement("div");caixa.style.cssText="width:100%;max-width:540px;background:#fff8e7;border:3px solid #ffb300;border-radius:18px;padding:18px;max-height:90vh;overflow:auto";
 caixa.innerHTML=`<h2 style="text-align:center;color:#c62828;margin-top:0">Monte sua pizza</h2><p><strong>Escolha os sabores</strong> — até ${max} sabor(es).</p><label style="display:flex;gap:10px;align-items:center;background:#fff;border:2px solid #ffb300;border-radius:12px;padding:12px;margin-bottom:8px"><input type="checkbox" checked disabled> ${esc(produto.nome)}</label>${disponiveis.map((p,i)=>`<label style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px;margin-bottom:8px"><span>${esc(p.nome)}</span><input type="checkbox" class="mesclaSabor" value="${i}" style="width:22px;height:22px"></label>`).join("")||"<div class='note'>Nenhum outro produto permitido para combinação.</div>"}<p id="mesclaAviso" class="help">Escolha pelo menos 1 sabor além do primeiro.</p><button id="confirmarMescla" class="botao" style="width:100%;margin-top:10px">Adicionar ao carrinho</button><button id="fecharMescla" style="width:100%;padding:12px;margin-top:8px;background:#fff;border:1px solid #c62828;border-radius:11px;color:#c62828;font-weight:700">Fechar</button>`;
 fundo.appendChild(caixa);document.body.appendChild(fundo);
 const aviso=caixa.querySelector("#mesclaAviso");caixa.querySelectorAll(".mesclaSabor").forEach(c=>c.addEventListener("change",()=>{const n=caixa.querySelectorAll(".mesclaSabor:checked").length+1;aviso.textContent=n>max?`Você pode escolher no máximo ${max} sabores.`:`${n} sabor(es) selecionado(s).`;caixa.querySelectorAll(".mesclaSabor").forEach(x=>{if(!x.checked&&n>=max)x.disabled=true;else if(n<max)x.disabled=false})}));
 caixa.querySelector("#confirmarMescla").onclick=()=>{const escolhidos=[produto,...Array.from(caixa.querySelectorAll(".mesclaSabor:checked")).map(c=>disponiveis[Number(c.value)])];if(escolhidos.length<2||escolhidos.length>max)return;const nomes=escolhidos.map(x=>x.nome),detalhes=nomes.map((n,i)=>`Sabor ${i+1}: ${n}`);const tamanhos=listaFlex(produto.tamanhos).map((t,i)=>({nome:String(t?.nome||""),preco:Number(t?.preco||0)})).filter(t=>t.nome);const baseTamanhos=tamanhos.length?tamanhos:listaFlex(escolhidos.find(x=>listaFlex(x.tamanhos).length)?.tamanhos).map(t=>({nome:String(t?.nome||""),preco:Number(t?.preco||0)})).filter(t=>t.nome);const opcoes=baseTamanhos.map(t=>{const vals=escolhidos.map(x=>{const tx=listaFlex(x.tamanhos).find(z=>String(z?.nome)===String(t.nome));return Number(tx?.preco??x.preco??0)});const pr=cfg.modo_preco==="media"?vals.reduce((a,b)=>a+b,0)/vals.length:Math.max(...vals);return {nome:t.nome,preco:pr}});let preco=escolhidos.reduce((s,x)=>s+Number(x.preco||0),0);if(cfg.modo_preco==="media")preco/=escolhidos.length;else preco=Math.max(...escolhidos.map(x=>Number(x.preco||0)));const detalhesBase=detalhes.concat(`${cfg.modo_preco==="media"?"Preço pela média":"Preço pelo sabor mais caro"}`);const nome=`${nomes.join(" + ")}${opcoes.length?"":" "}`;if(typeof window.adicionarProdutoComTamanhos==="function"&&opcoes.length){window.adicionarProdutoComTamanhos({produto:{nome,preco,ingredientes:[],adicionais:[]},tamanhos:opcoes,ingredientes:[],adicionais:[],detalhesBase});}else if(typeof window.adicionarItemPersonalizado==="function"){window.adicionarItemPersonalizado({nome,preco,quantidade:1,detalhes:detalhesBase})}fundo.remove()};
 caixa.querySelector("#fecharMescla").onclick=()=>fundo.remove();
};
/* Tamanho e personalização de qualquer produto */
window.escolherPizzaProduto=function(nome,tamanhos,ingredientes,adicionais){if(typeof window.adicionarProdutoComTamanhos==="function")window.adicionarProdutoComTamanhos({produto:{nome,preco:Number(tamanhos?.[0]?.preco||0),ingredientes,adicionais},tamanhos,ingredientes,adicionais});};
window.escolherTamanhoProduto=window.escolherPizzaProduto;
