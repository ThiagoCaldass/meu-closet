-- Tabela de roupas
create table public.roupas (
  id uuid default gen_random_uuid() primary key,
  nome text,
  categoria text not null check (categoria in ('sapato', 'parte_baixo', 'parte_cima', 'corpo_inteiro', 'acessorio')),
  imagem_url text not null,
  created_at timestamp with time zone default now()
);

-- Tabela de looks salvos
create table public.looks (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  modo text not null check (modo in ('completo', 'corpo_inteiro')),
  sapato_id uuid references public.roupas(id) on delete set null,
  parte_baixo_id uuid references public.roupas(id) on delete set null,
  parte_cima_id uuid references public.roupas(id) on delete set null,
  corpo_inteiro_id uuid references public.roupas(id) on delete set null,
  acessorio_id uuid references public.roupas(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Habilitar Row Level Security
alter table public.roupas enable row level security;
alter table public.looks enable row level security;

-- Policies permissivas (app pessoal sem autenticação)
create policy "allow all roupas" on public.roupas for all using (true) with check (true);
create policy "allow all looks" on public.looks for all using (true) with check (true);

-- Storage bucket para imagens
insert into storage.buckets (id, name, public) values ('roupas', 'roupas', true);

create policy "allow upload roupas"
  on storage.objects for insert
  with check (bucket_id = 'roupas');

create policy "allow read roupas"
  on storage.objects for select
  using (bucket_id = 'roupas');

create policy "allow delete roupas"
  on storage.objects for delete
  using (bucket_id = 'roupas');

-- ============================================================
-- MIGRATION v2 — rodar no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona categoria 'adesivo' à constraint
alter table public.roupas drop constraint if exists roupas_categoria_check;
alter table public.roupas add constraint roupas_categoria_check
  check (categoria in ('sapato', 'parte_baixo', 'parte_cima', 'corpo_inteiro', 'acessorio', 'adesivo'));

-- 2. Tabela de montagens
create table if not exists public.montagens (
  id uuid default gen_random_uuid() primary key,
  nome text,
  imagem_url text not null,
  created_at timestamp with time zone default now()
);
alter table public.montagens enable row level security;
create policy "allow all montagens" on public.montagens for all using (true) with check (true);

-- 3. Storage bucket para montagens
insert into storage.buckets (id, name, public) values ('montagens', 'montagens', true) on conflict do nothing;

create policy "allow upload montagens"
  on storage.objects for insert
  with check (bucket_id = 'montagens');

create policy "allow read montagens"
  on storage.objects for select
  using (bucket_id = 'montagens');

create policy "allow delete montagens"
  on storage.objects for delete
  using (bucket_id = 'montagens');

-- ============================================================
-- MIGRATION v3 — multi-usuário (Yasmim e Thiago)
-- ============================================================

-- 1. Adiciona coluna usuario em roupas
alter table public.roupas add column usuario text not null default 'yasmim';
alter table public.roupas add constraint roupas_usuario_check check (usuario in ('yasmim', 'thiago'));

-- 2. Adiciona coluna usuario em looks
alter table public.looks add column usuario text not null default 'yasmim';
alter table public.looks add constraint looks_usuario_check check (usuario in ('yasmim', 'thiago'));

-- 3. Adiciona coluna usuario em montagens
alter table public.montagens add column usuario text not null default 'yasmim';
alter table public.montagens add constraint montagens_usuario_check check (usuario in ('yasmim', 'thiago'));

-- RLS: permite leitura/escrita sem autenticação (app pessoal)
-- O filtro por usuário é feito no código (JavaScript) via .eq('usuario', usuario)
alter table public.roupas drop policy if exists "allow all roupas";
create policy "allow all roupas" on public.roupas for all using (true) with check (true);

alter table public.looks drop policy if exists "allow all looks";
create policy "allow all looks" on public.looks for all using (true) with check (true);

alter table public.montagens drop policy if exists "allow all montagens";
create policy "allow all montagens" on public.montagens for all using (true) with check (true);
