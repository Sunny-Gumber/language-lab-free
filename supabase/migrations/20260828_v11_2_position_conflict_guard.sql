alter table public.course_positions
  add column if not exists client_updated_at timestamptz not null default now();

create or replace function public.keep_newest_course_position()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.client_updated_at < old.client_updated_at then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists course_positions_keep_newest on public.course_positions;
create trigger course_positions_keep_newest
before update on public.course_positions
for each row execute function public.keep_newest_course_position();

create index if not exists course_positions_user_client_updated_idx
  on public.course_positions (user_id, client_updated_at desc);
