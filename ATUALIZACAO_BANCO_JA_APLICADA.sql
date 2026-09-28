-- Esta migração JÁ foi aplicada no projeto Supabase existente.
-- Não execute novamente se as colunas já existirem.
-- Nenhuma tabela foi criada.

alter table public.configuracoes_loja
  add column if not exists configuracoes_extras jsonb not null default '{}'::jsonb;

alter table public.clientes
  add column if not exists fidelidade jsonb not null default '{"beneficios":0}'::jsonb;
