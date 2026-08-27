-- Language Lab Free V5.3 — fields required for account progress sync
alter table public.profiles
  add column if not exists selected_language text;

alter table public.language_progress
  add column if not exists xp integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'language_progress_xp_nonnegative'
  ) then
    alter table public.language_progress
      add constraint language_progress_xp_nonnegative check (xp >= 0);
  end if;
end
$$;
