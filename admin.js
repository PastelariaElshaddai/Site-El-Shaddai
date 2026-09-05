const $=id=>document.getElementById(id);
let produtos=[], categorias=[], adicionaisCatalogo=[], ingredientesAtual=[], adicionalAtual=[], fotoAtual=null;

document.addEventListener("DOMContentLoaded", async ()=>{
  document.querySelectorAll(".nav button").forEach(btn=>btn.addEventListener("click",()=>abrirTela(btn.dataset.screen)));
  prepararCategorias();
  await carregarTudo();
});

function abrirTela(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.screen===id));
  document.getElementById("tituloTela").textContent=id==="produtos"?"Produtos":id==="categorias"?"Categorias":"Início";
  if(id==="produtos") renderProdutos();
  if(id==="categorias") renderCategorias();
}

async function carregarTudo(){
  $("status").textContent="● Carregando...";
  const [c,p]=await Promise.all([
    supabaseClient.from("categorias").select("*").order("nome"),
    supabaseClient.from("produtos").select("*").order("id",{ascending:false})
  ]);
  if(c.error){console.error(c.error);$("status").textContent="● Erro";alert("Não consegui carregar categorias: "+c.error.message);return}
  if(p.error){console.error(p.error);$("status").textContent="● Erro";alert("Não consegui carregar produtos: "+p.error.message);return}
  categorias=c.data||[];
  produtos=p.data||[];
  montarCatalogoAdicionais();
  $("status").textContent="● Conectado";
  popularCategorias();
  renderProdutos();
  renderCategorias();
}

function popularCategorias(){
  $("categoriaProduto").innerHTML=(categorias.filter(c=>c.ativo!==false).map(c=>`<option value="${esc(c.nome)}">${esc(c.nome)}</option>`).join(""))||"<option value=''>Nenhuma categoria</option>";
}

/* =========================
   BLOCO 2 — CATEGORIAS
   ========================= */

function prepararCategorias(){
  const box=$("listaCategorias");
  if(!box) return;

  const tela=box.closest(".screen");
  if(!tela || document.getElementById("painelNovaCategoria")) return;

  const painel=document.createElement("div");
  painel.id="painelNovaCategoria";
  painel.className="card";
  painel.style.marginBottom="12px";
  painel.innerHTML=`
    <h3 style="margin-top:0">Gerenciar categorias</h3>
    <div class="field">
      <label for="nomeNovaCategoria">Nome da categoria</label>
      <input id="nomeNovaCategoria" type="text" placeholder="Ex.: Pastéis">
    </div>
    <div class="field">
      <label for="descricaoNovaCategoria">Descrição (opcional)</label>
      <textarea id="descricaoNovaCategoria" placeholder="Ex.: Pastéis salgados e especiais."></textarea>
    </div>
    <label class="toggle" style="display:block;margin:8px 0">
      <input id="categoriaNovaAtiva" type="checkbox" checked>
      Categoria ativa
    </label>
    <div class="actions">
      <button class="btn primary" id="salvarNovaCategoria" type="button">Adicionar categoria</button>
      <button class="btn light" id="cancelarEdicaoCategoria" type="button" style="display:none">Cancelar edição</button>
    </div>
    <p id="ajudaCategoria" class="help">As categorias ficam salvas no Supabase.</p>
  `;
  tela.insertBefore(painel, box);

  $("salvarNovaCategoria").onclick=salvarCategoria;
  $("cancelarEdicaoCategoria").onclick=cancelarEdicaoCategoria;
}

function prepararFormularioCategoriaEdicao(c){
  prepararCategorias();
  $("nomeNovaCategoria").value=c.nome||"";
  $("descricaoNovaCategoria").value=c.descricao||"";
  $("categoriaNovaAtiva").checked=c.ativo!==false;
  $("salvarNovaCategoria").textContent="Salvar alterações";
  $("cancelarEdicaoCategoria").style.display="inline-flex";
  $("ajudaCategoria").textContent="Editando: "+c.nome;
  $("painelNovaCategoria").scrollIntoView({behavior:"smooth",block:"start"});
  $("nomeNovaCategoria").focus();
}

function cancelarEdicaoCategoria(){
  prepararCategorias();
  $("painelNovaCategoria").dataset.editandoId="";
  $("nomeNovaCategoria").value="";
  $("descricaoNovaCategoria").value="";
  $("categoriaNovaAtiva").checked=true;
  $("salvarNovaCategoria").textContent="Adicionar categoria";
  $("cancelarEdicaoCategoria").style.display="none";
  $("ajudaCategoria").textContent="As categorias ficam salvas no Supabase.";
}

async function salvarCategoria(){
  prepararCategorias();

  const nome=$("nomeNovaCategoria").value.trim();
  const descricao=$("descricaoNovaCategoria").value.trim();
  const ativo=$("categoriaNovaAtiva").checked;
  const painel=$("painelNovaCategoria");
  const editandoId=painel.dataset.editandoId||"";

  if(!nome){
    alert("Digite o nome da categoria.");
    return;
  }

  const repetida=categorias.some(c=>
    c.nome.trim().toLowerCase()===nome.toLowerCase() &&
    String(c.id)!==String(editandoId)
  );
  if(repetida){
    alert("Essa categoria já existe.");
    return;
  }

  $("status").textContent="● Salvando categoria...";

  if(editandoId){
    const antiga=categorias.find(c=>String(c.id)===String(editandoId));
    const r=await supabaseClient.from("categorias")
      .update({nome,descricao,ativo})
      .eq("id",editandoId);

    if(r.error){
      $("status").textContent="● Erro";
      alert("Não foi possível editar a categoria.\n\n"+r.error.message);
      return;
    }

    if(antiga && antiga.nome!==nome){
      const rp=await supabaseClient.from("produtos")
        .update({categoria:nome})
        .eq("categoria",antiga.nome);

      if(rp.error){
        console.error(rp.error);
        alert("A categoria foi renomeada, mas não consegui atualizar os produtos ligados a ela.\n\n"+rp.error.message);
      }
    }

    alert("Categoria atualizada!");
  }else{
    const r=await supabaseClient.from("categorias")
      .insert([{nome,descricao,ativo}]);

    if(r.error){
      $("status").textContent="● Erro";
      alert("Não foi possível adicionar a categoria.\n\n"+r.error.message);
      return;
    }

    alert("Categoria adicionada!");
  }

  $("status").textContent="● Conectado";
  cancelarEdicaoCategoria();
  await carregarTudo();
}

function editarCategoria(id){
  const c=categorias.find(x=>String(x.id)===String(id));
  if(!c) return;
  prepararCategorias();
  $("painelNovaCategoria").dataset.editandoId=c.id;
  prepararFormularioCategoriaEdicao(c);
}

async function excluirCategoria(id){
  const c=categorias.find(x=>String(x.id)===String(id));
  if(!c) return;

  const qtd=produtos.filter(p=>p.categoria===c.nome).length;
  if(qtd>0){
    alert(`Não é possível excluir "${c.nome}" porque ela possui ${qtd} produto(s).\n\nEdite os produtos para outra categoria primeiro.`);
    return;
  }

  if(categorias.length<=1){
    alert("O sistema precisa ter pelo menos uma categoria.");
    return;
  }

  if(!confirm(`Excluir a categoria "${c.nome}"?`)) return;

  $("status").textContent="● Excluindo categoria...";
  const r=await supabaseClient.from("categorias").delete().eq("id",id);

  if(r.error){
    $("status").textContent="● Erro";
    alert("Não foi possível excluir a categoria.\n\n"+r.error.message);
    return;
  }

  $("status").textContent="● Conectado";
  alert("Categoria excluída!");
  cancelarEdicaoCategoria();
  await carregarTudo();
}

function montarCatalogoAdicionais(){
  const mapa=new Map();
  produtos.forEach(p=>(Array.isArray(p.adicionais)?p.adicionais:[]).forEach(a=>{if(a?.nome) mapa.set(a.nome,{nome:a.nome,preco:Number(a.preco||0)})}));
  if(!mapa.size){
    mapa.set("Queijo",{nome:"Queijo",preco:2});
    mapa.set("Catupiry",{nome:"Catupiry",preco:2});
    mapa.set("Bacon",{nome:"Bacon",preco:3});
  }
  adicionaisCatalogo=[...mapa.values()];
}

function novoProduto(){
  limparFormulario();
  $("formTitulo").textContent="Novo produto";
  $("formProduto").classList.add("open");
  popularCategorias();
  $("formProduto").scrollIntoView({behavior:"smooth",block:"start"});
}

function editarProduto(id){
  const p=produtos.find(x=>String(x.id)===String(id));
  if(!p)return;
  limparFormulario();
  $("formTitulo").textContent="Editar produto";
  $("produtoId").value=p.id;
  $("nomeProduto").value=p.nome||"";
  $("precoProduto").value=p.preco??"";
  $("categoriaProduto").value=p.categoria||"";
  $("descricaoProduto").value=p.descricao||"";
  $("produtoAtivo").checked=p.ativo!==false;
  $("produtoDisponivel").checked=p.disponivel!==false;
  fotoAtual=p.foto||null;
  if(fotoAtual){$("previewFoto").src=fotoAtual;$("previewFoto").style.display="block"}
  ingredientesAtual=Array.isArray(p.ingredientes)?p.ingredientes.map(x=>typeof x==="string"?{nome:x,podeRetirar:true}:{nome:x.nome||"",podeRetirar:x.podeRetirar!==false}):[];
  adicionalAtual=Array.isArray(p.adicionais)?p.adicionais:[];
  renderIngredientes();renderAdicionais();
  $("formProduto").classList.add("open");
  $("formProduto").scrollIntoView({behavior:"smooth",block:"start"});
}

function limparFormulario(){
  $("produtoId").value="";$("nomeProduto").value="";$("precoProduto").value="";
  $("descricaoProduto").value="";$("fotoProduto").value="";
  $("produtoAtivo").checked=true;$("produtoDisponivel").checked=true;
  fotoAtual=null;ingredientesAtual=[];adicionalAtual=[];
  $("previewFoto").style.display="none";$("previewFoto").removeAttribute("src");
  renderIngredientes();renderAdicionais();
}

function cancelarProduto(){$("formProduto").classList.remove("open")}

function adicionarIngrediente(){
  const nome=$("novoIngrediente").value.trim();
  if(!nome)return;
  if(ingredientesAtual.some(x=>x.nome.toLowerCase()===nome.toLowerCase())){alert("Esse ingrediente já foi adicionado.");return}
  ingredientesAtual.push({nome,podeRetirar:true});
  $("novoIngrediente").value="";
  renderIngredientes();
}

function renderIngredientes(){
  $("ingredientesLista").innerHTML=ingredientesAtual.length?ingredientesAtual.map((x,i)=>`
    <div class="ingredient-row">
      <label class="check"><input type="checkbox" ${x.podeRetirar!==false?"checked":""} onchange="ingredientesAtual[${i}].podeRetirar=this.checked"> ${esc(x.nome)}</label>
      <button class="btn danger" type="button" onclick="removerIngrediente(${i})">Remover</button>
    </div>`).join(""):"<div class='help' style='margin-bottom:8px'>Nenhum ingrediente cadastrado neste produto.</div>";
}
function removerIngrediente(i){ingredientesAtual.splice(i,1);renderIngredientes()}

function criarAdicional(){
  const nome=$("novoAdicionalNome").value.trim();
  const preco=Number($("novoAdicionalPreco").value);
  if(!nome||!Number.isFinite(preco)||preco<0){alert("Informe o nome e o preço do adicional.");return}
  const existente=adicionaisCatalogo.find(a=>a.nome.toLowerCase()===nome.toLowerCase());
  if(existente){existente.preco=preco}else adicionaisCatalogo.push({nome,preco});
  $("novoAdicionalNome").value="";$("novoAdicionalPreco").value="";
  adicionalAtual.push({nome,preco});renderAdicionais();
}

function renderAdicionais(){
  $("adicionaisLista").innerHTML=adicionaisCatalogo.map((a,i)=>{
    const marcado=adicionalAtual.some(x=>x.nome===a.nome);
    return `<label class="check"><input type="checkbox" ${marcado?"checked":""} onchange="alternarAdicional(${i},this.checked)"> ${esc(a.nome)} — ${moeda(a.preco)}</label>`;
  }).join("")||"<span class='help'>Nenhum adicional criado ainda.</span>";
}

function alternarAdicional(i,marcado){
  const a=adicionaisCatalogo[i];
  if(marcado){if(!adicionalAtual.some(x=>x.nome===a.nome))adicionalAtual.push({...a})}
  else adicionalAtual=adicionalAtual.filter(x=>x.nome!==a.nome);
}

$("fotoProduto").addEventListener("change",e=>{
  const file=e.target.files[0];if(!file)return;
  if(file.size>1200000){alert("Escolha uma foto de até 1,2 MB.");e.target.value="";return}
  const r=new FileReader();
  r.onload=()=>{fotoAtual=r.result;$("previewFoto").src=fotoAtual;$("previewFoto").style.display="block"};
  r.readAsDataURL(file);
});

async function salvarProduto(){
  const nome=$("nomeProduto").value.trim();
  const preco=Number($("precoProduto").value);
  const categoria=$("categoriaProduto").value;
  if(!nome||!Number.isFinite(preco)||preco<0){alert("Preencha nome e preço.");return}
  if(!categoria){alert("Escolha uma categoria.");return}

  const payload={
    nome,
    preco,
    categoria,
    descricao:$("descricaoProduto").value.trim(),
    ativo:$("produtoAtivo").checked,
    disponivel:$("produtoDisponivel").checked,
    foto:fotoAtual||null,
    ingredientes:ingredientesAtual,
    adicionais:adicionalAtual
  };

  const id=$("produtoId").value;
  $("status").textContent="● Salvando...";
  let result;
  if(id) result=await supabaseClient.from("produtos").update(payload).eq("id",id);
  else result=await supabaseClient.from("produtos").insert(payload);

  if(result.error){
    $("status").textContent="● Erro";
    alert("Não foi possível salvar.\n\n"+result.error.message+"\n\nSe aparecer erro de coluna inexistente, rode o SQL do arquivo MIGRACAO_PRODUTOS.sql.");
    return;
  }
  $("status").textContent="● Conectado";
  alert(id?"Produto atualizado!":"Produto cadastrado!");
  cancelarProduto();
  await carregarTudo();
}

async function excluirProduto(id){
  if(!confirm("Excluir este produto?"))return;
  const r=await supabaseClient.from("produtos").delete().eq("id",id);
  if(r.error){alert("Não foi possível excluir: "+r.error.message);return}
  await carregarTudo();
}

function renderProdutos(){
  const box=$("listaProdutos");
  if(!produtos.length){box.innerHTML="<div class='empty'>Nenhum produto cadastrado.</div>";return}
  box.innerHTML=produtos.map(p=>{
    const foto=p.foto||"";
    const ingredientes=Array.isArray(p.ingredientes)?p.ingredientes:[];
    const adicionais=Array.isArray(p.adicionais)?p.adicionais:[];
    return `<article class="product">
      ${foto?`<img src="${escAttr(foto)}" alt="">`:`<div style="width:78px;height:78px;border-radius:12px;background:#eee;display:grid;place-items:center;font-size:30px">🥟</div>`}
      <div>
        <h3>${esc(p.nome)} <span class="badge ${p.ativo!==false?"on":"off"}">${p.ativo!==false?"Ativo":"Inativo"}</span> <span class="badge ${p.disponivel!==false?"on":"off"}">${p.disponivel!==false?"Disponível":"Indisponível"}</span></h3>
        <p>${esc(p.categoria||"Sem categoria")} · ${esc(p.descricao||"Sem descrição")}</p>
        <p class="price">${moeda(p.preco)}</p>
        <p>Ingredientes: ${ingredientes.length?ingredientes.map(x=>esc(typeof x==="string"?x:x.nome)).join(", "):"não cadastrados"}</p>
        <p>Adicionais: ${adicionais.length?adicionais.map(x=>esc(x.nome)+" ("+moeda(x.preco)+")").join(", "):"nenhum"}</p>
      </div>
      <div class="actions"><button class="btn light" onclick="editarProduto('${String(p.id).replace(/'/g,"\\'")}')">Editar</button><button class="btn danger" onclick="excluirProduto('${String(p.id).replace(/'/g,"\\'")}')">Excluir</button></div>
    </article>`;
  }).join("");
}

function renderCategorias(){
  prepararCategorias();
  const box=$("listaCategorias");
  if(!categorias.length){
    box.innerHTML="<div class='empty'>Nenhuma categoria cadastrada.</div>";
    return;
  }

  box.innerHTML=categorias.map(c=>{
    const qtd=produtos.filter(p=>p.categoria===c.nome).length;
    const ativo=c.ativo!==false;
    const id=String(c.id).replace(/'/g,"\\'");
    return `<article class="product">
      <div style="font-size:30px">📂</div>
      <div style="flex:1">
        <h3>${esc(c.nome)}
          <span class="badge ${ativo?"on":"off"}">${ativo?"Ativa":"Inativa"}</span>
        </h3>
        <p>${esc(c.descricao||"Sem descrição.")}</p>
        <p><strong>${qtd}</strong> produto(s)</p>
      </div>
      <div class="actions">
        <button class="btn light" type="button" onclick="editarCategoria('${id}')">Editar</button>
        <button class="btn danger" type="button" onclick="excluirCategoria('${id}')">Excluir</button>
      </div>
    </article>`;
  }).join("");
}

function moeda(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escAttr(v){return esc(v)}
