alter table public.profiles
  add column if not exists primary_language text,
  add column if not exists daily_goal_xp integer not null default 30;

alter table public.profiles
  drop constraint if exists profiles_daily_goal_xp_check;

alter table public.profiles
  add constraint profiles_daily_goal_xp_check
  check (daily_goal_xp between 10 and 200);

create table if not exists public.learning_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  language_code text not null,
  target_id text not null,
  activity text not null,
  skill text,
  score smallint,
  xp_delta smallint not null default 0,
  study_date date not null,
  client_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint learning_events_skill_check check (skill is null or skill in ('listening','speaking','recognition','recall','writing')),
  constraint learning_events_score_check check (score is null or score between 0 and 100),
  constraint learning_events_xp_check check (xp_delta between 0 and 100)
);

create index if not exists learning_events_user_created_idx
  on public.learning_events (user_id, created_at desc);
create index if not exists learning_events_user_language_idx
  on public.learning_events (user_id, language_code, created_at desc);
create index if not exists learning_events_user_study_date_idx
  on public.learning_events (user_id, study_date desc);

alter table public.learning_events enable row level security;

drop policy if exists learning_events_select_own on public.learning_events;
drop policy if exists learning_events_insert_own on public.learning_events;
drop policy if exists learning_events_update_own on public.learning_events;
drop policy if exists learning_events_delete_own on public.learning_events;

create policy learning_events_select_own on public.learning_events
  for select using (auth.uid() = user_id);
create policy learning_events_insert_own on public.learning_events
  for insert with check (auth.uid() = user_id);
create policy learning_events_update_own on public.learning_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy learning_events_delete_own on public.learning_events
  for delete using (auth.uid() = user_id);
