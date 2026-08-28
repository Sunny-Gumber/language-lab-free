drop trigger if exists profiles_learning_preferences_updated_at on public.profiles;
drop function if exists public.set_learning_preferences_updated_at();

drop table if exists public.language_progress;
drop table if exists public.study_activity;

alter table public.profiles
  drop column if exists total_xp,
  drop column if exists current_streak,
  drop column if exists longest_streak,
  drop column if exists last_study_date,
  drop column if exists selected_language,
  drop column if exists learning_preferences_updated_at;
