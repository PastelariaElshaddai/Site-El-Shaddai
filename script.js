let carrinho=JSON.parse(localStorage.getItem("carrinho")||"[]");
function salvarCarrinho(){localStorage.setItem("carrinho",JSON.stringify(carrinho));atualizarContador()}
function atualizarContador(){document.querySelectorAll("#contadorCarrinho,.contador-carrinho").forEach(e=>e.textContent=carrinho.reduce((s,i)=>s+(Number(i.quantidade)||0),0))}
function adicionarProduto(nome,preco,extra={}){
const item={nome,preco:Number(preco)||0,quantidade:1,...extra};
const chave=JSON.stringify([item.nome,item.tamanho||null,item.adicionais||[]]);
const i=carrinho.findIndex(x=>JSON.stringify([x.nome,x.tamanho||null,x.adicionais||[]])===chave);
if(i>=0)carrinho[i].quantidade=(Number(carrinho[i].quantidade)||0)+1;else carrinho.push(item);salvarCarrinho();
}
function personalizarProduto(nome,preco,ingredientes=[],adicionais=[]){
const obs=prompt("Observação/personalização:")||"";
adicionarProduto(nome,preco,{observacao:obs,ingredientes,adicionais});
alert("Produto adicionado ao carrinho.");
}
function personalizarPizza(...a){return personalizarProduto(...a)}
function personalizarBatata(...a){return personalizarProduto(...a)}
function personalizarBebida(...a){return personalizarProduto(...a)}
function verCarrinho(){location.href="pedido.html"}
document.addEventListener("DOMContentLoaded",atualizarContador);