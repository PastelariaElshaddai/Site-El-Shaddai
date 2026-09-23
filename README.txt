PASTELARIA EL SHADDAI — CORREÇÃO CLIENTE + PROMOÇÃO + CONTATOS + FIDELIDADE

Arquivos para substituir no repositório atual:
- index.html
- admin.html
- admin.js
- catalogo.js

Alterações:
- Promoção ativa do Supabase agora aparece no cardápio do cliente.
- Marcador técnico de promoção é convertido para texto limpo.
- WhatsApp e Instagram aparecem no cliente somente como símbolos.
- Ambos podem ser ativados/desativados pelo ADM.
- Instagram é configurável no ADM.
- Fidelidade mostra progresso individual, quantidade que falta e meta atingida.
- Corrigida referência da logo para Logo.png.
- Cache dos scripts atualizado para a nova versão.

Banco:
Foram adicionadas à tabela configuracoes_loja as colunas:
- instagram
- instagram_ativo
- atendimento_ativo

A alteração do banco já foi aplicada no projeto Supabase existente.
