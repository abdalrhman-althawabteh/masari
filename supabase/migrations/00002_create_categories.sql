-- Categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text,
  type text not null check (type in ('income', 'expense', 'both')),
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_categories_user_id on public.categories(user_id);
create index idx_categories_type on public.categories(user_id, type);

-- RLS
alter table public.categories enable row level security;

create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own non-default categories"
  on public.categories for delete
  using (auth.uid() = user_id and is_default = false);
