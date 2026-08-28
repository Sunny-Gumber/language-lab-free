create table if not exists public.course_positions (
  user_id uuid not null references auth.users(id) on delete cascade,
  language_code text not null,
  unit_index integer not null default 0 check (unit_index >= 0),
  item_index integer not null default 0 check (item_index >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, language_code)
);

alter table public.course_positions enable row level security;

drop policy if exists course_positions_select_own on public.course_positions;
drop policy if exists course_positions_insert_own on public.course_positions;
drop policy if exists course_positions_update_own on public.course_positions;
drop policy if exists course_positions_delete_own on public.course_positions;

create policy course_positions_select_own on public.course_positions
  for select using (auth.uid() = user_id);
create policy course_positions_insert_own on public.course_positions
  for insert with check (auth.uid() = user_id);
create policy course_positions_update_own on public.course_positions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy course_positions_delete_own on public.course_positions
  for delete using (auth.uid() = user_id);

drop trigger if exists course_positions_set_updated_at on public.course_positions;
create trigger course_positions_set_updated_at
before update on public.course_positions
for each row execute function public.set_updated_at();
