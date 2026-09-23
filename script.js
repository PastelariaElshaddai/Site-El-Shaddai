/* PASTELARIA EL SHADDAI — CARRINHO E COMPATIBILIDADE */
(function(){
  "use strict";
  function ler(){try{const v=JSON.parse(localStorage.getItem("carrinho")||"[]");return Array.isArray(v)?v:[]}catch(e){return []}}
  window.carrinho=ler();
  function salvar(){localStorage.setItem("carrinho",JSON.stringify(window.carrinho));window.atualizarContador()}
  function qtd(){return window.carrinho.reduce((s,i)=>s+Number(i.quantidade||1),0)}
  window.salvarCarrinho=salvar;
  window.atualizarContador=function(){
    const n=qtd();
    document.querySelectorAll("#contador,#contadorCarrinho,.contador-carrinho").forEach(e=>e.textContent=String(n));
  };
  function dinheiro(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
  function esc(v){return String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  window.adicionarProduto=function(nome,preco,extra){
    extra=extra||{};
    const item=Object.assign({nome:String(nome),preco:Number(preco||0),quantidade:1},extra);
    window.carrinho.push(item); salvar();
    return item;
  };
  window.personalizarProduto=function(nome,preco,ingredientes,adicionais){
    ingredientes=Array.isArray(ingredientes)?ingredientes:[]; adicionais=Array.isArray(adicionais)?adicionais:[];
    const antigo=document.getElementById("personalizarProdutoModal"); if(antigo) antigo.remove();
    const fundo=document.createElement("div"); fundo.id="personalizarProdutoModal"; fundo.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100000;display:flex;align-items:center;justify-content:center;padding:15px";
    const caixa=document.createElement("div"); caixa.style.cssText="width:100%;max-width:520px;background:#fff8e7;border:3px solid #ffb300;border-radius:20px;padding:20px;max-height:90vh;overflow:auto;box-sizing:border-box";
    let html="<h2 style='text-align:center;color:#c62828;margin:0 0 8px'>Personalizar produto</h2><h3 style='text-align:center;margin:0'>"+esc(nome)+"</h3><p id='personalizarTotal' style='text-align:center;font-size:20px;font-weight:bold;color:#c62828'>"+dinheiro(preco)+"</p>";
    const ings=ingredientes.map(x=>typeof x==="string"?x:(x&&x.nome)||"").filter(Boolean);
    if(ings.length){html+="<div><strong>Ingredientes</strong>";ings.forEach(x=>html+="<label style='display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #ddd;border-radius:10px;padding:10px;margin-top:7px'><input class='ingProduto' data-nome='"+esc(x)+"' type='checkbox' checked style='width:20px;height:20px'><span>"+esc(x)+"</span></label>");html+="</div>"}
    const ads=adicionais.map(x=>({nome:(x&&x.nome)||"",preco:Number(x&&x.preco||0)})).filter(x=>x.nome);
    if(ads.length){html+="<div style='margin-top:15px'><strong>Adicionais</strong>";ads.forEach(a=>html+="<label style='display:flex;justify-content:space-between;gap:10px;background:#fff;border:1px solid #ddd;border-radius:10px;padding:10px;margin-top:7px'><span><input class='adicProduto' data-nome='"+esc(a.nome)+"' data-preco='"+a.preco+"' type='checkbox' style='width:20px;height:20px'> "+esc(a.nome)+"</span><strong>+ "+dinheiro(a.preco)+"</strong></label>");html+="</div>"}
    html+="<button id='confirmarPersonalizacaoProduto' type='button' style='width:100%;padding:15px;margin-top:18px;background:#ffb300;border:0;border-radius:12px;font-weight:bold;font-size:18px'>Adicionar ao carrinho</button><button id='fecharPersonalizacaoProduto' type='button' style='width:100%;padding:13px;margin-top:9px;background:white;border:2px solid #c62828;border-radius:12px;color:#c62828;font-weight:bold'>Fechar</button>";
    caixa.innerHTML=html; fundo.appendChild(caixa); document.body.appendChild(fundo);
    function total(){let t=Number(preco||0);caixa.querySelectorAll(".adicProduto:checked").forEach(x=>t+=Number(x.dataset.preco||0));caixa.querySelector("#personalizarTotal").textContent=dinheiro(t);return t}
    caixa.querySelectorAll(".adicProduto").forEach(x=>x.addEventListener("change",total)); total();
    caixa.querySelector("#confirmarPersonalizacaoProduto").onclick=function(){
      const detalhes=[];caixa.querySelectorAll(".ingProduto:not(:checked)").forEach(x=>detalhes.push("Sem "+x.dataset.nome));caixa.querySelectorAll(".adicProduto:checked").forEach(x=>detalhes.push("Com "+x.dataset.nome));
      adicionarProduto(nome,total(),{detalhes:detalhes});fundo.remove();alert("Produto adicionado ao carrinho!");
    };
    caixa.querySelector("#fecharPersonalizacaoProduto").onclick=()=>fundo.remove();
  };
  window.personalizarPizza=function(nome,preco,ingredientes,adicionais){return window.personalizarProduto(nome,preco,ingredientes,adicionais||[])};
  window.personalizarBatata=window.personalizarPizza;
  window.personalizarBebida=window.personalizarPizza;
  window.verCarrinho=function(){location.href="pedido.html"};
  window.irParaPedido=function(){location.href="pedido.html"};
  document.addEventListener("DOMContentLoaded",window.atualizarContador);
})();
