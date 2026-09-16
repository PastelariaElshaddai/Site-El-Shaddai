-- Pastelaria El Shaddai - Bloco Tamanhos
alter table public.produtos
  add column if not exists tamanhos jsonb default '[]'::jsonb;

update public.produtos
set tamanhos = '[]'::jsonb
where tamanhos is null;
