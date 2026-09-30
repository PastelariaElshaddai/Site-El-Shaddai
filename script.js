// ======================================================
// PASTELARIA EL SHADDAI
// SCRIPT COMPLETO
// ======================================================


// ======================================================
// CARRINHO
// ======================================================

let carrinho =
    JSON.parse(localStorage.getItem("carrinho")) || [];


// ======================================================
// SALVAR CARRINHO
// ======================================================

function salvarCarrinho() {

    localStorage.setItem(
        "carrinho",
        JSON.stringify(carrinho)
    );

    atualizarContador();
}


// ======================================================
// CONTADOR
// ======================================================

function atualizarContador() {

    const contador =
        document.getElementById("contador");

    if (!contador) return;

    let quantidade = 0;

    carrinho.forEach(function(item) {

        quantidade +=
            Number(item.quantidade || 1);

    });

    contador.textContent = quantidade;
}


// ======================================================
// ADICIONAR PRODUTO NORMAL
// ======================================================

function adicionarProduto(nome, preco) {

    const existente =
        carrinho.find(function(item) {

            return (
                item.nome === nome &&
                Number(item.preco) === Number(preco) &&
                (!item.detalhes ||
                 item.detalhes.length === 0)
            );

        });


    if (existente) {

        existente.quantidade =
            Number(existente.quantidade || 1) + 1;

    } else {

        carrinho.push({

            nome: nome,

            preco: Number(preco),

            quantidade: 1,

            detalhes: []

        });

    }


    salvarCarrinho();

    alert(
        "Produto adicionado ao carrinho!"
    );
}


// ======================================================
// PERSONALIZAR PRODUTO
// ======================================================

function personalizarProduto(
    nome,
    preco,
    ingredientes = [],
    adicionais = []
) {

    const antigo =
        document.getElementById(
            "personalizarModal"
        );

    if (antigo) antigo.remove();


    const fundo =
        document.createElement("div");

    fundo.id =
        "personalizarModal";


    fundo.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.65);
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:15px;
    `;


    const caixa =
        document.createElement("div");


    caixa.style.cssText = `
        width:100%;
        max-width:520px;
        max-height:92vh;
        overflow:auto;
        background:#fff8e7;
        border:4px solid #ffb300;
        border-radius:22px;
        padding:20px;
        box-sizing:border-box;
    `;


    caixa.innerHTML = `

        <h2 style="
            color:#c62828;
            text-align:center;
            margin-top:0;
        ">
            Personalizar pedido
        </h2>

        <div style="
            background:white;
            border:2px solid #ffd166;
            border-radius:15px;
            padding:15px;
            margin-bottom:20px;
        ">

            <strong style="
                font-size:22px;
            ">
                ${nome}
            </strong>

            <div
                id="totalPersonalizado"
                style="
                    color:#c62828;
                    font-size:22px;
                    font-weight:bold;
                    margin-top:8px;
                "
            >
                Total: R$ ${Number(preco)
                    .toFixed(2)
                    .replace(".", ",")}
            </div>

        </div>

        ${
            ingredientes.length > 0
            ? `
                <h3 style="
                    color:#c62828;
                ">
                    Ingredientes
                </h3>

                <p style="
                    font-size:15px;
                    color:#666;
                ">
                    Desmarque o que você não quer.
                </p>

                <div id="listaIngredientes"></div>
              `
            : ""
        }

        ${
            adicionais.length > 0
            ? `
                <h3 style="
                    color:#c62828;
                    margin-top:22px;
                ">
                    Adicionais
                </h3>

                <div id="listaAdicionais"></div>
              `
            : ""
        }

        <button
            id="btnAdicionarPersonalizado"
            style="
                width:100%;
                padding:16px;
                margin-top:20px;
                border:0;
                border-radius:12px;
                background:#ffb300;
                font-size:19px;
                font-weight:bold;
                cursor:pointer;
            "
        >
            Adicionar ao carrinho
        </button>

        <button
            id="btnFecharPersonalizar"
            style="
                width:100%;
                padding:14px;
                margin-top:10px;
                border:2px solid #c62828;
                border-radius:12px;
                background:white;
                color:#c62828;
                font-size:18px;
                font-weight:bold;
                cursor:pointer;
            "
        >
            Fechar
        </button>
    `;


    fundo.appendChild(caixa);

    document.body.appendChild(fundo);


    // ==================================================
    // INGREDIENTES
    // ==================================================

    const listaIngredientes =
        document.getElementById(
            "listaIngredientes"
        );


    if (listaIngredientes) {

        ingredientes.forEach(
            function(ingrediente, index) {

                listaIngredientes.innerHTML += `

                    <label style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        background:white;
                        border:1px solid #ddd;
                        border-radius:12px;
                        padding:13px;
                        margin-bottom:8px;
                        font-size:17px;
                        cursor:pointer;
                    ">

                        <span>
                            ${ingrediente}
                        </span>

                        <input
                            type="checkbox"
                            class="ingrediente"
                            data-nome="${ingrediente}"
                            checked
                            style="
                                width:24px;
                                height:24px;
                                accent-color:#ffb300;
                            "
                        >

                    </label>
                `;
            }
        );

    }


    // ==================================================
    // ADICIONAIS
    // ==================================================

    const listaAdicionais =
        document.getElementById(
            "listaAdicionais"
        );


    if (listaAdicionais) {

        adicionais.forEach(
            function(adicional, index) {

                listaAdicionais.innerHTML += `

                    <label style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        background:white;
                        border:1px solid #ddd;
                        border-radius:12px;
                        padding:13px;
                        margin-bottom:8px;
                        font-size:17px;
                        cursor:pointer;
                    ">

                        <span>

                            ${adicional.nome}

                            <strong style="
                                color:#c62828;
                                margin-left:5px;
                            ">
                                + R$ ${Number(
                                    adicional.preco
                                )
                                .toFixed(2)
                                .replace(".", ",")}
                            </strong>

                        </span>

                        <input
                            type="checkbox"
                            class="adicional"
                            data-index="${index}"
                            style="
                                width:24px;
                                height:24px;
                                accent-color:#ffb300;
                            "
                        >

                    </label>
                `;
            }
        );

    }


    // ==================================================
    // ATUALIZAR TOTAL
    // ==================================================

    function atualizarTotal() {

        let total =
            Number(preco);


        caixa
            .querySelectorAll(
                ".adicional"
            )
            .forEach(function(check) {

                if (check.checked) {

                    const index =
                        Number(
                            check.dataset.index
                        );

                    total +=
                        Number(
                            adicionais[index].preco
                        );

                }

            });


        const totalElemento =
            document.getElementById(
                "totalPersonalizado"
            );


        if (totalElemento) {

            totalElemento.textContent =
                "Total: R$ " +
                total
                    .toFixed(2)
                    .replace(".", ",");

        }

    }


    caixa
        .querySelectorAll(
            ".adicional"
        )
        .forEach(function(check) {

            check.addEventListener(
                "change",
                atualizarTotal
            );

        });


    // ==================================================
    // ADICIONAR PERSONALIZADO
    // ==================================================

    document
        .getElementById(
            "btnAdicionarPersonalizado"
        )
        .onclick =
        function() {


            let total =
                Number(preco);


            let detalhes = [];


            // ------------------------------------------
            // INGREDIENTES RETIRADOS
            // ------------------------------------------

            caixa
                .querySelectorAll(
                    ".ingrediente"
                )
                .forEach(function(check) {

                    if (!check.checked) {

                        detalhes.push(
                            "Sem " +
                            check.dataset.nome
                        );

                    }

                });


            // ------------------------------------------
            // ADICIONAIS
            // ------------------------------------------

            let adicionaisEscolhidos = [];


            caixa
                .querySelectorAll(
                    ".adicional"
                )
                .forEach(function(check) {

                    if (check.checked) {

                        const index =
                            Number(
                                check.dataset.index
                            );


                        const adicional =
                            adicionais[index];


                        adicionaisEscolhidos.push(
                            adicional.nome
                        );


                        total +=
                            Number(
                                adicional.preco
                            );

                    }

                });


            // ------------------------------------------
            // DETALHES DOS ADICIONAIS
            // ------------------------------------------

            adicionaisEscolhidos.forEach(
                function(adicional) {

                    detalhes.push(
                        "Com " + adicional
                    );

                }
            );


            // ------------------------------------------
            // ADICIONAR
            // ------------------------------------------

            carrinho.push({

                nome: nome,

                preco: total,

                quantidade: 1,

                detalhes: detalhes

            });


            salvarCarrinho();


            fundo.remove();


            alert(
                "Produto adicionado ao carrinho!"
            );

        };


    // ==================================================
    // FECHAR
    // ==================================================

    document
        .getElementById(
            "btnFecharPersonalizar"
        )
        .onclick =
        function() {

            fundo.remove();

        };

}


// ======================================================
// PERSONALIZAR PIZZA
// ======================================================

function personalizarPizza(
    nome,
    preco,
    ingredientes = [],
    adicionais = []
) {

    personalizarProduto(
        nome,
        preco,
        ingredientes,
        adicionais
    );

}


// ======================================================
// PERSONALIZAR BATATA
// ======================================================

function personalizarBatata(
    nome,
    preco
) {

    const adicionais = [

        {
            nome: "Queijo",
            preco: 3
        },

        {
            nome: "Bacon",
            preco: 4
        },

        {
            nome: "Calabresa",
            preco: 4
        },

        {
            nome: "Catupiry",
            preco: 3
        },

        {
            nome: "Cheddar",
            preco: 3
        },

        {
            nome: "Molho especial",
            preco: 2
        }

    ];


    personalizarProduto(
        nome,
        preco,
        [],
        adicionais
    );

}


// ======================================================
// PERSONALIZAR BEBIDA
// ======================================================

function personalizarBebida(
    nome,
    tamanhos
) {

    const antigo =
        document.getElementById(
            "personalizarModal"
        );

    if (antigo) antigo.remove();


    const fundo =
        document.createElement("div");

    fundo.id =
        "personalizarModal";


    fundo.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.65);
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:15px;
    `;


    const caixa =
        document.createElement("div");


    caixa.style.cssText = `
        width:100%;
        max-width:500px;
        background:#fff8e7;
        border:4px solid #ffb300;
        border-radius:22px;
        padding:20px;
    `;


    let html = `

        <h2 style="
            text-align:center;
            color:#c62828;
            margin-top:0;
        ">
            Escolha o tamanho
        </h2>

    `;


    tamanhos.forEach(
        function(tamanho, index) {

            html += `

                <label style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    background:white;
                    border:2px solid #ddd;
                    border-radius:12px;
                    padding:15px;
                    margin-bottom:10px;
                    font-size:18px;
                    cursor:pointer;
                ">

                    <span>
                        ${tamanho.nome}

                        <strong style="
                            color:#c62828;
                            margin-left:6px;
                        ">
                            R$ ${Number(
                                tamanho.preco
                            )
                            .toFixed(2)
                            .replace(".", ",")}
                        </strong>
                    </span>

                    <input
                        type="radio"
                        name="tamanhoBebida"
                        value="${index}"
                        ${
                            index === 0
                            ? "checked"
                            : ""
                        }
                        style="
                            width:24px;
                            height:24px;
                        "
                    >

                </label>

            `;

        }
    );


    html += `

        <button
            id="btnConfirmarBebida"
            style="
                width:100%;
                padding:16px;
                background:#ffb300;
                border:0;
                border-radius:12px;
                font-size:19px;
                font-weight:bold;
            "
        >
            Adicionar ao carrinho
        </button>

        <button
            id="btnFecharBebida"
            style="
                width:100%;
                padding:14px;
                margin-top:10px;
                background:white;
                border:2px solid #c62828;
                border-radius:12px;
                color:#c62828;
                font-size:18px;
                font-weight:bold;
            "
        >
            Fechar
        </button>

    `;


    caixa.innerHTML = html;

    fundo.appendChild(caixa);

    document.body.appendChild(fundo);


    document
        .getElementById(
            "btnConfirmarBebida"
        )
        .onclick =
        function() {

            const escolhido =
                caixa.querySelector(
                    'input[name="tamanhoBebida"]:checked'
                );


            if (!escolhido) {

                alert(
                    "Escolha um tamanho."
                );

                return;

            }


            const tamanho =
                tamanhos[
                    Number(escolhido.value)
                ];


            carrinho.push({

                nome:
                    nome +
                    " - " +
                    tamanho.nome,

                preco:
                    Number(
                        tamanho.preco
                    ),

                quantidade: 1,

                detalhes: []

            });


            salvarCarrinho();


            fundo.remove();


            alert(
                "Bebida adicionada ao carrinho!"
            );

        };


    document
        .getElementById(
            "btnFecharBebida"
        )
        .onclick =
        function() {

            fundo.remove();

        };

}


// ======================================================
// CARRINHO
// ======================================================

function verCarrinho() {

    const antigo =
        document.getElementById(
            "carrinhoModal"
        );

    if (antigo) antigo.remove();


    const fundo =
        document.createElement("div");

    fundo.id =
        "carrinhoModal";


    fundo.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.65);
        z-index:99998;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:15px;
    `;


    const caixa =
        document.createElement("div");


    caixa.style.cssText = `
        width:100%;
        max-width:520px;
        max-height:92vh;
        overflow:auto;
        background:#fff8e7;
        border:4px solid #ffb300;
        border-radius:22px;
        padding:20px;
        box-sizing:border-box;
    `;


    caixa.innerHTML = `

        <h2 style="
            text-align:center;
            color:#c62828;
            margin-top:0;
        ">
            Seu Carrinho
        </h2>

    `;


    let total = 0;


    if (carrinho.length === 0) {

        caixa.innerHTML += `

            <p style="
                text-align:center;
                font-size:19px;
            ">
                Seu carrinho está vazio.
            </p>

        `;

    } else {


        carrinho.forEach(
            function(produto, index) {

                const quantidade =
                    Number(
                        produto.quantidade || 1
                    );


                total +=
                    Number(produto.preco) *
                    quantidade;


                let detalhesHTML = "";


                if (
                    produto.detalhes &&
                    produto.detalhes.length > 0
                ) {

                    detalhesHTML = `

                        <div style="
                            margin-top:8px;
                            color:#666;
                            font-size:15px;
                        ">
                            ${produto.detalhes
                                .join("<br>")}
                        </div>

                    `;

                }


                caixa.innerHTML += `

                    <div style="
                        background:white;
                        border:2px solid #ffd166;
                        border-radius:14px;
                        padding:15px;
                        margin-bottom:12px;
                    ">

                        <strong style="
                            font-size:18px;
                        ">
                            ${quantidade}x
                            ${produto.nome}
                        </strong>

                        ${detalhesHTML}

                        <p style="
                            color:#c62828;
                            font-weight:bold;
                        ">
                            R$ ${
                                (
                                    Number(
                                        produto.preco
                                    ) *
                                    quantidade
                                )
                                .toFixed(2)
                                .replace(".", ",")
                            }
                        </p>

                        <button
                            onclick="
                                diminuirProduto(${index})
                            "
                            style="
                                padding:10px 16px;
                                font-size:20px;
                                border:0;
                                border-radius:8px;
                                background:#ffb300;
                            "
                        >
                            −
                        </button>

                        <strong style="
                            margin:0 15px;
                            font-size:19px;
                        ">
                            ${quantidade}
                        </strong>

                        <button
                            onclick="
                                aumentarProduto(${index})
                            "
                            style="
                                padding:10px 16px;
                                font-size:20px;
                                border:0;
                                border-radius:8px;
                                background:#ffb300;
                            "
                        >
                            +
                        </button>

                        <button
                            onclick="
                                removerProduto(${index})
                            "
                            style="
                                margin-left:8px;
                                padding:10px;
                                background:#c62828;
                                color:white;
                                border:0;
                                border-radius:8px;
                            "
                        >
                            Remover
                        </button>

                    </div>

                `;

            }
        );


        caixa.innerHTML += `

            <h2 style="
                text-align:center;
                color:#c62828;
            ">
                Total: R$ ${
                    total
                    .toFixed(2)
                    .replace(".", ",")
                }
            </h2>

            <button
                onclick="irParaPedido()"
                style="
                    width:100%;
                    padding:16px;
                    background:#ffb300;
                    border:0;
                    border-radius:12px;
                    font-size:19px;
                    font-weight:bold;
                "
            >
                Fazer pedido
            </button>

        `;

    }


    caixa.innerHTML += `

        <button
            id="fecharCarrinho"
            style="
                width:100%;
                padding:14px;
                margin-top:10px;
                background:white;
                border:2px solid #c62828;
                border-radius:12px;
                color:#c62828;
                font-size:18px;
                font-weight:bold;
            "
        >
            Fechar
        </button>

    `;


    fundo.appendChild(caixa);

    document.body.appendChild(fundo);


    document
        .getElementById(
            "fecharCarrinho"
        )
        .onclick =
        function() {

            fundo.remove();

        };

}


// ======================================================
// AUMENTAR
// ======================================================

function aumentarProduto(index) {

    if (!carrinho[index]) return;


    carrinho[index].quantidade =
        Number(
            carrinho[index].quantidade || 1
        ) + 1;


    salvarCarrinho();

    verCarrinho();

}


// ======================================================
// DIMINUIR
// ======================================================

function diminuirProduto(index) {

    if (!carrinho[index]) return;


    carrinho[index].quantidade =
        Number(
            carrinho[index].quantidade || 1
        ) - 1;


    if (
        carrinho[index].quantidade <= 0
    ) {

        carrinho.splice(index, 1);

    }


    salvarCarrinho();

    verCarrinho();

}


// ======================================================
// REMOVER
// ======================================================

function removerProduto(index) {

    if (!carrinho[index]) return;


    carrinho.splice(index, 1);


    salvarCarrinho();

    verCarrinho();

}


// ======================================================
// IR PARA PEDIDO
// ======================================================

function irParaPedido() {

    if (carrinho.length === 0) {

        alert(
            "Seu carrinho está vazio."
        );

        return;

    }


    salvarCarrinho();


    window.location.href =
        "pedido.html";

}


// ======================================================
// INICIAR
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        atualizarContador();

    }
);
// ==========================================
// BOTÕES DE CATEGORIAS
// ==========================================

function irParaSecao(id) {

    const secao = document.getElementById(id);

    if (!secao) return;

    secao.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    }
