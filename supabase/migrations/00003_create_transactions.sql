-- Transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount decimal(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'JOD')),
  category_id uuid not null references public.categories(id) on delete restrict,
  description text not null,
  source text,
  date date not null default current_date,
  is_subscription boolean not null default false,
  subscription_id uuid,
  created_via text not null default 'app' check (created_via in ('app', 'telegram')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_transactions_user_date on public.transactions(user_id, date desc);
create index idx_transactions_user_type on public.transactions(user_id, type);
create index idx_transactions_user_category on public.transactions(user_id, category_id);

-- RLS
alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.update_updated_at();
