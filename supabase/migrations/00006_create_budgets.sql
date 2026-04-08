-- Budgets table
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  amount decimal(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'JOD')),
  period text not null default 'monthly' check (period in ('monthly', 'weekly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- category_id NULL means total/overall budget
  unique(user_id, category_id)
);

create index idx_budgets_user_id on public.budgets(user_id);

-- RLS
alter table public.budgets enable row level security;

create policy "Users can view own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

create trigger budgets_updated_at
  before update on public.budgets
  for each row execute function public.update_updated_at();
