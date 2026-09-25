# Pastelaria El Shaddai — reconstrução dos arquivos

Este pacote reconstrói os arquivos do projeto existente, sem criar outro Supabase e sem alterar a estrutura do banco.

## Projeto utilizado
- Supabase: `qjwojyxfktabdkbiryfx`
- URL: `https://qjwojyxfktabdkbiryfx.supabase.co`
- Repositório previsto: `Site-El-Shaddai`

## Arquivos
- `index.html` — cardápio
- `pedido.html` — carrinho e checkout
- `acompanhar.html` — acompanhamento
- `admin.html` — administração
- `script.js` — cliente, carrinho, checkout, pedido e acompanhamento
- `admin.js` — dashboard e CRUDs administrativos
- `style.css` / `admin.css`
- `supabase.js`
- `Logo.png` deve ser colocado na raiz do repositório, respeitando maiúsculas/minúsculas.

## Banco
O pacote foi montado contra as tabelas existentes verificadas no Supabase:
`categorias`, `produtos`, `clientes`, `pedidos`, `configuracoes_loja`, `promocoes`.

Nenhuma tabela foi criada ou modificada por este pacote.

## Importante
As políticas RLS existentes permitem operações anon no estado verificado do banco. O pacote usa somente a chave pública/publishable e nunca usa service_role.

## Limites conscientes
A estrutura atual do banco não possui colunas específicas para todas as futuras regras de entrega, estatísticas, fidelidade avançada e horários. Por isso este pacote não inventa essas colunas. O pedido guarda tamanho, adicionais, subtotal do item e dados de checkout dentro de `itens`/campos existentes.

Antes de publicar, substitua/adicione `Logo.png` se ele não estiver no repositório.
