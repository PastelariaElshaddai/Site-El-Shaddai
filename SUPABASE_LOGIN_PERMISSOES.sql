-- Pizzaria e Cia El Shaddai
-- Libera o painel ADM autenticado no Supabase Auth.
-- Não altera dados nem cria tabelas.

create policy "ADM autenticado consulta categorias"
on public.categorias for select to authenticated using (true);
create policy "ADM autenticado adiciona categorias"
on public.categorias for insert to authenticated with check (true);
create policy "ADM autenticado edita categorias"
on public.categorias for update to authenticated using (true) with check (true);
create policy "ADM autenticado exclui categorias"
on public.categorias for delete to authenticated using (true);

create policy "ADM autenticado consulta produtos"
on public.produtos for select to authenticated using (true);
create policy "ADM autenticado adiciona produtos"
on public.produtos for insert to authenticated with check (true);
create policy "ADM autenticado edita produtos"
on public.produtos for update to authenticated using (true) with check (true);
create policy "ADM autenticado exclui produtos"
on public.produtos for delete to authenticated using (true);

create policy "ADM autenticado consulta configuracao"
on public.configuracoes_loja for select to authenticated using (true);
create policy "ADM autenticado adiciona configuracao"
on public.configuracoes_loja for insert to authenticated with check (true);
create policy "ADM autenticado edita configuracao"
on public.configuracoes_loja for update to authenticated using (true) with check (true);

create policy "ADM autenticado consulta pedidos"
on public.pedidos for select to authenticated using (true);
create policy "ADM autenticado atualiza pedidos"
on public.pedidos for update to authenticated using (true) with check (true);

create policy "ADM autenticado consulta clientes"
on public.clientes for select to authenticated using (true);
create policy "ADM autenticado atualiza clientes"
on public.clientes for update to authenticated using (true) with check (true);

create policy "ADM autenticado consulta promocoes"
on public.promocoes for select to authenticated using (true);
create policy "ADM autenticado adiciona promocoes"
on public.promocoes for insert to authenticated with check (true);
create policy "ADM autenticado edita promocoes"
on public.promocoes for update to authenticated using (true) with check (true);
create policy "ADM autenticado exclui promocoes"
on public.promocoes for delete to authenticated using (true);
