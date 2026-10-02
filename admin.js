const $=id=>document.getElementById(id);
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
    if(!window.supabaseClient) throw new Error("O Supabase não foi carregado. Verifique supabase.js e a biblioteca do Supabase.");
    const db=window.supabaseClient;
    const r=await Promise.all([
      db.from("categorias").select("*").order("id"),
      db.from("produtos").select("*").order("id",{ascending:false}),
      db.from("configuracoes_loja").select("*").order("id",{ascending:true}).limit(1)
    ]);
    if(r.some(x=>x.error)) throw new Error(r.find(x=>x.error)?.error?.message||"Erro no Supabase");
    categorias=r[0].data||[];produtos=r[1].data||[];configLoja=(r[2].data||[])[0]||null;
    montarAdicionais();popularCategorias();renderProdutos();renderCategorias();aplicarConfigNosCampos();
    await Promise.all([carregarPedidos(true),carregarClientes(true),carregarDashboard(true),carregarPromocoes(true),carregarFidelidade(true),carregarWhatsApp(true)]);
    definirStatus("Conectado");
  }catch(e){
    console.error(e);
    definirStatus("Não conectado","erro");
    const msg=e?.message||String(e);
    console.error("Detalhes da conexão:",msg);
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
function renderCategorias(){$("listaCategorias").innerHTML=categorias.length?categorias.map(c=>{const qtd=produtos.filter(p=>p.categoria===c.nome).length;return `<article class="product"><div></div><div><h3>${esc(c.nome)} <span class="badge ${c.ativo!==false?"on":"off"}">${c.ativo!==false?"Ativa":"Inativa"}</span></h3><p>${esc(c.descricao||"Sem descrição")}</p><p>${qtd} produto(s)</p><div class="category-tools"><button class="btn light" onclick="verProdutosDaCategoria('${esc(c.nome)}')">Ver produtos</button></div></div><div class="actions"><button class="btn light" onclick="editarCategoria('${c.id}')">Editar</button><button class="btn danger" onclick="excluirCategoria('${c.id}')">Excluir</button></div></article>`}).join(""):"<div class='empty'>Nenhuma categoria cadastrada.</div>"}
function verProdutosDaCategoria(nome){categoriaFiltro=nome;pesquisaProdutos='';abrirTela('produtos');const select=$('filtroCategoriaProdutos');if(select)select.value=nome;const busca=$('pesquisaProdutos');if(busca)busca.value='';renderProdutos()}

function atualizarStatusLoja(){const aberta=configLoja?.loja_aberta!==false,top=$("topLojaStatus"),inicio=$("inicioLojaStatus"),btn=$("btnToggleLoja");[top,inicio].forEach(el=>{if(!el)return;el.textContent=aberta?"Loja aberta":"Loja fechada";el.classList.toggle("open",aberta);el.classList.toggle("closed",!aberta)});if(btn){btn.textContent=aberta?"Fechar loja":"Abrir loja";btn.classList.toggle("store-open",!aberta);btn.classList.toggle("store-close",aberta)}}
async function alternarLoja(){if(!configLoja)await carregarConfiguracaoLoja(true);if(!configLoja?.id)return alert("A configuração da loja ainda não está disponível.");const novoStatus=configLoja.loja_aberta===false,r=await supabaseClient.from("configuracoes_loja").update({loja_aberta:novoStatus}).eq("id",configLoja.id);if(r.error)return alert("Não foi possível alterar o status da loja.\n\n"+r.error.message);configLoja.loja_aberta=novoStatus;aplicarConfigNosCampos();definirStatus(novoStatus?"Loja aberta":"Loja fechada")}
function abrirComoCliente(){window.open("index.html","_blank","noopener")}
async function carregarPedidos(silencioso=false){try{const r=await supabaseClient.from("pedidos").select("*").order("id",{ascending:false});if(r.error)throw r.error;pedidos=r.data||[];renderPedidos();renderInicioPedidos()}catch(e){if(!silencioso)alert(e.message||e)}}
function filtrarPedidos(s){statusPedidoFiltro=s;renderPedidos()}
function itensPedido(p){return arr(p.itens)}
function extrasPedido(p){try{const x=JSON.parse(String(p.observacao||""));if(x&&x.__elshaddai_pedido)return x}catch{}return null}
function renderPedidos(){const box=$("listaPedidos"),f=statusPedidoFiltro==="todos"?pedidos:pedidos.filter(p=>(p.status||"novo")===statusPedidoFiltro);if(!f.length){box.innerHTML="<div class='empty'>Nenhum pedido encontrado.</div>";return}box.innerHTML=f.map(p=>{const itens=itensPedido(p),x=extrasPedido(p),troco=x?.troco?`<br><strong>Troco:</strong> ${moeda(x.troco)}`:"",recebido=x?.valorRecebido?`<br><strong>Recebido:</strong> ${moeda(x.valorRecebido)}`:"",reembolso=x?.reembolso?`<div class="notice" style="margin-top:10px"><strong>Devolução de dinheiro:</strong> ${moeda(x.reembolso)}</div>`:"";return `<article class="order-card"><div class="order-head"><div><div class="order-number">Pedido #${esc(p.id)}</div><div class="order-date">${dataBR(p.criado_em)}</div></div><span class="status-badge status-${esc(p.status||"novo")}">${esc(statusTexto(p.status))}</span></div><div class="order-body"><div class="order-grid"><div class="order-box"><strong>Cliente</strong>${esc(p.cliente_nome||"Não informado")}<br>${esc(p.cliente_telefone||"")}</div><div class="order-box"><strong>Atendimento</strong>${esc(p.tipo||"")}<br>${esc(p.endereco||"")}</div><div class="order-box"><strong>Pagamento</strong>${esc(p.pagamento||"Não informado")}${troco}${recebido}</div><div class="order-box"><strong>Observações</strong>${x?.observacaoLivre?esc(x.observacaoLivre):esc(p.observacao||"Sem observações")}</div></div><div class="order-box" style="margin-top:12px"><strong>Itens</strong><ul class="order-items">${itens.map(i=>`<li>${esc(i.quantidade||1)}x ${esc(i.nome||i.produto||"")} — ${moeda(i.preco||0)}${i.detalhes?.length?"<br><small>"+i.detalhes.map(esc).join(" · ")+"</small>":""}</li>`).join("")||"<li>Itens não detalhados</li>"}</ul></div><div style="margin-top:12px" class="order-total">Total: ${moeda(p.total)}</div>${reembolso}<div class="order-actions"><select onchange="atualizarStatusPedido('${p.id}',this.value)"><option value="novo" ${p.status==="novo"?"selected":""}>Novo</option><option value="em_preparo" ${p.status==="em_preparo"?"selected":""}>Em preparo</option><option value="pronto" ${p.status==="pronto"?"selected":""}>Pronto</option><option value="saiu_entrega" ${p.status==="saiu_entrega"?"selected":""}>Saiu para entrega</option><option value="concluido" ${p.status==="concluido"?"selected":""}>Concluído</option><option value="cancelado" ${p.status==="cancelado"?"selected":""}>Cancelado</option></select><button class="btn light" type="button" onclick="imprimirPedido('${p.id}')">Imprimir pedido</button></div></div></article>`}).join("")}

async function atualizarStatusPedido(id,status){const r=await supabaseClient.from("pedidos").update({status}).eq("id",id);if(r.error)return alert(r.error.message);await carregarPedidos(true)}
function renderInicioPedidos(){const b=$("inicioPedidosLista");const f=pedidos.slice(0,5);b.innerHTML=f.length?f.map(p=>`<div class="coupon"><span><strong>Pedido #${esc(p.id)}</strong><br>${esc(p.cliente_nome||"")} — ${esc(statusTexto(p.status))}</span><strong>${moeda(p.total)}</strong></div>`).join(""):"<div class='empty'>Nenhum pedido registrado.</div>"}

async function carregarClientes(silencioso=false){try{const r=await supabaseClient.from("clientes").select("*").order("total_gasto",{ascending:false});if(r.error)throw r.error;clientes=r.data||[];renderClientes()}catch(e){if(!silencioso)alert(e.message||e)}}
function atualizarVisitasNoAdm(){const total=Number(localStorage.getItem('elshaddai_visitas_total')||0);const el=$('clientesVisitas'),nota=$('clientesVisitasNota');if(el)el.textContent=total.toLocaleString('pt-BR');if(nota)nota.textContent=total>0?'Total registrado pelo cardápio neste dispositivo':'Aguardando o contador de visitas do cardápio'}
function renderClientes(){const q=($("pesquisaClientes").value||"").toLowerCase(),f=clientes.filter(c=>[c.nome,c.telefone,c.endereco].join(" ").toLowerCase().includes(q));$("clientesQtd").textContent=clientes.length;$("clientesPedidos").textContent=clientes.reduce((s,c)=>s+Number(c.quantidade_pedidos||0),0);$("clientesGasto").textContent=moeda(clientes.reduce((s,c)=>s+Number(c.total_gasto||0),0));atualizarVisitasNoAdm();$("listaClientes").innerHTML=f.length?f.map(c=>`<article class="product customer-card" onclick="verCliente('${String(c.id).replace(/'/g,"\\'")}')"><div><div style="width:58px;height:58px;border-radius:50%;background:#fff0cf;display:grid;place-items:center;color:#c62828;font-weight:800">${esc((c.nome||"C").trim().charAt(0).toUpperCase())}</div></div><div><h3>${esc(c.nome||"Cliente")}</h3><p>${esc(c.telefone||"")}</p><p>${Number(c.quantidade_pedidos||0)} pedido(s) · ${moeda(c.total_gasto)}</p><p>${esc(c.endereco||"Endereço não informado")}</p><small>Toque para ver todos os dados</small></div><div class="actions">${c.telefone?`<a class="btn light" href="https://wa.me/${String(c.telefone).replace(/\D/g,"")}" target="_blank" rel="noopener" onclick="event.stopPropagation()">WhatsApp</a>`:""}</div></article>`).join(""):"<div class='empty'>Nenhum cliente encontrado.</div>"}
async function verCliente(id){const c=clientes.find(x=>String(x.id)===String(id));if(!c)return;const old=document.getElementById("clienteDetalhesModal");if(old)old.remove();const back=document.createElement("div");back.id="clienteDetalhesModal";back.className="modal-backdrop";back.innerHTML=`<div class="modal-card"><div class="toolbar"><div><h2 style="margin:0;color:#c62828">${esc(c.nome||"Cliente")}</h2><p>Dados cadastrados e histórico de pedidos.</p></div><button class="btn light" onclick="document.getElementById('clienteDetalhesModal').remove()">Fechar</button></div><div class="detail-grid"><div class="detail-box"><strong>Telefone</strong><br>${esc(c.telefone||"Não informado")}</div><div class="detail-box"><strong>Endereço</strong><br>${esc(c.endereco||"Não informado")}</div><div class="detail-box"><strong>Pedidos</strong><br>${Number(c.quantidade_pedidos||0)}</div><div class="detail-box"><strong>Total gasto</strong><br>${moeda(c.total_gasto)}</div><div class="detail-box"><strong>ID</strong><br>${esc(c.id)}</div><div class="detail-box"><strong>Cadastrado em</strong><br>${dataBR(c.criado_em)}</div></div><div class="card" style="margin-top:14px"><h3>Histórico de pedidos</h3><div id="clienteHistorico" class="mini-list">Carregando...</div></div></div>`;document.body.appendChild(back);const r=await supabaseClient.from("pedidos").select("*").eq("cliente_telefone",c.telefone).order("id",{ascending:false});const box=$("clienteHistorico");if(r.error){box.textContent="Não foi possível carregar o histórico.";return}const ps=r.data||[];box.innerHTML=ps.length?ps.map(p=>`<div><strong>Pedido #${esc(p.id)}</strong> · ${esc(statusTexto(p.status))}<br>${dataBR(p.criado_em)} · ${moeda(p.total)}</div>`).join(""):"Nenhum pedido encontrado para este telefone.";back.addEventListener("click",e=>{if(e.target===back)back.remove()})}

function inicioDoDia(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function inicioDoMes(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)}
function getResetKey(tipo){return 'elshaddai_faturamento_reset_'+tipo}
function dataReset(tipo){const v=localStorage.getItem(getResetKey(tipo));return v?new Date(v):null}
function pedidosAposReset(lista,tipo){const r=dataReset(tipo);return r?lista.filter(p=>new Date(p.criado_em)>=r):lista}
function limparFaturamentoVisualizacao(tipo='dia'){
  localStorage.setItem(getResetKey(tipo),new Date().toISOString());
  carregarDashboard(true);
  alert(tipo==='mes'?'Faturamento do mês zerado na visualização deste dispositivo.':'Faturamento de hoje zerado na visualização deste dispositivo.');
}
function limparFaturamentoDia(){limparFaturamentoVisualizacao('dia')}
function limparFaturamentoMes(){limparFaturamentoVisualizacao('mes')}
function produtosMaisVendidos(lista){const mapa={};lista.forEach(p=>itensPedido(p).forEach(i=>{const nome=String(i.nome||i.produto||"").trim();if(nome)mapa[nome]=(mapa[nome]||0)+Number(i.quantidade||1)}));return Object.entries(mapa).sort((a,b)=>b[1]-a[1])}
function renderMaisVendido(id,lista){const box=$(id);if(!box)return;const top=produtosMaisVendidos(lista)[0];box.innerHTML=top?`<div class="top-product"><strong>${esc(top[0])}</strong><span>${top[1]} unidade(s)</span></div>`:"<div class='empty'>Sem vendas no período.</div>"}
async function carregarDashboard(silencioso=false){try{const [pr,cl]=await Promise.all([supabaseClient.from("pedidos").select("*").order("id",{ascending:false}),supabaseClient.from("clientes").select("*")]);if(pr.error)throw pr.error;if(cl.error)throw cl.error;const all=pr.data||[],hojeBase=inicioDoDia(),mesBase=inicioDoMes(),semanaBase=new Date(Date.now()-6*86400000),hoje=all.filter(p=>new Date(p.criado_em)>=hojeBase),mes=all.filter(p=>new Date(p.criado_em)>=mesBase),semana=all.filter(p=>new Date(p.criado_em)>=semanaBase),hojeV=pedidosAposReset(hoje,"dia"),mesV=pedidosAposReset(mes,"mes"),fat=hojeV.reduce((s,p)=>s+Number(p.total||0),0),fatMes=mesV.reduce((s,p)=>s+Number(p.total||0),0),vend=hojeV.reduce((s,p)=>s+itensPedido(p).reduce((x,i)=>x+Number(i.quantidade||1),0),0);$("dashPedidosHoje").textContent=hojeV.length;$("dashFaturamentoHoje").textContent=moeda(fat);$("dashFaturamentoMes").textContent=moeda(fatMes);$("dashClientes").textContent=(cl.data||[]).length;$("dashProdutosVendidos").textContent=vend;const counts={novo:0,em_preparo:0,pronto:0,saiu_entrega:0,concluido:0,cancelado:0};hojeV.forEach(p=>counts[p.status||"novo"]=(counts[p.status||"novo"]||0)+1);$("dashStatus").innerHTML=Object.entries(counts).map(([k,v])=>`<p><strong>${esc(statusTexto(k))}:</strong> ${v}</p>`).join("");$("dashResumoVendas").innerHTML=`<p>Pedidos hoje: <strong>${hojeV.length}</strong></p><p>Faturamento hoje: <strong>${moeda(fat)}</strong></p><p>Faturamento no mês: <strong>${moeda(fatMes)}</strong></p><p>Produtos vendidos hoje: <strong>${vend}</strong></p>`;renderMaisVendido("dashMaisVendidoSemana",semana);renderMaisVendido("dashMaisVendidoMes",mes);$("inicioPedidos").textContent=hojeV.length;$("inicioFaturamento").textContent=moeda(fat);$("inicioFaturamentoMes").textContent=moeda(fatMes);$("inicioClientes").textContent=(cl.data||[]).length;$("inicioProdutosVendidos").textContent=vend}catch(e){if(!silencioso)alert(e.message||e)}}

function atualizarCamposPromocao(){const tipo=$('promoTipo')?.value||'percentual',titulo=$('promoValorTitulo'),valor=$('promoValor'),campo=$('promoProdutoField');if(titulo)titulo.textContent=tipo==='percentual'?'Desconto (%)':tipo==='valor'?'Desconto em valor':'Valor opcional';if(valor){valor.max=tipo==='percentual'?'100':'';valor.placeholder=tipo==='percentual'?'Ex.: 10':'Ex.: 5,00'}if(campo)campo.style.display=tipo==='produto'?'block':'none'}
function montarProdutosPromocao(){const s=$('promoProduto');if(!s)return;s.innerHTML='<option value="">Selecione um produto</option>'+produtos.filter(p=>p.ativo!==false).map(p=>`<option value="${esc(p.id)}">${esc(p.nome)} — ${moeda(p.preco)}</option>`).join('')}
function promoMeta(p){try{const m=JSON.parse(p.descricao||'');if(m&&m.__elshaddai_promo)return m}catch{}return null}
async function carregarPromocoes(silencioso=false){try{const r=await supabaseClient.from('promocoes').select('*').order('id',{ascending:false});if(r.error)throw r.error;promocoes=r.data||[];montarProdutosPromocao();atualizarCamposPromocao();renderPromocoes()}catch(e){$('listaPromocoes').innerHTML=`<div class='notice'>A tabela de promoções não pôde ser consultada. Se ela ainda não existir, execute o SQL do Bloco 8.</div>`;if(!silencioso)console.error(e)}}
async function salvarPromocao(){const codigo=$("promoCodigo").value.trim().toUpperCase(),tipo=$("promoTipo").value,valor=Number($("promoValor").value||0),descricaoLivre=$("promoDescricao").value.trim(),validade=$("promoValidade").value||null,ativo=$("promoAtivo").checked,produtoId=$("promoProduto").value||null,regra=$("promoRegraUso")?.value||"livre",comprasNecessarias=Math.max(1,Number($("promoComprasNecessarias")?.value||1));if(!codigo)return alert("Informe o código da promoção.");if(tipo==="percentual"&&(!Number.isFinite(valor)||valor<0||valor>100))return alert("Informe uma porcentagem entre 0 e 100.");if(tipo==="valor"&&(!Number.isFinite(valor)||valor<=0))return alert("Informe um valor de desconto maior que zero.");if(tipo==="produto"&&!produtoId)return alert("Selecione um produto salvo.");const meta={__elshaddai_promo:1,tipo,valor:tipo==="produto"?0:valor,produto_id:produtoId,descricao:descricaoLivre,regra,compras_necessarias:comprasNecessarias},payload={codigo,desconto:tipo==="percentual"?valor:0,descricao:JSON.stringify(meta),validade,ativo};const r=await supabaseClient.from("promocoes").insert(payload);if(r.error)return alert("Não foi possível salvar a promoção.\n\n"+r.error.message);["promoCodigo","promoValor","promoDescricao","promoValidade"].forEach(id=>{if($(id))$(id).value=""});$("promoAtivo").checked=true;$("promoTipo").value="percentual";$("promoProduto").value="";if($("promoRegraUso"))$("promoRegraUso").value="livre";if($("promoComprasNecessarias"))$("promoComprasNecessarias").value=1;atualizarCamposPromocao();await carregarPromocoes(true)}

async function excluirPromocao(id){if(!confirm('Excluir esta promoção?'))return;const r=await supabaseClient.from('promocoes').delete().eq('id',id);if(r.error)return alert(r.error.message);await carregarPromocoes(true)}
function textoRegraPromocao(m){const r=m?.regra||"livre";if(r==="primeira_compra")return"Uso: somente na primeira compra do cliente";if(r==="uma_vez_por_cliente")return"Uso: uma vez por cliente";if(r==="a_cada_n")return`Uso: a cada ${Math.max(1,Number(m.compras_necessarias||1))} compra(s)`;return"Uso: sem limite por cliente"}
function textoPromocao(p){const m=promoMeta(p);if(!m)return`${Number(p.desconto||0)}% — ${esc(p.descricao||"")}`;let texto=m.tipo==="percentual"?`${Number(m.valor||0)}% de desconto`:m.tipo==="valor"?`${moeda(m.valor)} de desconto`:`Produto: ${esc(produtos.find(x=>String(x.id)===String(m.produto_id))?.nome||"Produto selecionado")}`;return`${texto}${m.descricao?` — ${esc(m.descricao)}`:""}<br><small>${textoRegraPromocao(m)}</small>`}

function renderPromocoes(){$('listaPromocoes').innerHTML=promocoes.length?promocoes.map(p=>`<div class="coupon"><span><strong>${esc(p.codigo)}</strong><br>${textoPromocao(p)}<br><small>Validade: ${esc(p.validade||'Sem data')} · ${p.ativo!==false?'Ativa':'Inativa'}</small></span><button class="btn danger" onclick="excluirPromocao('${p.id}')">Excluir</button></div>`).join(''):`<div class='empty'>Nenhuma promoção cadastrada.</div>`}

function metaFid(){return Math.max(1,Number(localStorage.getItem(fidKeyMeta)||10))}function benFid(){return localStorage.getItem(fidKeyBen)||"1 pastel grátis"}
async function carregarFidelidade(silencioso=false){try{const r=await supabaseClient.from("clientes").select("*").order("quantidade_pedidos",{ascending:false});if(r.error)throw r.error;clientes=r.data||[];$("fidMeta").value=metaFid();$("fidBeneficio").value=benFid();renderFidelidade()}catch(e){if(!silencioso)alert(e.message||e)}}
function salvarFidelidadeConfig(){const m=Math.max(1,Number($("fidMeta").value||10)),b=$("fidBeneficio").value.trim()||"1 pastel grátis";localStorage.setItem(fidKeyMeta,String(m));localStorage.setItem(fidKeyBen,b);renderFidelidade();alert("Regra de fidelidade salva.")}
function renderFidelidade(){const q=($("pesquisaFidelidade").value||"").toLowerCase(),m=metaFid(),f=clientes.filter(c=>[c.nome,c.telefone].join(" ").toLowerCase().includes(q));$("fidClientes").textContent=clientes.length;$("fidLoyais").textContent=clientes.filter(c=>Number(c.quantidade_pedidos||0)>=m).length;$("fidCompras").textContent=clientes.reduce((s,c)=>s+Number(c.quantidade_pedidos||0),0);$("fidBeneficios").textContent=clientes.reduce((s,c)=>s+Math.floor(Number(c.quantidade_pedidos||0)/m),0);$("listaFidelidade").innerHTML=f.length?f.map(c=>{const n=Number(c.quantidade_pedidos||0),rest=Math.max(0,m-(n%m));const b=Math.floor(n/m);return `<div class="rank"><span><strong>${esc(c.nome||"Cliente")}</strong><br>${n} compra(s) · ${moeda(c.total_gasto)}</span><span>${b>0?b+" benefício(s) conquistado(s)":"Faltam "+rest+" compra(s)"}</span></div>`}).join(""):"<div class='empty'>Nenhum cliente encontrado.</div>"}

async function carregarWhatsApp(silencioso=false){if(!configLoja)await carregarConfiguracaoLoja(true);$("whatsappNumero").value=(configLoja?.whatsapp||"").replace(/\D/g,"")||"5585988944421";$("instagramUrl").value=configLoja?.instagram||"";$("instagramAtivo").checked=configLoja?.instagram_ativo!==false;$("whatsappResumo").checked=true}
async function salvarWhatsApp(){const n=$("whatsappNumero").value.replace(/\D/g,"");if(n.length<12)return alert("Informe um número de WhatsApp válido.");if(!configLoja)await carregarConfiguracaoLoja(true);const payload={whatsapp:n,instagram:$("instagramUrl").value.trim(),instagram_ativo:$("instagramAtivo").checked};const r=configLoja?.id?await supabaseClient.from("configuracoes_loja").update(payload).eq("id",configLoja.id):await supabaseClient.from("configuracoes_loja").insert({nome_loja:"Pastelaria El Shaddai",slogan:"Feito a dois, no ponto pra você!",whatsapp:n,instagram:payload.instagram,instagram_ativo:payload.instagram_ativo,loja_aberta:true,entrega_ativa:true,retirada_ativa:true,pagamento_pix:true,pagamento_cartao:true,pagamento_dinheiro:true});if(r.error)return alert(r.error.message);await carregarConfiguracaoLoja(true);$("whatsappAjuda").textContent="WhatsApp e Instagram salvos na configuração central da loja."}
function testarWhatsApp(){const n=$("whatsappNumero").value.replace(/\D/g,"");if(n.length<12)return alert("Informe um número válido.");const msg="Teste da integração do WhatsApp — Pastelaria El Shaddai.\n\nO número está configurado corretamente.";window.open("https://wa.me/"+n+"?text="+encodeURIComponent(msg),"_blank")}

document.addEventListener("DOMContentLoaded",iniciar);
