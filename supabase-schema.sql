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
