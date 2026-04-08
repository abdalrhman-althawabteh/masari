-- Savings goals
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  target_amount decimal(12, 2) not null check (target_amount > 0),
  target_currency text not null default 'USD' check (target_currency in ('USD', 'JOD')),
  current_amount decimal(12, 2) not null default 0,
  deadline date,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now()
);

create index idx_savings_goals_user on public.savings_goals(user_id);

alter table public.savings_goals enable row level security;

create policy "Users can view own goals" on public.savings_goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.savings_goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.savings_goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on public.savings_goals for delete using (auth.uid() = user_id);

-- Savings contributions
create table public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount decimal(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'JOD')),
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_contributions_goal on public.savings_contributions(goal_id);

alter table public.savings_contributions enable row level security;

create policy "Users can view own contributions" on public.savings_contributions for select using (auth.uid() = user_id);
create policy "Users can insert own contributions" on public.savings_contributions for insert with check (auth.uid() = user_id);
create policy "Users can delete own contributions" on public.savings_contributions for delete using (auth.uid() = user_id);
