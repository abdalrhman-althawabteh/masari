-- Subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  amount decimal(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'JOD')),
  category_id uuid not null references public.categories(id) on delete restrict,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly', 'weekly', 'custom')),
  billing_day integer check (billing_day >= 1 and billing_day <= 31),
  next_billing_date date not null,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_next_billing on public.subscriptions(user_id, next_billing_date);
create index idx_subscriptions_status on public.subscriptions(user_id, status);

-- RLS
alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on public.subscriptions for delete
  using (auth.uid() = user_id);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();
