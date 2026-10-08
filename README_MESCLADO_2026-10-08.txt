PASTELARIA EL SHADDAI — PACOTE MESCLADO 2026-10-08

Base usada: segundo ZIP enviado, por conter a versão mais completa do carrinho,
personalização, tamanhos/adicionais e fluxo de aprovação de pedidos.

Preservado:
- carrinho e checkout da versão mais completa;
- catálogo dinâmico pelo Supabase;
- ADM e recursos administrativos da versão mais completa;
- acompanhar pedido e aprovação/recusa.

Ajustado somente para este teste:
- cache-busting dos scripts para evitar navegador usando versão antiga;
- limite de 15 segundos nas consultas iniciais do ADM e do cardápio;
- se o Supabase não responder, o status deixa de ficar indefinidamente em
  'Verificando' e mostra erro de conexão.

Nenhuma tabela do Supabase foi alterada por este pacote.
