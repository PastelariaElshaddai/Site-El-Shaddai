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
        if(tamanhos.length&&cat==="pizza"&&typeof window.escolherPizzaProduto==="function")return window.escolherPizzaProduto(produto.nome,tamanhos,ingredientesDo(produto),adicionaisDo(produto));
        if(tamanhos.length&&typeof window.escolherTamanhoProduto==="function")return window.escolherTamanhoProduto(produto.nome,tamanhos,ingredientesDo(produto),adicionaisDo(produto));
        if((ingredientesDo(produto).length||adicionaisDo(produto).length)&&typeof window.personalizarProduto==="function")return window.personalizarProduto(produto.nome,preco,ingredientesDo(produto),adicionaisDo(produto));
        if(produtoMesclavel(produto)&&typeof window.escolherMesclaProduto==="function")return window.escolherMesclaProduto(produto,ps);
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
  const status=document.getElementById("statusLojaCliente");
  if(!window.supabaseClient){
    if(status){status.textContent="Erro de conexão";status.classList.remove("open");status.classList.add("closed")}
    return;
  }
  try{
    const consultas=Promise.all([
      window.supabaseClient.from("configuracoes_loja").select("*").order("id",{ascending:true}).limit(1),
      window.supabaseClient.from("categorias").select("*").eq("ativo",true).order("id",{ascending:true}),
      window.supabaseClient.from("produtos").select("*").eq("ativo",true).order("id",{ascending:true}),
      window.supabaseClient.from("promocoes").select("*").order("id",{ascending:false})
    ]);
    const limite=new Promise((_,reject)=>setTimeout(()=>reject(new Error("Tempo limite ao consultar o Supabase.")),15000));
    const [rc,rp,rs,rpromo]=await Promise.race([consultas,limite]);
    if(rc.error)throw rc.error;if(rp.error)throw rp.error;if(rs.error)throw rs.error;if(rpromo.error)throw rpromo.error;
    config=(rc.data||[])[0]||null;categorias=rp.data||[];produtos=rs.data||[];promocoes=rpromo.data||[];
    aplicarConfiguracao(config);renderCategorias();renderProdutos();renderPromocoesCliente();
    document.documentElement.dataset.cardapioSupabase="ok";
  }catch(e){
    console.error("Erro ao atualizar cardápio:",e);
    document.documentElement.dataset.cardapioSupabase="erro";
    if(status){status.textContent="Erro ao conectar";status.classList.remove("open");status.classList.add("closed")}
  }
}
function metaConfigFidelidade(){const raw=String(config?.informacoes||"");const i=raw.lastIndexOf("ELSHADDAI_CONFIG_V3|");if(i<0)return null;try{const x=JSON.parse(raw.slice(i+"ELSHADDAI_CONFIG_V3|".length).trim());return x?.fidelidade?{...x.fidelidade,reset_fidelidade_em:x.reset_fidelidade_em||null,mensagem_fidelidade:x.mensagem_fidelidade||x.fidelidade.mensagem||"Olá {nome}, você atingiu sua meta de fidelidade: {beneficio}."}:null}catch{return null}}
async function consultarFidelidadeCliente(){const box=document.getElementById("fidelidadeResultadoCliente"),tel=document.getElementById("fidelidadeTelefoneCliente")?.value.replace(/\D/g,"")||"",f=metaConfigFidelidade();if(!box)return;if(tel.length<10){box.innerHTML="<span>Informe um telefone válido.</span>";return}if(!f?.ativo){box.innerHTML="<span>A fidelidade dos clientes ainda não está configurada.</span>";return}try{const r=await window.supabaseClient.from("pedidos").select("cliente_nome,cliente_telefone,endereco,total,status,observacao,criado_em").eq("cliente_telefone",tel);if(r.error)throw r.error;const ps=(r.data||[]).filter(p=>{let meta={};try{meta=JSON.parse(p.observacao||"{}")}catch{}return (p.status||"novo")!=="cancelado"&&meta.modoTeste!==true&&(!f.reset_fidelidade_em||new Date(p.criado_em)>new Date(f.reset_fidelidade_em));});const c=ps[0];if(!c){box.innerHTML="<span>Nenhum cadastro encontrado para este telefone.</span>";return}const meta=Math.max(1,Number(f.meta||1)),compras=ps.length,faltam=compras>=meta?0:meta-(compras%meta),beneficios=Math.floor(compras/meta);const nomeCliente=c.cliente_nome||"Cliente",beneficio=f.beneficio||"Benefício",tpl=f.mensagem_fidelidade||f.mensagem||"Olá {nome}, você atingiu sua meta de fidelidade: {beneficio}.",msg=encodeURIComponent(tpl.replaceAll("{nome}",nomeCliente).replaceAll("{beneficio}",beneficio)),whats="https://wa.me/"+tel+"?text="+msg;box.innerHTML=`<strong>${esc(nomeCliente)}</strong><br>${compras} compra(s) registrada(s).<br>${beneficios?`Benefício disponível: ${esc(beneficio)}.<br><a class="botao" href="${whats}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px">WhatsApp — avisar que atingiu a meta</a>`:`Faltam ${faltam} compra(s) para: ${esc(beneficio)}.`}`;}catch(e){box.innerHTML="<span>Não foi possível consultar a fidelidade agora.</span>"}}
function prepararFidelidadeCliente(){const box=document.getElementById("fidelidadeCliente"),btn=document.getElementById("btnFidelidadeCliente");if(!box||!btn)return;const f=metaConfigFidelidade();if(!f?.ativo){box.style.display="none";return}box.style.display="block";btn.onclick=consultarFidelidadeCliente}
function registrarVisita(){
  if(sessionStorage.getItem("elshaddai_visita_registrada"))return;
  sessionStorage.setItem("elshaddai_visita_registrada","1");
  const n=Number(localStorage.getItem("elshaddai_visitas_total")||0)+1;localStorage.setItem("elshaddai_visitas_total",String(n));
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

/* Pizza metade/metade */
window.escolherMesclaProduto=function(produto,lista){
 const disponiveis=(lista||[]).filter(p=>String(p.id)!==String(produto.id)&&p.ativo!==false&&p.disponivel!==false);const antigo=document.getElementById("mesclaProdutoModal");if(antigo)antigo.remove();const fundo=document.createElement("div");fundo.id="mesclaProdutoModal";fundo.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:15px";const caixa=document.createElement("div");caixa.style.cssText="width:100%;max-width:520px;background:#fff8e7;border:3px solid #ffb300;border-radius:18px;padding:18px;max-height:90vh;overflow:auto";const ts=listaFlex(produto.tamanhos).filter(t=>t?.nome).map((t,i)=>`<option value="${i}">${esc(t.nome)} — ${moeda(t.preco)}</option>`).join("");caixa.innerHTML=`<h2 style="text-align:center;color:#c62828;margin-top:0">Monte sua mistura</h2><p><strong>Primeira parte:</strong> ${esc(produto.nome)}</p><p><strong>Escolha a outra parte:</strong></p>${disponiveis.length?disponiveis.map((p,i)=>`<label style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px;margin-bottom:8px"><span>${esc(p.nome)} — ${moeda(p.preco)}</span><input type="radio" name="segundaMetade" value="${i}" style="width:21px;height:21px"></label>`).join(""):"<div class='note'>Cadastre outro produto da mesma categoria para permitir a mistura.</div>"}${ts?`<label style="display:block;margin-top:14px"><strong>Tamanho</strong><select id="mesclaTamanho" style="width:100%;margin-top:6px;padding:12px;border-radius:10px;border:1px solid #ddd"><option value="">Usar preço padrão</option>${ts}</select></label>`:""}<button id="confirmarMescla" style="width:100%;padding:14px;margin-top:15px;background:#ffb300;border:0;border-radius:11px;font-weight:700">Adicionar ao carrinho</button><button id="fecharMescla" style="width:100%;padding:12px;margin-top:8px;background:#fff;border:1px solid #c62828;border-radius:11px;color:#c62828;font-weight:700">Fechar</button>`;fundo.appendChild(caixa);document.body.appendChild(fundo);caixa.querySelector("#confirmarMescla").onclick=()=>{const r=caixa.querySelector("input[name='segundaMetade']:checked");if(!r)return;const outra=disponiveis[Number(r.value)];let preco=Math.max(Number(produto.preco||0),Number(outra.preco||0)),nome=`${produto.nome} metade + ${outra.nome} metade`,detalhes=["Metade: "+produto.nome,"Metade: "+outra.nome];const sel=caixa.querySelector("#mesclaTamanho");if(sel&&sel.value!==""){const i=Number(sel.value),a=listaFlex(produto.tamanhos)[i],b=listaFlex(outra.tamanhos)[i]||listaFlex(outra.tamanhos).find(x=>String(x.nome)===String(a?.nome));if(a){preco=Math.max(Number(a.preco||0),Number(b?.preco||0));nome+=` - ${a.nome}`;detalhes.push("Tamanho: "+a.nome)}}if(typeof window.adicionarItemPersonalizado==="function")window.adicionarItemPersonalizado({nome,preco,quantidade:1,detalhes});fundo.remove()};caixa.querySelector("#fecharMescla").onclick=()=>fundo.remove()};

/* Tamanho e personalização de qualquer produto */
window.escolherPizzaProduto=function(nome,tamanhos,ingredientes,adicionais){const antigo=document.getElementById("pizzaProdutoModal");if(antigo)antigo.remove();const fundo=document.createElement("div");fundo.id="pizzaProdutoModal";fundo.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:999999;display:flex;align-items:center;justify-content:center;padding:12px;";const caixa=document.createElement("div");caixa.style.cssText="width:100%;max-width:540px;background:#fff8e7;border:3px solid #ffb300;border-radius:20px;padding:18px;max-height:92vh;overflow:auto;box-sizing:border-box;";const ts=(tamanhos||[]).map((t,i)=>`<label style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:2px solid #ddd;border-radius:12px;padding:13px;margin-bottom:8px;cursor:pointer"><span><strong>${esc(t.nome)}</strong> — <span style="color:#c62828;font-weight:700">${moeda(t.preco)}</span></span><input type="radio" name="pizzaTamanho" value="${i}" ${i===0?"checked":""} style="width:22px;height:22px"></label>`).join("");const ings=(ingredientes||[]).map((a,i)=>`<label style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer"><span>${esc(a.nome||"")}</span><span><input type="checkbox" class="pizzaRetirar" data-index="${i}" style="width:22px;height:22px"> retirar</span></label>`).join("");const ads=(adicionais||[]).map((a,i)=>`<label style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer"><span>${esc(a.nome)} <strong style="color:#c62828">+ ${moeda(a.preco)}</strong></span><input type="checkbox" class="pizzaAdicional" data-index="${i}" style="width:22px;height:22px"></label>`).join("");caixa.innerHTML=`<h2 style="text-align:center;color:#c62828;margin:0 0 8px">Personalizar produto</h2><p style="text-align:center;font-weight:700;margin-top:0">${esc(nome)}</p><h3 style="color:#c62828">Escolha o tamanho</h3>${ts||'<p>Nenhum tamanho cadastrado.</p>'}${ings?'<h3 style="color:#c62828;margin-top:18px">Ingredientes</h3><p style="margin-top:-4px;color:#666">Marque os ingredientes que deseja retirar.</p>'+ings:''}${ads?'<h3 style="color:#c62828;margin-top:18px">Adicionais</h3>'+ads:''}<div id="pizzaTotal" style="font-size:21px;font-weight:700;color:#c62828;text-align:right;margin-top:14px">Total: ${moeda(tamanhos?.[0]?.preco||0)}</div><button id="confirmarPizza" type="button" style="width:100%;padding:15px;margin-top:15px;background:#ffb300;border:0;border-radius:12px;font-weight:700;font-size:18px">Adicionar ao carrinho</button><button id="fecharPizza" type="button" style="width:100%;padding:13px;margin-top:9px;background:#fff;border:2px solid #c62828;border-radius:12px;color:#c62828;font-weight:700">Fechar</button>`;fundo.appendChild(caixa);document.body.appendChild(fundo);const totalEl=caixa.querySelector("#pizzaTotal");function totalAtual(){const r=caixa.querySelector("input[name='pizzaTamanho']:checked");const t=r?(tamanhos||[])[Number(r.value)]:null;let total=Number(t?.preco||0);caixa.querySelectorAll(".pizzaAdicional:checked").forEach(c=>total+=Number((adicionais||[])[Number(c.dataset.index)]?.preco||0));return total}caixa.querySelectorAll("input[name='pizzaTamanho'], .pizzaAdicional").forEach(x=>x.addEventListener("change",()=>{totalEl.textContent="Total: "+moeda(totalAtual())}));caixa.querySelector("#confirmarPizza").onclick=()=>{const r=caixa.querySelector("input[name='pizzaTamanho']:checked");if(!r)return;const t=(tamanhos||[])[Number(r.value)];if(!t)return;const detalhes=["Tamanho: "+t.nome];let total=Number(t.preco||0);caixa.querySelectorAll(".pizzaRetirar:checked").forEach(c=>{const a=(ingredientes||[])[Number(c.dataset.index)];if(a?.nome)detalhes.push("Sem "+a.nome)});caixa.querySelectorAll(".pizzaAdicional:checked").forEach(c=>{const a=(adicionais||[])[Number(c.dataset.index)];if(a){total+=Number(a.preco||0);detalhes.push("Com "+a.nome)}});if(typeof window.adicionarItemPersonalizado!=="function")return;window.adicionarItemPersonalizado({nome:nome+" - "+t.nome,preco:total,quantidade:1,detalhes});fundo.remove()};caixa.querySelector("#fecharPizza").onclick=()=>fundo.remove()};
window.escolherTamanhoProduto=function(nome,tamanhos,ingredientes,adicionais){
  window.escolherPizzaProduto(nome,tamanhos,ingredientes,adicionais);
};
