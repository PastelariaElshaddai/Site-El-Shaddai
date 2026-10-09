-- Execute no SQL Editor do Supabase somente quando quiser iniciar sem histórico.
-- Remove pedidos e cadastros de clientes; preserva produtos, categorias,
-- configurações da loja, promoções, credenciais, impressora e notificações.
begin;
delete from public.pedidos;
delete from public.clientes;
commit;

select 'pedidos' as tabela, count(*) as registros from public.pedidos
union all
select 'clientes', count(*) from public.clientes;
