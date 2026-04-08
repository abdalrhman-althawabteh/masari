-- Reports log table
create table public.reports_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('weekly', 'monthly')),
  sent_at timestamptz not null default now(),
  email_subject text not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error_message text
);

create index idx_reports_log_user on public.reports_log(user_id, type, sent_at desc);

alter table public.reports_log enable row level security;

create policy "Users can view own reports"
  on public.reports_log for select
  using (auth.uid() = user_id);
