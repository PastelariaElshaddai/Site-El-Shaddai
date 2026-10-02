const $=id=>document.getElementById(id);
const supabaseClient=window.supabaseClient;
let produtos=[],categorias=[],pedidos=[],clientes=[],promocoes=[],configLoja=null;
let ingredientesAtual=[],adicionalAtual=[],adicionaisCatalogo=[],tamanhosAtual=[],fotoAtual=null,logoData=null,bannerData=null;
let pesquisaProdutos="",categoriaFiltro="",statusPedidoFiltro="todos";
const fidKeyMeta="elshaddai_fidelidade_meta",fidKeyBen="elshaddai_fidelidade_beneficio";

const moeda=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const arr=v=>Array.isArray(v)?v:[];
function statusTexto(s){return ({novo:"Novo",em_preparo:"Em preparo",pronto:"Pronto",saiu_entrega:"Saiu para entrega",concluido:"Concluído",cancelado:"Cancelado"}[s]||s||"Novo");}
function dataBR(v){try{return new Date(v).toLocaleString("pt-BR")}catch{return String(v||"")}}

function definirStatus(texto, tipo="ok") {
  const el=$("status");
  if(!el)return;
  el.textContent=texto;
  el.style.background=tipo==="erro"?"#ffe8e8":"#eaf8ee";
  el.style.color=tipo==="erro"?"#a00018":"#237b39";
}

async function testarConexaoSupabase(){
  try{
    if(!window.supabaseClient) throw new Error("Cliente Supabase não carregado.");
    const r=await window.supabaseClient.from("categorias").select("id",{head:true,count:"exact"});
    if(r.error) throw r.error;
    definirStatus("Conectado");
    return true;
  }catch(e){
    console.error("Falha na conexão com Supabase:",e);
    definirStatus("Não conectado","erro");
    return false;
  }
}

async function iniciar(){
  document.querySelectorAll(".nav button").forEach(b=>b.addEventListener("click",()=>abrirTela(b.dataset.screen)));
  const fp=$("fotoProduto"); if(fp)fp.addEventListener("change",e=>lerImagem(e.target,f=>{fotoAtual=f;mostrarImagem("previewFoto",f)}));
  const lf=$("configLogoFile"); if(lf)lf.addEventListener("change",e=>lerImagem(e.target,f=>{logoData=f;mostrarImagem("configLogoPreview",f)}));
  const bf=$("configBannerFile"); if(bf)bf.addEventListener("change",e=>lerImagem(e.target,f=>{bannerData=f;mostrarImagem("configBannerPreview",f)}));
  await carregarTudoCompleto();
}
function lerImagem(input,cb){const f=input.files?.[0];if(!f)return;if(f.size>1800000){alert("A imagem deve ter no máximo 1,8 MB.");input.value="";return}const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(f)}
function mostrarImagem(id,src){const i=$(id);if(i&&src){i.src=src;i.style.display="block"}}
function abrirTela(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id)?.classList.add("active");document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.screen===id));const tit={inicio:"Início",produtos:"Produtos",categorias:"Categorias",configuracao:"Configuração da Loja",pedidos:"Pedidos",clientes:"Clientes",dashboard:"Dashboard",promocoes:"Promoções e Cupons",fidelidade:"Fidelidade dos Clientes",whatsapp:"Integração do WhatsApp"};$("tituloTela").textContent=tit[id]||"Início";if(id==="configuracao")carregarConfiguracaoLoja();if(id==="pedidos")carregarPedidos();if(id==="clientes")carregarClientes();if(id==="dashboard")carregarDashboard();if(id==="promocoes")carregarPromocoes();if(id==="fidelidade")carregarFidelidade();if(id==="whatsapp")carregarWhatsApp()}

async function carregarTudoCompleto(){
  definirStatus("Conectando...");
  try{
    if(!window.supabaseClient)throw new Error("Cliente Supabase não carregado.");
    const db=window.supabaseClient;
    const [cats,prods,conf]=await Promise.all([
      db.from("categorias").select("*").order("id"),
      db.from("produtos").select("*").order("id",{ascending:false}),
      db.from("configuracoes_loja").select("*").order("id",{ascending:true}).limit(1)
    ]);
    if(cats.error)throw cats.error;if(prods.error)throw prods.error;if(conf.error)throw conf.error;
    categorias=cats.data||[];produtos=prods.data||[];configLoja=(conf.data||[])[0]||null;
    montarAdicionais();popularCategorias();renderProdutos();renderCategorias();aplicarConfigNosCampos();
    definirStatus("Conectado");
    await Promise.allSettled([carregarPedidos(true),carregarClientes(true),carregarDashboard(true),carregarPromocoes(true),carregarFidelidade(true),carregarWhatsApp(true)]);
  }catch(e){
    console.error("Falha ao carregar ADM:",e);definirStatus("Não conectado","erro");
    const ajuda=$("configAjuda");if(ajuda)ajuda.textContent="Falha ao acessar o Supabase: "+(e?.message||"erro desconhecido");
  }
}

function popularCategorias(){const cats=categorias.filter(c=>c.ativo!==false);$("categoriaProduto").innerHTML=cats.map(c=>`<option value="${esc(c.nome)}">${esc(c.nome)}</option>`).join("")||'<option value="">Nenhuma categoria</option>';$("filtroCategoriaProdutos").innerHTML='<option value="">Todas</option>'+cats.map(c=>`<option value="${esc(c.nome)}">${esc(c.nome)}</option>`).join("")}
function montarAdicionais(){const m=new Map();produtos.forEach(p=>arr(p.adicionais).forEach(a=>{if(a?.nome)m.set(a.nome,{nome:a.nome,preco:Number(a.preco||0)})}));adicionaisCatalogo=[...m.values()]}

function novoProduto(){limparFormProduto();$("formTitulo").textContent="Novo produto";$("formProduto").classList.add("open");popularCategorias();}
function editarProduto(id){const p=produtos.find(x=>String(x.id)===String(id));if(!p)return;limparFormProduto();$("formTitulo").textContent="Editar produto";$("produtoId").value=p.id;$("nomeProduto").value=p.nome||"";$("precoProduto").value=p.preco??"";$("categoriaProduto").value=p.categoria||"";$("descricaoProduto").value=p.descricao||"";$("produtoAtivo").checked=p.ativo!==false;$("produtoDisponivel").checked=p.disponivel!==false;fotoAtual=p.foto||null;mostrarImagem("previewFoto",fotoAtual);tamanhosAtual=arr(p.tamanhos).map(x=>({nome:String(x.nome||""),preco:Number(x.preco||0)}));const temT=$("produtoTemTamanhos"); if(temT)temT.checked=tamanhosAtual.length>0;renderizarTamanhosAdmin();ingredientesAtual=arr(p.ingredientes).map(x=>typeof x==="string"?{nome:x,podeRetirar:true}:{nome:x.nome||"",podeRetirar:x.podeRetirar!==false});adicionalAtual=arr(p.adicionais).map(x=>({nome:x.nome,preco:Number(x.preco||0)}));renderIngredientes();renderAdicionais();$("formProduto").classList.add("open");}
function limparFormProduto(){
  $("produtoId").value="";$("nomeProduto").value="";$("precoProduto").value="";$("descricaoProduto").value="";$("fotoProduto").value="";
  $("produtoAtivo").checked=true;$("produtoDisponivel").checked=true;fotoAtual=null;ingredientesAtual=[];adicionalAtual=[];tamanhosAtual=[];
  const tt=$("produtoTemTamanhos");if(tt)tt.checked=false;const te=$("tamanhosEditor");if(te)te.style.display="none";renderizarTamanhosAdmin();
  $("previewFoto").style.display="none";$("previewFoto").removeAttribute("src");renderIngredientes();renderAdicionais();
}
function cancelarProduto(){$("formProduto").classList.remove("open")}
function alternarTamanhosProduto(){
  const ativo=$("produtoTemTamanhos")?.checked;
  const editor=$("tamanhosEditor");
  if(editor)editor.style.display=ativo?"block":"none";
  if(ativo && !tamanhosAtual.length) renderizarTamanhosAdmin();
}
function adicionarTamanhoProduto(){
  const nome=$("novoTamanhoNome")?.value.trim();
  const preco=Number($("novoTamanhoPreco")?.value);
  if(!nome||!Number.isFinite(preco)||preco<0)return alert("Informe o nome e o preço do tamanho.");
  if(tamanhosAtual.some(t=>t.nome.toLowerCase()===nome.toLowerCase()))return alert("Esse tamanho já foi adicionado.");
  tamanhosAtual.push({nome,preco});
  $("novoTamanhoNome").value="";$("novoTamanhoPreco").value="";
  const ativo=$("produtoTemTamanhos");if(ativo)ativo.checked=true;
  alternarTamanhosProduto();renderizarTamanhosAdmin();
}
function removerTamanhoProduto(i){tamanhosAtual.splice(i,1);renderizarTamanhosAdmin()}
function renderizarTamanhosAdmin(){
  const lista=$("listaTamanhos");if(!lista)return;
  lista.innerHTML=tamanhosAtual.length?tamanhosAtual.map((t,i)=>`<div class="ingredient-row"><div class="check"><strong>${esc(t.nome)}</strong> — ${moeda(t.preco)}</div><button class="btn danger" type="button" onclick="removerTamanhoProduto(${i})">Remover</button></div>`).join(""):"<div class='help'>Nenhum tamanho cadastrado.</div>";
}

function adicionarIngrediente(){const n=$("novoIngrediente").value.trim();if(!n)return;if(ingredientesAtual.some(x=>x.nome.toLowerCase()===n.toLowerCase()))return alert("Esse ingrediente já foi adicionado.");ingredientesAtual.push({nome:n,podeRetirar:true});$("novoIngrediente").value="";renderIngredientes()}
function removerIngrediente(i){ingredientesAtual.splice(i,1);renderIngredientes()}
function renderIngredientes(){$("ingredientesLista").innerHTML=ingredientesAtual.length?ingredientesAtual.map((x,i)=>`<div class="ingredient-row"><label class="check"><input type="checkbox" ${x.podeRetirar!==false?"checked":""} onchange="ingredientesAtual[${i}].podeRetirar=this.checked"> ${esc(x.nome)}</label><button class="btn danger" onclick="removerIngrediente(${i})">Remover</button></div>`).join(""):"<div class='help'>Nenhum ingrediente cadastrado.</div>"}
function criarAdicional(){const n=$("novoAdicionalNome").value.trim(),p=Number($("novoAdicionalPreco").value);if(!n||!Number.isFinite(p)||p<0)return alert("Informe nome e preço do adicional.");const e=adicionaisCatalogo.find(a=>a.nome.toLowerCase()===n.toLowerCase());if(e)e.preco=p;else adicionaisCatalogo.push({nome:n,preco:p});if(!adicionalAtual.some(a=>a.nome===n))adicionalAtual.push({nome:n,preco:p});$("novoAdicionalNome").value="";$("novoAdicionalPreco").value="";renderAdicionais()}
function renderAdicionais(){$("adicionaisLista").innerHTML=adicionaisCatalogo.map((a,i)=>`<label class="check"><input type="checkbox" ${adicionalAtual.some(x=>x.nome===a.nome)?"checked":""} onchange="alternarAdicional(${i},this.checked)"> ${esc(a.nome)} — ${moeda(a.preco)}</label>`).join("")||"<span class='help'>Nenhum adicional criado.</span>"}
function alternarAdicional(i,ok){const a=adicionaisCatalogo[i];if(ok&&!adicionalAtual.some(x=>x.nome===a.nome))adicionalAtual.push({...a});if(!ok)adicionalAtual=adicionalAtual.filter(x=>x.nome!==a.nome)}
async function salvarProduto(){const nome=$("nomeProduto").value.trim(),preco=Number($("precoProduto").value),categoria=$("categoriaProduto").value;if(!nome||!Number.isFinite(preco)||preco<0||!categoria)return alert("Preencha nome, preço e categoria.");const payload={nome,preco,categoria,descricao:$("descricaoProduto").value.trim(),ativo:$("produtoAtivo").checked,disponivel:$("produtoDisponivel").checked,foto:fotoAtual||null,ingredientes:ingredientesAtual,adicionais:adicionalAtual,tamanhos:$("produtoTemTamanhos")?.checked?tamanhosAtual:[]};const id=$("produtoId").value;const r=id?await supabaseClient.from("produtos").update(payload).eq("id",id):await supabaseClient.from("produtos").insert(payload);if(r.error)return alert("Não foi possível salvar o produto.\n\n"+r.error.message);cancelarProduto();await carregarTudoCompleto()}
async function excluirProduto(id){if(!confirm("Excluir este produto?"))return;const r=await supabaseClient.from("produtos").delete().eq("id",id);if(r.error)return alert(r.error.message);await carregarTudoCompleto()}
function aplicarPesquisaProdutos(){$("pesquisaProdutos").value;pesquisaProdutos=$("pesquisaProdutos").value.trim().toLowerCase();renderProdutos()}
function aplicarFiltroCategoria(){categoriaFiltro=$("filtroCategoriaProdutos").value;renderProdutos()}
function renderProdutos(){const termo=pesquisaProdutos,box=$("listaProdutos");if(!box)return;const f=produtos.filter(p=>(!categoriaFiltro||p.categoria===categoriaFiltro)&&(!termo||[p.nome,p.categoria,p.descricao].join(" ").toLowerCase().includes(termo)));box.innerHTML=f.length?f.map(p=>`<article class="product">${p.foto?`<img src="${esc(p.foto)}" alt="">`:`<div style="width:78px;height:78px;border-radius:12px;background:#eee;display:grid;place-items:center">Sem foto</div>`}<div><h3>${esc(p.nome)} <span class="badge ${p.ativo!==false?"on":"off"}">${p.ativo!==false?"Ativo":"Inativo"}</span> <span class="badge ${p.disponivel!==false?"on":"off"}">${p.disponivel!==false?"Disponível":"Indisponível"}</span></h3><p>${esc(p.categoria||"Sem categoria")}</p><p>${esc(p.descricao||"Sem descrição")}</p><p class="price">${moeda(p.preco)}</p>${arr(p.tamanhos).length?`<p><strong>Tamanhos:</strong> ${arr(p.tamanhos).map(t=>`${esc(t.nome)} — ${moeda(t.preco)}`).join(" · ")}</p>`:""}</div><div class="actions"><button class="btn light" onclick="editarProduto('${String(p.id)}')">Editar</button><button class="btn danger" onclick="excluirProduto('${String(p.id)}')">Excluir</button></div></article>`).join(""):"<div class='empty'>Nenhum produto encontrado.</div>"}



async function salvarCategoria(){const id=$("categoriaEditId").value,nome=$("nomeCategoria").value.trim(),descricao=$("descricaoCategoria").value.trim(),ativo=$("categoriaAtiva").checked;if(!nome)return alert("Informe o nome da categoria.");const dup=categorias.some(c=>c.nome.toLowerCase()===nome.toLowerCase()&&String(c.id)!==String(id));if(dup)return alert("Essa categoria já existe.");const r=id?await supabaseClient.from("categorias").update({nome,descricao,ativo}).eq("id",id):await supabaseClient.from("categorias").insert({nome,descricao,ativo});if(r.error)return alert(r.error.message);$("categoriaEditId").value="";$("nomeCategoria").value="";$("descricaoCategoria").value="";$("categoriaAtiva").checked=true;await carregarTudoCompleto()}
function editarCategoria(id){const c=categorias.find(x=>String(x.id)===String(id));if(!c)return;$("categoriaEditId").value=c.id;$("nomeCategoria").value=c.nome||"";$("descricaoCategoria").value=c.descricao||"";$("categoriaAtiva").checked=c.ativo!==false;abrirTela("categorias")}
async function excluirCategoria(id){const c=categorias.find(x=>String(x.id)===String(id));if(!c)return;if(produtos.some(p=>p.categoria===c.nome))return alert("Não é possível excluir uma categoria que possui produtos.");if(!confirm("Excluir esta categoria?"))return;const r=await supabaseClient.from("categorias").delete().eq("id",id);if(r.error)return alert(r.error.message);await carregarTudoCompleto()}
function renderCategorias(){$("listaCategorias").innerHTML=categorias.length?categorias.map(c=>`<article class="product"><div></div><div><h3>${esc(c.nome)} <span class="badge ${c.ativo!==false?"on":"off"}">${c.ativo!==false?"Ativa":"Inativa"}</span></h3><p>${esc(c.descricao||"Sem descrição")}</p><p>${produtos.filter(p=>p.categoria===c.nome).length} produto(s)</p></div><div class="actions"><button class="btn light" onclick="editarCategoria('${c.id}')">Editar</button><button class="btn danger" onclick="excluirCategoria('${c.id}')">Excluir</button></div></article>`).join(""):"<div class='empty'>Nenhuma categoria cadastrada.</div>"}

function atualizarStatusLoja(){const aberta=configLoja?.loja_aberta!==false;const top=$("topLojaStatus"),inicio=$("inicioLojaStatus"),btn=$("btnToggleLoja");[top,inicio].forEach(el=>{if(!el)return;el.textContent=aberta?"Loja aberta":"Loja fechada";el.classList.toggle("open",aberta);el.classList.toggle("closed",!aberta)});if(btn){btn.textContent=aberta?"Fechar loja":"Abrir loja";btn.classList.toggle("store-open",aberta);btn.classList.toggle("store-close",!aberta)}}
function aplicarConfigNosCampos(){
  const c=configLoja;if(!c)return;const extra=obterConfigExtra(c);
  $("configNomeLoja").value=c.nome_loja||"Pastelaria El Shaddai";$("configSlogan").value=c.slogan||"Feito a dois, no ponto pra você!";
  $("configWhatsapp").value=c.whatsapp||"";$("configPix").value=c.pix||"";$("configInformacoes").value=extra.informacoes||"";
  $("configLojaAberta").checked=c.loja_aberta!==false;$("configEntrega").checked=c.entrega_ativa!==false;$("configRetirada").checked=c.retirada_ativa!==false;
  $("configPagamentoPix").checked=c.pagamento_pix!==false;$("configPagamentoCartao").checked=c.pagamento_cartao!==false;$("configPagamentoDinheiro").checked=c.pagamento_dinheiro!==false;
  $("configLogoUrl").value=c.logo&&/^https?:\/\//.test(c.logo)?c.logo:"";$("configBannerUrl").value=c.banner&&/^https?:\/\//.test(c.banner)?c.banner:"";
  logoData=c.logo||null;bannerData=c.banner||null;mostrarImagem("configLogoPreview",logoData);mostrarImagem("configBannerPreview",bannerData);
  aplicarDeliveryNoFormulario(extra.delivery||{});atualizarStatusLoja();
}
async function carregarConfiguracaoLoja(silencioso=false){try{const r=await supabaseClient.from("configuracoes_loja").select("*").order("id",{ascending:true}).limit(1);if(r.error)throw r.error;configLoja=(r.data||[])[0]||null;aplicarConfigNosCampos()}catch(e){if(!silencioso)alert(e.message||e)}}
async function salvarConfiguracaoLoja(){
  const extra=lerConfigExtraDoFormulario();
  const payload={nome_loja:$("configNomeLoja").value.trim()||"Pastelaria El Shaddai",slogan:$("configSlogan").value.trim()||"Feito a dois, no ponto pra você!",whatsapp:$("configWhatsapp").value.replace(/\D/g,""),pix:$("configPix").value.trim(),informacoes:montarInformacoesComExtra($("configInformacoes").value.trim(),extra),loja_aberta:$("configLojaAberta").checked,entrega_ativa:$("configEntrega").checked,retirada_ativa:$("configRetirada").checked,pagamento_pix:$("configPagamentoPix").checked,pagamento_cartao:$("configPagamentoCartao").checked,pagamento_dinheiro:$("configPagamentoDinheiro").checked,logo:logoData||$("configLogoUrl").value.trim()||null,banner:bannerData||$("configBannerUrl").value.trim()||null};
  const r=configLoja?.id?await supabaseClient.from("configuracoes_loja").update(payload).eq("id",configLoja.id):await supabaseClient.from("configuracoes_loja").insert(payload);
  if(r.error)return alert("Não foi possível salvar a configuração.\n\n"+r.error.message);
  $("configAjuda").textContent="Configuração salva no Supabase existente.";await carregarConfiguracaoLoja(true);
}
async function alternarLoja(){
  if(!configLoja)await carregarConfiguracaoLoja(true);
  if(!configLoja?.id)return alert("A configuração da loja ainda não está disponível.");
  const novoStatus=configLoja.loja_aberta===false;
  const r=await supabaseClient.from("configuracoes_loja").update({loja_aberta:novoStatus}).eq("id",configLoja.id);
  if(r.error)return alert("Não foi possível alterar o status da loja.\n\n"+r.error.message);
  configLoja.loja_aberta=novoStatus;aplicarConfigNosCampos();definirStatus("Conectado");
}
function abrirComoCliente(){window.open("index.html","_blank","noopener")}

async function carregarPedidos(silencioso=false){try{const r=await supabaseClient.from("pedidos").select("*").order("id",{ascending:false});if(r.error)throw r.error;pedidos=r.data||[];renderPedidos();renderInicioPedidos()}catch(e){if(!silencioso)alert(e.message||e)}}
function filtrarPedidos(s){statusPedidoFiltro=s;renderPedidos()}
function itensPedido(p){return arr(p.itens)}
function renderPedidos(){const box=$("listaPedidos");const f=statusPedidoFiltro==="todos"?pedidos:pedidos.filter(p=>(p.status||"novo")===statusPedidoFiltro);if(!f.length){box.innerHTML="<div class='empty'>Nenhum pedido encontrado.</div>";return}box.innerHTML=f.map(p=>{const itens=itensPedido(p);return `<article class="order-card"><div class="order-head"><div><div class="order-number">Pedido #${esc(p.id)}</div><div class="order-date">${dataBR(p.criado_em)}</div></div><span class="status-badge status-${esc(p.status||"novo")}">${esc(statusTexto(p.status))}</span></div><div class="order-body"><div class="order-grid"><div class="order-box"><strong>Cliente</strong>${esc(p.cliente_nome||"Não informado")}<br>${esc(p.cliente_telefone||"")}</div><div class="order-box"><strong>Atendimento</strong>${esc(p.tipo||"")}<br>${esc(p.endereco||"")}</div><div class="order-box"><strong>Pagamento</strong>${esc(p.pagamento||"Não informado")}</div><div class="order-box"><strong>Observações</strong>${esc(p.observacao||"Sem observações")}</div></div><div class="order-box" style="margin-top:12px"><strong>Itens</strong><ul class="order-items">${itens.map(i=>`<li>${esc(i.quantidade||1)}x ${esc(i.nome||i.produto||"")} — ${moeda(i.preco||0)}</li>`).join("")||"<li>Itens não detalhados</li>"}</ul></div><div style="margin-top:12px" class="order-total">Total: ${moeda(p.total)}</div><div class="order-actions"><select onchange="atualizarStatusPedido('${p.id}',this.value)"><option value="novo" ${p.status==="novo"?"selected":""}>Novo</option><option value="em_preparo" ${p.status==="em_preparo"?"selected":""}>Em preparo</option><option value="pronto" ${p.status==="pronto"?"selected":""}>Pronto</option><option value="saiu_entrega" ${p.status==="saiu_entrega"?"selected":""}>Saiu para entrega</option><option value="concluido" ${p.status==="concluido"?"selected":""}>Concluído</option><option value="cancelado" ${p.status==="cancelado"?"selected":""}>Cancelado</option></select></div></div></article>`}).join("")}
async function atualizarStatusPedido(id,status){const r=await supabaseClient.from("pedidos").update({status}).eq("id",id);if(r.error)return alert(r.error.message);await carregarPedidos(true)}
function renderInicioPedidos(){const b=$("inicioPedidosLista");const f=pedidos.slice(0,5);b.innerHTML=f.length?f.map(p=>`<div class="coupon"><span><strong>Pedido #${esc(p.id)}</strong><br>${esc(p.cliente_nome||"")} — ${esc(statusTexto(p.status))}</span><strong>${moeda(p.total)}</strong></div>`).join(""):"<div class='empty'>Nenhum pedido registrado.</div>"}

async function carregarClientes(silencioso=false){try{const r=await supabaseClient.from("clientes").select("*").order("total_gasto",{ascending:false});if(r.error)throw r.error;clientes=r.data||[];renderClientes()}catch(e){if(!silencioso)alert(e.message||e)}}
function renderClientes(){
  const q=($("pesquisaClientes").value||"").toLowerCase();const f=clientes.filter(c=>[c.nome,c.telefone,c.endereco].join(" ").toLowerCase().includes(q));
  $("clientesQtd").textContent=clientes.length;$("clientesPedidos").textContent=clientes.reduce((s,c)=>s+Number(c.quantidade_pedidos||0),0);$("clientesGasto").textContent=moeda(clientes.reduce((s,c)=>s+Number(c.total_gasto||0),0));atualizarVisitasNoAdm();
  $("listaClientes").innerHTML=f.length?f.map(c=>`<article class="product customer-card" onclick="verCliente('${String(c.id)}')"><div></div><div><h3>${esc(c.nome||"Cliente")}</h3><p>${esc(c.telefone||"")}</p><p>${Number(c.quantidade_pedidos||0)} pedido(s) · ${moeda(c.total_gasto)}</p><p>${esc(c.endereco||"Endereço não informado")}</p></div><div class="actions">${c.telefone?`<a class="btn light" href="https://wa.me/${String(c.telefone).replace(/\D/g,"")}" target="_blank" rel="noopener" onclick="event.stopPropagation()">WhatsApp</a>`:""}</div></article>`).join(""):"<div class='empty'>Nenhum cliente encontrado.</div>";
}
async function verCliente(id){
  const c=clientes.find(x=>String(x.id)===String(id));if(!c)return;const modal=$("clienteModal");if(!modal)return;
  $("clienteModalNome").textContent=c.nome||"Cliente";$("clienteModalDados").innerHTML=`<div class="detail-box"><strong>Telefone</strong><br>${esc(c.telefone||"Não informado")}</div><div class="detail-box"><strong>Endereço</strong><br>${esc(c.endereco||"Não informado")}</div><div class="detail-box"><strong>Pedidos</strong><br>${Number(c.quantidade_pedidos||0)}</div><div class="detail-box"><strong>Total gasto</strong><br>${moeda(c.total_gasto)}</div>`;
  const r=await supabaseClient.from("pedidos").select("*").eq("cliente_telefone",c.telefone||"").order("id",{ascending:false});
  $("clienteModalHistorico").innerHTML=r.error?`<div class="error">${esc(r.error.message)}</div>`:((r.data||[]).length?(r.data||[]).map(p=>`<div><strong>Pedido #${esc(p.id)}</strong> · ${esc(statusTexto(p.status))} · ${moeda(p.total)}<br><small>${esc(dataBR(p.criado_em))}</small></div>`).join(""):"<div>Nenhum pedido encontrado.</div>");modal.style.display="flex";
}
function fecharClienteModal(){const m=$("clienteModal");if(m)m.style.display="none"}

async function carregarDashboard(silencioso=false){
  try{const [pr,cl]=await Promise.all([supabaseClient.from("pedidos").select("*").order("id",{ascending:false}),supabaseClient.from("clientes").select("*")]);if(pr.error)throw pr.error;if(cl.error)throw cl.error;
    const all=pr.data||[],now=new Date(),ini=new Date(now.getFullYear(),now.getMonth(),now.getDate()),mesIni=new Date(now.getFullYear(),now.getMonth(),1),semIni=new Date(now.getTime()-6*86400000);const hoje=all.filter(p=>new Date(p.criado_em)>=ini),mes=all.filter(p=>new Date(p.criado_em)>=mesIni);const fat=hoje.reduce((s,p)=>s+Number(p.total||0),0),fatMes=mes.reduce((s,p)=>s+Number(p.total||0),0),vend=hoje.reduce((s,p)=>s+itensPedido(p).reduce((x,i)=>x+Number(i.quantidade||1),0),0);
    $("dashPedidosHoje").textContent=hoje.length;$("dashFaturamentoHoje").textContent=moeda(fat);$("dashFaturamentoMes").textContent=moeda(fatMes);$("dashClientes").textContent=(cl.data||[]).length;$("dashProdutosVendidos").textContent=vend;const counts={novo:0,em_preparo:0,pronto:0,saiu_entrega:0,concluido:0,cancelado:0};hoje.forEach(p=>counts[p.status||"novo"]=(counts[p.status||"novo"]||0)+1);$("dashStatus").innerHTML=Object.entries(counts).map(([k,v])=>`<p><strong>${esc(statusTexto(k))}:</strong> ${v}</p>`).join("");$("dashResumoVendas").innerHTML=`<p>Pedidos hoje: <strong>${hoje.length}</strong></p><p>Faturamento: <strong>${moeda(fat)}</strong></p><p>Faturamento no mês: <strong>${moeda(fatMes)}</strong></p><p>Produtos vendidos hoje: <strong>${vend}</strong></p>`;$("inicioPedidos").textContent=hoje.length;$("inicioFaturamento").textContent=moeda(fat);$("inicioFaturamentoMes").textContent=moeda(fatMes);$("inicioClientes").textContent=(cl.data||[]).length;$("inicioProdutosVendidos").textContent=vend;renderMaisVendidos(all.filter(p=>new Date(p.criado_em)>=semIni),"dashMaisVendidoSemana");renderMaisVendidos(mes,"dashMaisVendidoMes");
  }catch(e){if(!silencioso)alert(e.message||e)}}
function renderMaisVendidos(lista,id){const mapa={};lista.forEach(p=>itensPedido(p).forEach(i=>{const n=String(i.nome||i.produto||"Produto");mapa[n]=(mapa[n]||0)+Number(i.quantidade||1)}));const top=Object.entries(mapa).sort((a,b)=>b[1]-a[1]).slice(0,5);const el=$(id);if(!el)return;el.innerHTML=top.length?top.map(([n,q],i)=>`<div class="top-product"><span><strong>${i+1}. ${esc(n)}</strong></span><strong>${q} un.</strong></div>`).join(""):"<div class='empty'>Ainda não há vendas no período.</div>"}

async function carregarPromocoes(silencioso=false){try{const r=await supabaseClient.from("promocoes").select("*").order("id",{ascending:false});if(r.error)throw r.error;promocoes=r.data||[];renderPromocoes()}catch(e){$("listaPromocoes").innerHTML=`<div class='notice'>A tabela de promoções não pôde ser consultada. Se ela ainda não existir, execute o SQL do Bloco 8.</div>`;if(!silencioso)console.error(e)}}
async function salvarPromocao(){const codigo=$("promoCodigo").value.trim().toUpperCase(),desconto=Number($("promoDesconto").value),descricao=$("promoDescricao").value.trim(),validade=$("promoValidade").value||null,ativo=$("promoAtivo").checked;if(!codigo||!Number.isFinite(desconto)||desconto<0||desconto>100)return alert("Informe código e desconto entre 0 e 100.");const r=await supabaseClient.from("promocoes").insert({codigo,desconto,descricao,validade,ativo});if(r.error)return alert(r.error.message);$("promoCodigo").value="";$("promoDesconto").value="";$("promoDescricao").value="";$("promoValidade").value="";await carregarPromocoes(true)}
async function excluirPromocao(id){if(!confirm("Excluir esta promoção?"))return;const r=await supabaseClient.from("promocoes").delete().eq("id",id);if(r.error)return alert(r.error.message);await carregarPromocoes(true)}
function renderPromocoes(){$("listaPromocoes").innerHTML=promocoes.length?promocoes.map(p=>`<div class="coupon"><span><strong>${esc(p.codigo)}</strong><br>${Number(p.desconto||0)}% — ${esc(p.descricao||"")}<br><small>Validade: ${esc(p.validade||"Sem data")} · ${p.ativo!==false?"Ativa":"Inativa"}</small></span><button class="btn danger" onclick="excluirPromocao('${p.id}')">Excluir</button></div>`).join(""):"<div class='empty'>Nenhuma promoção cadastrada.</div>"}

function metaFid(){return Math.max(1,Number(localStorage.getItem(fidKeyMeta)||10))}function benFid(){return localStorage.getItem(fidKeyBen)||"1 pastel grátis"}
async function carregarFidelidade(silencioso=false){try{const r=await supabaseClient.from("clientes").select("*").order("quantidade_pedidos",{ascending:false});if(r.error)throw r.error;clientes=r.data||[];$("fidMeta").value=metaFid();$("fidBeneficio").value=benFid();renderFidelidade()}catch(e){if(!silencioso)alert(e.message||e)}}
function salvarFidelidadeConfig(){const m=Math.max(1,Number($("fidMeta").value||10)),b=$("fidBeneficio").value.trim()||"1 pastel grátis";localStorage.setItem(fidKeyMeta,String(m));localStorage.setItem(fidKeyBen,b);renderFidelidade();alert("Regra de fidelidade salva.")}
function renderFidelidade(){const q=($("pesquisaFidelidade").value||"").toLowerCase(),m=metaFid(),f=clientes.filter(c=>[c.nome,c.telefone].join(" ").toLowerCase().includes(q));$("fidClientes").textContent=clientes.length;$("fidLoyais").textContent=clientes.filter(c=>Number(c.quantidade_pedidos||0)>=m).length;$("fidCompras").textContent=clientes.reduce((s,c)=>s+Number(c.quantidade_pedidos||0),0);$("fidBeneficios").textContent=clientes.reduce((s,c)=>s+Math.floor(Number(c.quantidade_pedidos||0)/m),0);$("listaFidelidade").innerHTML=f.length?f.map(c=>{const n=Number(c.quantidade_pedidos||0),rest=Math.max(0,m-(n%m));const b=Math.floor(n/m);return `<div class="rank"><span><strong>${esc(c.nome||"Cliente")}</strong><br>${n} compra(s) · ${moeda(c.total_gasto)}</span><span>${b>0?b+" benefício(s) conquistado(s)":"Faltam "+rest+" compra(s)"}</span></div>`}).join(""):"<div class='empty'>Nenhum cliente encontrado.</div>"}

async function carregarWhatsApp(silencioso=false){if(!configLoja)await carregarConfiguracaoLoja(true);$("whatsappNumero").value=(configLoja?.whatsapp||"").replace(/\D/g,"")||"5585988944421";$("whatsappResumo").checked=true}
async function salvarWhatsApp(){const n=$("whatsappNumero").value.replace(/\D/g,"");if(n.length<12)return alert("Informe um número de WhatsApp válido.");if(!configLoja){await carregarConfiguracaoLoja(true)};const payload={whatsapp:n};const r=configLoja?.id?await supabaseClient.from("configuracoes_loja").update(payload).eq("id",configLoja.id):await supabaseClient.from("configuracoes_loja").insert({nome_loja:"Pastelaria El Shaddai",slogan:"Feito a dois, no ponto pra você!",whatsapp:n,loja_aberta:true,entrega_ativa:true,retirada_ativa:true,pagamento_pix:true,pagamento_cartao:true,pagamento_dinheiro:true});if(r.error)return alert(r.error.message);await carregarConfiguracaoLoja(true);$("whatsappAjuda").textContent="Número salvo na configuração central da loja."}
function testarWhatsApp(){const n=$("whatsappNumero").value.replace(/\D/g,"");if(n.length<12)return alert("Informe um número válido.");const msg="Teste da integração do WhatsApp — Pastelaria El Shaddai.\n\nO número está configurado corretamente.";window.open("https://wa.me/"+n+"?text="+encodeURIComponent(msg),"_blank")}

// ===== ENTREGA: armazenamento no campo informacoes existente =====
const ELSHADDAI_CONFIG_V3="ELSHADDAI_CONFIG_V3";
const BAIRROS_MARACANAU=["Acaracuzinho", "Alto Alegre", "Alto da Mangueira", "Antônio Justa", "Boa Esperança", "Boa Vista", "Cágado", "Coqueiral", "Centro", "Cidade Nova", "Distrito Industrial I", "Furna da Onça", "Horto", "Industrial", "Jaçanaú", "Jardim Bandeirantes", "Jari", "Jenipapeiro", "Jereissati", "Luzardo Viana", "Menino Jesus de Praga", "Mucunã", "Novo Jenipapeiro", "Novo Maracanaú", "Novo Oriente", "Olho D’Água", "Pajuçara", "Pajuçara Park", "Pau-Serrado", "Parque Tijuca", "Parque Tropical", "Parque Santa Maria", "Piratininga", "Santo Antônio", "Santo Sátiro", "Senador José Afonso Sancho", "Siqueira", "Timbó"];
const BAIRROS_FORTALEZA=["Aerolândia", "Aldeota", "Alagadiço Novo", "Alto da Balança", "Álvaro Weyne", "Amadeu Furtado", "Antônio Bezerra", "Autran Nunes", "Barra do Ceará", "Bairro Ellery", "Bairro de Fátima", "Bela Vista", "Benfica", "Boa Vista / Centro", "Bom Futuro", "Bom Jardim", "Cajazeiras", "Cais do Porto", "Canindezinho", "Carlito Pamplona", "Castelão", "Centro", "Cidade 2000", "Cidade dos Funcionários", "Cocó", "Conjunto Ceará I", "Conjunto Ceará II", "Conjunto Esperança", "Conjunto Palmeiras", "Curió", "Damas", "De Lourdes", "Demócrito Rocha", "Dionísio Torres", "Dom Lustosa", "Edson Queiroz", "Farias Brito", "Fátima", "Floresta", "Genibaú", "Gentilândia", "Granja Lisboa", "Granja Portugal", "Guajeru", "Guararapes", "Itaoca", "Itaperi", "Jardim América", "Jardim Cearense", "Jardim das Oliveiras", "Jardim Guanabara", "Jardim Iracema", "Jardim Jatobá", "Jardim União", "José Bonifácio", "José de Alencar", "Jóquei Clube", "Lagoa Redonda", "Lagoa Sapiranga (Coité)", "Manoel Sátiro", "Manuel Dias Branco", "Maraponga", "Meireles", "Messejana", "Mondubim", "Monte Castelo", "Mucuripe", "Mata Galinha", "Novo Mondubim", "Novo Pabussu", "Olavo Oliveira", "Padre Andrade", "Parangaba", "Parque Araxá", "Parque Dois Irmãos", "Parque Iracema", "Parque Manibura", "Parque Presidente Vargas", "Parque Santa Rosa", "Parquelândia", "Passaré", "Paupina", "Pedras", "Pirambu", "Planalto Ayrton Senna", "Praia de Iracema", "Praia do Futuro I", "Praia do Futuro II", "Prefeito José Walter", "Presidente Kennedy", "Quintino Cunha", "Rodolfo Teófilo", "Sabiaguaba", "Salinas", "São Bento", "São Bernardo", "São Gerardo", "São João do Tauape", "Sapiranga / Coité", "Serrinha", "Siqueira", "Varjota", "Vicente Pinzón", "Vila 31 de Março", "Vila Pery", "Vila União", "Vila Velha", "Jangurussu"];
function extrairConfigExtra(c){const raw=String(c?.informacoes||""),linhas=raw.split("\n"),texto=[],marcadores=[];linhas.forEach(l=>{if(l.startsWith(ELSHADDAI_CONFIG_V3+"|"))marcadores.push(l.slice((ELSHADDAI_CONFIG_V3+"|").length));else if(l.trim())texto.push(l)});let delivery={};try{delivery=JSON.parse(marcadores[0]||"{}")}catch{}return {informacoes:texto.join("\n"),delivery};}
function obterConfigExtra(c){return extrairConfigExtra(c)}
function montarInformacoesComExtra(texto,delivery){return String(texto||"").trim()+"\n"+ELSHADDAI_CONFIG_V3+"|"+JSON.stringify(delivery||{})}
function renderBairrosEntrega(delivery={}){const box=$("bairrosEntregaLista");if(!box)return;const atual=delivery.bairros||{};const grupos=[["Maracanaú",BAIRROS_MARACANAU],["Fortaleza",BAIRROS_FORTALEZA]];box.innerHTML=grupos.map(([cidade,lista])=>`<div class="bairro-group"><h4 style="grid-column:1/-1;margin:6px 2px;color:#c62828">${cidade}</h4>${lista.map(nome=>{const chave=cidade+"|"+nome,x=atual[chave]||atual[nome]||{};return `<label class="bairro-row"><input type="checkbox" data-cidade="${esc(cidade)}" data-bairro="${esc(nome)}" ${x.ativo?"checked":""}><span>${esc(nome)}</span><input type="number" min="0" step="0.01" data-bairro-valor="${esc(chave)}" value="${Number(x.valor||0)}" placeholder="R$"></label>`}).join("")}</div>`).join("")}
function aplicarDeliveryNoFormulario(d){const x=d||{},mode=x.modo||"off";document.querySelectorAll('input[name="deliveryMode"]').forEach(r=>r.checked=r.value===mode);$("deliveryKmValor").value=x.km_valor??"";$("deliveryKmMax").value=x.km_max??"";$("deliveryGratisAcima").value=x.gratis_acima??"";$("deliveryTaxaMin").value=x.taxa_min??"";renderBairrosEntrega(x)}
function lerConfigExtraDoFormulario(){const bairros={};document.querySelectorAll("#bairrosEntregaLista [data-bairro]").forEach(ch=>{const nome=ch.dataset.bairro,cidade=ch.dataset.cidade||"",chave=cidade?cidade+"|"+nome:nome,inp=Array.from(document.querySelectorAll("[data-bairro-valor]")).find(x=>x.dataset.bairroValor===chave);bairros[chave]={ativo:ch.checked,valor:Number(inp?.value||0)}});return {modo:document.querySelector('input[name="deliveryMode"]:checked')?.value||"off",km_valor:Number($("deliveryKmValor").value||0),km_max:Number($("deliveryKmMax").value||0),gratis_acima:Number($("deliveryGratisAcima").value||0),taxa_min:Number($("deliveryTaxaMin").value||0),bairros};}

document.addEventListener("DOMContentLoaded",iniciar);
