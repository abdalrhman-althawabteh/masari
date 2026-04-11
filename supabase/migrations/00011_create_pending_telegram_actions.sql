-- Stores pending Telegram actions awaiting user category confirmation via inline keyboard
create table public.pending_telegram_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  chat_id text not null,
  action_type text not null check (action_type in ('log_transaction', 'create_subscription', 'receipt')),
  payload jsonb not null,
  suggested_category_id uuid references public.categories(id),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

create index idx_pending_actions_expires on public.pending_telegram_actions(expires_at);
