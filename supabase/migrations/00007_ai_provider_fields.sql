-- Add multi-provider AI fields to profiles
alter table public.profiles
  add column if not exists ai_provider text not null default 'openai'
    check (ai_provider in ('openai', 'anthropic', 'gemini')),
  add column if not exists openai_api_key text,
  add column if not exists gemini_api_key text;

-- AI category overrides (learning from user corrections)
create table public.ai_category_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  keyword text not null,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, keyword)
);

create index idx_ai_overrides_user_keyword on public.ai_category_overrides(user_id, keyword);

-- RLS
alter table public.ai_category_overrides enable row level security;

create policy "Users can view own overrides"
  on public.ai_category_overrides for select
  using (auth.uid() = user_id);

create policy "Users can insert own overrides"
  on public.ai_category_overrides for insert
  with check (auth.uid() = user_id);

create policy "Users can update own overrides"
  on public.ai_category_overrides for update
  using (auth.uid() = user_id);

create policy "Users can delete own overrides"
  on public.ai_category_overrides for delete
  using (auth.uid() = user_id);
