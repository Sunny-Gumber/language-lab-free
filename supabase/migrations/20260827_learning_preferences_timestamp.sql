alter table public.profiles
  add column if not exists learning_preferences_updated_at timestamptz not null default now();

update public.profiles
set learning_preferences_updated_at = coalesce(updated_at, now())
where learning_preferences_updated_at is null;

create or replace function public.set_learning_preferences_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if row(new.selected_language, new.enabled_languages, new.audio_preference, new.onboarding_completed)
     is distinct from
     row(old.selected_language, old.enabled_languages, old.audio_preference, old.onboarding_completed) then
    new.learning_preferences_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_learning_preferences_updated_at on public.profiles;
create trigger profiles_learning_preferences_updated_at
before update on public.profiles
for each row execute function public.set_learning_preferences_updated_at();
