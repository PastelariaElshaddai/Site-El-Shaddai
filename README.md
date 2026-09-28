# Pastelaria El Shaddai — pacote completo de continuidade

Este pacote continua o projeto existente `PastelariaElshaddai/Site-El-Shaddai`.
Não usa o repositório antigo e não cria outro projeto Supabase.

## O que foi integrado
- Cardápio dinâmico pelo Supabase.
- Categorias, busca, produtos, fotos, descrição e ingredientes.
- Tamanhos personalizados e adicionais.
- Carrinho com quantidade, edição, remoção e subtotais.
- Checkout com entrega/retirada, pagamentos configuráveis, troco, cupom, fidelidade e taxa fixa de entrega.
- Pedido completo salvo na tabela `pedidos` usando os campos existentes e `itens` JSONB.
- Cadastro/atualização do cliente e controle de fidelidade.
- WhatsApp com pedido, itens, valores e link direto de acompanhamento.
- Acompanhamento do pedido por `acompanhar.html?id=NUMERO`.
- ADM com dashboard de números reais, pedidos, aceitar/rejeitar, produtos, categorias, clientes, promoções e configurações.
- Botão rápido de abrir/fechar a loja no topo do ADM.
- Status aberto/fechado visível no cliente.
- Horários configuráveis no ADM e bloqueio de novos pedidos fora do horário.
- Configurações de entrega: taxa fixa, pedido mínimo e frete grátis por valor.
- Preservação da identidade visual em tons creme/marrom já usada no projeto.

## Banco
Projeto Supabase existente: `qjwojyxfktabdkbiryfx`.

Foi aplicada uma única migração de suporte, sem criar tabelas:
- `configuracoes_loja.configuracoes_extras` — JSONB para horários e regras de entrega.
- `clientes.fidelidade` — JSONB para benefícios de fidelidade.

As tabelas existentes continuam sendo:
`categorias`, `produtos`, `clientes`, `pedidos`, `configuracoes_loja`, `promocoes`.

## Logo
O pacote NÃO substitui o `Logo.png` existente no repositório. Mantenha o arquivo real `Logo.png` na raiz do GitHub Pages, com L maiúsculo e P maiúsculo.

## Arquivos principais
- `index.html`
- `pedido.html`
- `acompanhar.html`
- `admin.html`
- `script.js`
- `admin.js`
- `style.css`
- `admin.css`
- `supabase.js` (mantido sem alteração)

## Publicação
Use estes arquivos na branch `melhorias-adm-completo` e depois abra um Pull Request para `main`.
Não apague `Logo.png` nem `supabase.js`.

## Observação de entrega
A taxa desta versão é fixa. GPS/Haversine não é apresentado como distância por estrada e nenhuma API de mapas foi inventada.
