-- Debts table
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  direction text not null check (direction in ('i_owe', 'they_owe')),
  person_name text not null,
  amount decimal(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'JOD')),
  reason text,
  due_date date,
  status text not null default 'active' check (status in ('active', 'paid', 'overdue')),
  paid_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_debts_user on public.debts(user_id, status);
create index idx_debts_due on public.debts(user_id, due_date);

alter table public.debts enable row level security;

create policy "Users can view own debts" on public.debts for select using (auth.uid() = user_id);
create policy "Users can insert own debts" on public.debts for insert with check (auth.uid() = user_id);
create policy "Users can update own debts" on public.debts for update using (auth.uid() = user_id);
create policy "Users can delete own debts" on public.debts for delete using (auth.uid() = user_id);

create trigger debts_updated_at
  before update on public.debts
  for each row execute function public.update_updated_at();
