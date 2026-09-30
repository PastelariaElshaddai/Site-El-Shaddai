const db = window.supabaseClient;
const CART_KEY = "elshaddai_carrinho_v1";

let config = {};
let products = [];
let categories = [];
let cart = [];
let selectedProduct = null;

const $ = (s) => document.querySelector(s);
const money = (v) => Number(v || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc = (v) => String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

function loadCart(){
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { cart = []; }
}
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function getExtras(p){ return Array.isArray(p?.adicionais) ? p.adicionais : []; }
function getSizes(p){ return Array.isArray(p?.tamanhos) ? p.tamanhos : []; }

async function loadStore(){
  if(!db) return;
  const r = await db.from("configuracoes_loja").select("*").limit(1).maybeSingle();
  config = r.data || {};
  applyStore();
}
function applyStore(){
  const name = config.nome_loja || "Pastelaria El Shaddai";
  const slogan = config.slogan || "Feito a dois, no ponto pra você!";
  const logo = config.logo || "Logo.png";
  document.querySelectorAll("#storeName").forEach(e=>e.textContent=name);
  document.querySelectorAll("#storeSlogan").forEach(e=>e.textContent=slogan);
  document.querySelectorAll("#storeLogo").forEach(e=>e.src=logo);

  const open = config.loja_aberta !== false;
  document.querySelectorAll("#storeStatus").forEach(e=>{
    e.textContent=open ? "ABERTA" : "FECHADA";
    e.classList.toggle("closed",!open);
  });

  const extra = config.configuracoes_extras || {};
  const hours = extra.horarios || extra.horas || {};
  const hoursText = extra.horario_exibicao || extra.horario || (
    hours.abertura && hours.fechamento ? `${hours.abertura} às ${hours.fechamento}` : ""
  );
  document.querySelectorAll("#storeHours").forEach(e=>e.textContent=hoursText || "Consulte nossos horários");
  const banner = config.banner;
  const hero = document.querySelector("#storeBanner");
  if(hero && banner) hero.src=banner;
}

async function loadCatalog(){
  if(!db) return;
  const [p,c] = await Promise.all([
    db.from("produtos").select("*").eq("ativo",true).order("id"),
    db.from("categorias").select("*").eq("ativo",true).order("id")
  ]);
  products = p.data || [];
  categories = c.data || [];
  renderCategories();
  renderProducts(products);
}

function renderCategories(){
  const box = $("#categoryChips") || $("#categoryList") || $("#categories");
  if(!box) return;
  box.innerHTML = `<button class="category-chip active" data-cat="">Todos</button>` +
    categories.map(c=>`<button class="category-chip" data-cat="${esc(c.nome)}">${esc(c.nome)}</button>`).join("");
  box.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{
    box.querySelectorAll("[data-cat]").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    const cat=b.dataset.cat;
    renderProducts(cat ? products.filter(p=>p.categoria===cat) : products);
  });
}

function renderProducts(list){
  const grid=$("#productGrid") || $("#productsGrid") || $("#products");
  if(!grid)return;
  if(!list.length){grid.innerHTML='<div class="empty-card">Nenhum produto encontrado.</div>';return}
  grid.innerHTML=list.map(p=>{
    const disabled=p.disponivel===false;
    return `<article class="product-card ${disabled?"unavailable":""}">
      ${p.foto?`<img src="${esc(p.foto)}" alt="${esc(p.nome)}">`:""}
      <div class="product-card-body">
        <small>${esc(p.categoria||"")}</small>
        <h3>${esc(p.nome)}</h3>
        <p>${esc(p.descricao||"")}</p>
        ${p.ingredientes?.length?`<small>${esc(Array.isArray(p.ingredientes)?p.ingredientes.join(", "):p.ingredientes)}</small>`:""}
        <strong>${priceLabel(p)}</strong>
        <button class="primary-btn" ${disabled||config.loja_aberta===false?"disabled":""} onclick="openProduct(${p.id})">${disabled?"Indisponível":"Adicionar"}</button>
      </div>
    </article>`;
  }).join("");
}
function priceLabel(p){
  const s=getSizes(p);
  if(s.length)return `A partir de ${money(Math.min(...s.map(x=>Number(x.preco||0))))}`;
  return money(p.preco);
}

window.openProduct = function(id){
  selectedProduct=products.find(p=>Number(p.id)===Number(id));
  if(!selectedProduct)return;
  let modal=$("#productModal");
  if(!modal){
    modal=document.createElement("div");modal.id="productModal";modal.className="modal";
    document.body.appendChild(modal);
  }
  const sizes=getSizes(selectedProduct), extras=getExtras(selectedProduct);
  modal.innerHTML=`<div class="modal-content">
    <button class="modal-close" onclick="closeProduct()">×</button>
    <h2>${esc(selectedProduct.nome)}</h2>
    <p>${esc(selectedProduct.descricao||"")}</p>
    ${sizes.length?`<label>Tamanho <select id="choiceSize" required>${sizes.map((s,i)=>`<option value="${i}">${esc(s.nome||s.tamanho||"Tamanho")} — ${money(s.preco)}</option>`).join("")}</select></label>`:""}
    ${extras.length?`<div><strong>Adicionais</strong>${extras.map((x,i)=>`<label style="display:block;margin:8px 0"><input type="checkbox" class="choiceExtra" value="${i}"> ${esc(x.nome||x.titulo||x)} ${x.preco?`(+ ${money(x.preco)})`:""}</label>`).join("")}</div>`:""}
    <label>Quantidade <input id="choiceQty" type="number" min="1" value="1"></label>
    <button class="primary-btn" onclick="addSelected()">Adicionar ao carrinho</button>
  </div>`;
  modal.style.display="flex";
}
window.closeProduct=function(){const m=$("#productModal");if(m)m.style.display="none"}

window.addSelected=function(){
  if(!selectedProduct)return;
  const sizes=getSizes(selectedProduct);
  const extras=getExtras(selectedProduct);
  const size=sizes.length ? sizes[Number($("#choiceSize").value)||0] : null;
  const chosen=[...document.querySelectorAll(".choiceExtra:checked")].map(x=>extras[Number(x.value)]).filter(Boolean);
  const qty=Math.max(1,Number($("#choiceQty").value||1));
  let unit=Number(size?.preco ?? selectedProduct.preco ?? 0);
  chosen.forEach(x=>unit+=Number(x.preco||0));
  const key=JSON.stringify([selectedProduct.id,size?.nome||size?.tamanho||"",chosen.map(x=>x.id||x.nome||x)]);
  const old=cart.find(x=>x._key===key);
  if(old){old.quantidade+=qty;old.subtotal=unit*old.quantidade}
  else cart.push({_key:key,produto_id:selectedProduct.id,nome:selectedProduct.nome,preco:unit,tamanho:size?.nome||size?.tamanho||"",adicionais:chosen.map(x=>x.nome||x.titulo||x),quantidade:qty,subtotal:unit*qty});
  saveCart(); closeProduct(); updateCartBadge();
}

function updateCartBadge(){
  const n=cart.reduce((a,x)=>a+Number(x.quantidade||1),0);
  document.querySelectorAll("#cartCount,.cart-count").forEach(e=>e.textContent=n);
}
function setupSearch(){
  const input=$("#searchInput")||$("#search");
  if(!input)return;
  input.addEventListener("input",()=>{
    const q=input.value.toLowerCase().trim();
    renderProducts(products.filter(p=>[p.nome,p.categoria,p.descricao].some(v=>String(v||"").toLowerCase().includes(q))));
  });
}
function setupStoreClick(){
  document.querySelectorAll("[data-cart]").forEach(e=>e.onclick=()=>location.href="pedido.html");
}
async function init(){
  loadCart();
  await loadStore();
  await loadCatalog();
  setupSearch();
  setupStoreClick();
  updateCartBadge();
  if(config.instagram && config.instagram_ativo){
    document.querySelectorAll("#instagramLink").forEach(e=>{e.href=config.instagram;e.style.display="inline-flex"});
  }
  setInterval(loadStore,30000);
}
document.addEventListener("DOMContentLoaded",init);
