let produtoEditandoId=null,fotoSelecionada=null,produtosCache=[];
document.addEventListener("DOMContentLoaded",()=>{configurarFoto();carregarProdutos();});
function configurarFoto(){const e=document.getElementById("fotoProduto");if(e)e.addEventListener("change",async t=>{const a=t.target.files[0];fotoSelecionada=a?await arquivoParaBase64(a):null;});}
function arquivoParaBase64(e){return new Promise((t,a)=>{const r=new FileReader;r.onload=()=>t(r.result);r.onerror=a;r.readAsDataURL(e);});}
function mostrarFormulario(){produtoEditandoId=null;document.getElementById("formularioProduto").style.display="block";document.getElementById("tituloFormulario").innerText="Novo produto";limparFormularioProduto();}
function cancelarProduto(){document.getElementById("formularioProduto").style.display="none";produtoEditandoId=null;limparFormularioProduto();}
function limparFormularioProduto(){["nomeProduto","precoProduto","descricaoProduto","fotoProduto","produtoId"].forEach(e=>{const t=document.getElementById(e);if(t)t.value="";});const e=document.getElementById("categoriaProduto");if(e)e.selectedIndex=0;const t=document.getElementById("produtoAtivo");if(t)t.checked=true;document.querySelectorAll(".adicional").forEach(e=>e.checked=false);fotoSelecionada=null;}
function pegarAdicionaisSelecionados(){return [...document.querySelectorAll(".adicional:checked")].map(e=>({nome:e.value,preco:Number(e.dataset.preco||0)}));}
async function salvarProduto(){const e=document.getElementById("nomeProduto").value.trim(),t=document.getElementById("precoProduto").value;if(!e)return alert("Digite o nome do produto.");if(!t||Number(t)<=0)return alert("Digite um preço válido.");if(typeof supabaseClient==="undefined")return alert("A conexão com o Supabase não foi carregada.");const a={nome:e,preco:Number(t),categoria:document.getElementById("categoriaProduto").value,descricao:document.getElementById("descricaoProduto").value.trim(),ativo:document.getElementById("produtoAtivo").checked,adicionais:pegarAdicionaisSelecionados()};if(fotoSelecionada)a.foto=fotoSelecionada;let r;if(produtoEditandoId)r=await supabaseClient.from("produtos").update(a).eq("id",produtoEditandoId);else r=await supabaseClient.from("produtos").insert([a]);if(r.error){console.error(r.error);return alert("Não foi possível salvar: "+r.error.message);}alert(produtoEditandoId?"Produto atualizado com sucesso!":"Produto adicionado com sucesso!");cancelarProduto();carregarProdutos();}
async function carregarProdutos(){const e=document.getElementById("listaProdutos");if(!e||typeof supabaseClient==="undefined")return;e.innerHTML="<p>Carregando produtos...</p>";const{data:t,error:a}=await supabaseClient.from("produtos").select("*").order("id",{ascending:false});if(a){console.error(a);return e.innerHTML="<p>Não foi possível carregar os produtos.</p>";}produtosCache=t||[];if(!produtosCache.length)return e.innerHTML="<p>Nenhum produto cadastrado ainda.</p>";e.innerHTML=produtosCache.map(criarCardProduto).join("");}
function criarCardProduto(e){const t=Number(e.preco||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),a=e.foto?`<img src="${e.foto}" alt="${escaparHTML(e.nome)}">`:`<div>Sem foto</div>`;return `<article class="produto-admin"><div>${a}</div><div><h3>${escaparHTML(e.nome)}</h3><p>${escaparHTML(e.categoria||"")}</p><p>${escaparHTML(e.descricao||"Sem descrição.")}</p><strong>${t}</strong><p>${e.ativo?"Ativo":"Inativo"}</p><button onclick="editarProduto(${e.id})">Editar</button><button onclick="alternarStatusProduto(${e.id})">${e.ativo?"Inativar":"Ativar"}</button><button onclick="excluirProduto(${e.id})">Excluir</button></div></article>`;}
function escaparHTML(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function editarProduto(e){const t=produtosCache.find(t=>t.id===e);if(!t)return;produtoEditandoId=e;document.getElementById("formularioProduto").style.display="block";document.getElementById("tituloFormulario").innerText="Editar produto";document.getElementById("produtoId").value=t.id;document.getElementById("nomeProduto").value=t.nome||"";document.getElementById("precoProduto").value=t.preco||"";document.getElementById("categoriaProduto").value=t.categoria||"";document.getElementById("descricaoProduto").value=t.descricao||"";document.getElementById("produtoAtivo").checked=t.ativo!==false;fotoSelecionada=t.foto||null;document.querySelectorAll(".adicional").forEach(e=>{e.checked=(Array.isArray(t.adicionais)?t.adicionais:[]).some(t=>(t.nome||t)===e.value);});}
async function alternarStatusProduto(e){const t=produtosCache.find(t=>t.id===e);if(!t)return;const{error:a}=await supabaseClient.from("produtos").update({ativo:!t.ativo}).eq("id",e);if(a)return alert("Não foi possível alterar o status.");carregarProdutos();}
async function excluirProduto(e){const t=produtosCache.find(t=>t.id===e);if(!t||!confirm(`Deseja excluir "${t.nome}"?`))return;const{error:a}=await supabaseClient.from("produtos").delete().eq("id",e);if(a)return alert("Não foi possível excluir o produto.");carregarProdutos();}


// ======================================================
// BLOCO TAMANHOS — Pastelaria El Shaddai
// ======================================================
let tamanhosProdutoEditando = [];

function normalizarTamanhosProduto(valor) {
    return Array.isArray(valor) ? valor.filter(x => x && String(x.nome || '').trim()) : [];
}

function renderizarTamanhosAdmin() {
    const lista = document.getElementById('listaTamanhos');
    const editor = document.getElementById('tamanhosEditor');
    const ativo = document.getElementById('produtoTemTamanhos');
    if (!lista || !editor) return;

    if (ativo) ativo.checked = tamanhosProdutoEditando.length > 0;
    editor.style.display = (ativo && ativo.checked) ? 'block' : 'none';

    if (!tamanhosProdutoEditando.length) {
        lista.innerHTML = '<div class="help">Nenhum tamanho cadastrado.</div>';
        return;
    }

    lista.innerHTML = tamanhosProdutoEditando.map((t, i) => `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px;padding:10px;border:1px solid #eee;border-radius:10px;background:#fff">
            <strong style="flex:1;min-width:120px">${escaparHTML(t.nome)}</strong>
            <span>${Number(t.preco || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
            <button type="button" class="btn light" onclick="editarTamanho(${i})">Editar</button>
            <button type="button" class="btn danger" onclick="removerTamanho(${i})">Excluir</button>
        </div>
    `).join('');
}

function alternarBlocoTamanhos() {
    const ativo = document.getElementById('produtoTemTamanhos');
    const editor = document.getElementById('tamanhosEditor');
    if (!ativo || !editor) return;
    editor.style.display = ativo.checked ? 'block' : 'none';
    if (ativo.checked && !tamanhosProdutoEditando.length) renderizarTamanhosAdmin();
}

function adicionarTamanho() {
    const nomeEl = document.getElementById('novoTamanhoNome');
    const precoEl = document.getElementById('novoTamanhoPreco');
    const nome = (nomeEl?.value || '').trim();
    const preco = Number(precoEl?.value);
    if (!nome) return alert('Informe o nome do tamanho.');
    if (!Number.isFinite(preco) || preco < 0) return alert('Informe um preço válido.');
    if (tamanhosProdutoEditando.some(t => String(t.nome).toLowerCase() === nome.toLowerCase())) {
        return alert('Esse tamanho já foi cadastrado neste produto.');
    }
    tamanhosProdutoEditando.push({nome, preco});
    if (nomeEl) nomeEl.value = '';
    if (precoEl) precoEl.value = '';
    const ativo = document.getElementById('produtoTemTamanhos');
    if (ativo) ativo.checked = true;
    renderizarTamanhosAdmin();
}

function editarTamanho(index) {
    const t = tamanhosProdutoEditando[index];
    if (!t) return;
    const nome = prompt('Nome do tamanho:', t.nome);
    if (nome === null) return;
    const preco = prompt('Preço:', String(t.preco));
    if (preco === null) return;
    const valor = Number(preco.replace(',', '.'));
    if (!nome.trim() || !Number.isFinite(valor) || valor < 0) return alert('Dados inválidos.');
    tamanhosProdutoEditando[index] = {nome:nome.trim(), preco:valor};
    renderizarTamanhosAdmin();
}

function removerTamanho(index) {
    tamanhosProdutoEditando.splice(index, 1);
    const ativo = document.getElementById('produtoTemTamanhos');
    if (ativo && tamanhosProdutoEditando.length === 0) ativo.checked = false;
    renderizarTamanhosAdmin();
}

function prepararTamanhosDoProduto(produto) {
    tamanhosProdutoEditando = normalizarTamanhosProduto(produto?.tamanhos).map(t => ({nome:String(t.nome), preco:Number(t.preco || 0)}));
    renderizarTamanhosAdmin();
}

// Substitui o salvamento do produto para incluir tamanhos.
async function salvarProduto() {
    const nome = document.getElementById('nomeProduto')?.value.trim();
    const preco = Number(document.getElementById('precoProduto')?.value);
    if (!nome) return alert('Digite o nome do produto.');
    if (!Number.isFinite(preco) || preco <= 0) return alert('Digite um preço válido.');
    if (typeof supabaseClient === 'undefined') return alert('A conexão com o Supabase não foi carregada.');

    const temTamanhos = document.getElementById('produtoTemTamanhos')?.checked === true;
    const tamanhos = temTamanhos ? tamanhosProdutoEditando : [];
    if (temTamanhos && !tamanhos.length) return alert('Cadastre pelo menos um tamanho ou desmarque a opção.');

    const dados = {
        nome,
        preco,
        categoria: document.getElementById('categoriaProduto')?.value || '',
        descricao: document.getElementById('descricaoProduto')?.value.trim() || '',
        ativo: document.getElementById('produtoAtivo')?.checked !== false,
        disponivel: document.getElementById('produtoDisponivel')?.checked !== false,
        adicionais: typeof pegarAdicionaisSelecionados === 'function' ? pegarAdicionaisSelecionados() : [],
        tamanhos
    };
    if (fotoSelecionada) dados.foto = fotoSelecionada;

    let resultado;
    if (produtoEditandoId) resultado = await supabaseClient.from('produtos').update(dados).eq('id', produtoEditandoId);
    else resultado = await supabaseClient.from('produtos').insert([dados]);

    if (resultado.error) {
        console.error(resultado.error);
        return alert('Não foi possível salvar: ' + resultado.error.message);
    }
    alert(produtoEditandoId ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
    cancelarProduto();
    if (typeof carregarProdutos === 'function') carregarProdutos();
}

function editarProduto(id) {
    const produto = produtosCache.find(p => p.id === id);
    if (!produto) return;
    produtoEditandoId = id;
    const form = document.getElementById('formularioProduto');
    if (form) form.style.display = 'block';
    const titulo = document.getElementById('tituloFormulario');
    if (titulo) titulo.innerText = 'Editar produto';
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value ?? ''; };
    set('produtoId', produto.id);
    set('nomeProduto', produto.nome);
    set('precoProduto', produto.preco);
    set('categoriaProduto', produto.categoria);
    set('descricaoProduto', produto.descricao);
    const ativo = document.getElementById('produtoAtivo'); if (ativo) ativo.checked = produto.ativo !== false;
    const disponivel = document.getElementById('produtoDisponivel'); if (disponivel) disponivel.checked = produto.disponivel !== false;
    fotoSelecionada = produto.foto || null;
    document.querySelectorAll('.adicional').forEach(el => {
        el.checked = (Array.isArray(produto.adicionais) ? produto.adicionais : []).some(a => (a.nome || a) === el.value);
    });
    prepararTamanhosDoProduto(produto);
}

const _limparFormularioProdutoOriginal = typeof limparFormularioProduto === 'function' ? limparFormularioProduto : null;
function limparFormularioProduto() {
    if (_limparFormularioProdutoOriginal) _limparFormularioProdutoOriginal();
    tamanhosProdutoEditando = [];
    const ativo = document.getElementById('produtoTemTamanhos'); if (ativo) ativo.checked = false;
    const editor = document.getElementById('tamanhosEditor'); if (editor) editor.style.display = 'none';
    const lista = document.getElementById('listaTamanhos'); if (lista) lista.innerHTML = '<div class="help">Nenhum tamanho cadastrado.</div>';
}

// Mostra tamanhos no card administrativo.
const _criarCardProdutoOriginal = typeof criarCardProduto === 'function' ? criarCardProduto : null;
function criarCardProduto(produto) {
    const base = _criarCardProdutoOriginal ? _criarCardProdutoOriginal(produto) : '';
    const tamanhos = normalizarTamanhosProduto(produto.tamanhos);
    if (!tamanhos.length || !base) return base;
    const resumo = tamanhos.map(t => `${escaparHTML(t.nome)}: ${Number(t.preco).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`).join(' · ');
    return base.replace('</article>', `<p><strong>Tamanhos:</strong> ${resumo}</p></article>`);
}

// ======================================================
// Integração do tamanho no cardápio: reaproveita os botões existentes.
// Quando o produto tem tamanhos cadastrados no Supabase, o cliente escolhe antes de adicionar.
// ======================================================
async function adicionarProduto(nome, preco) {
    try {
        if (typeof supabaseClient !== 'undefined') {
            const {data, error} = await supabaseClient.from('produtos').select('nome,preco,tamanhos').eq('nome', nome).eq('ativo', true).limit(1).maybeSingle();
            if (!error && data && Array.isArray(data.tamanhos) && data.tamanhos.length) {
                if (typeof personalizarBebida === 'function') {
                    personalizarBebida(data.nome || nome, data.tamanhos);
                    return;
                }
            }
        }
    } catch (e) { console.warn('Não foi possível consultar tamanhos:', e); }

    const existente = carrinho.find(item => item.nome === nome && Number(item.preco) === Number(preco) && (!item.detalhes || item.detalhes.length === 0));
    if (existente) existente.quantidade = Number(existente.quantidade || 1) + 1;
    else carrinho.push({nome, preco:Number(preco), quantidade:1, detalhes:[]});
    salvarCarrinho();
    alert('Produto adicionado ao carrinho!');
}
