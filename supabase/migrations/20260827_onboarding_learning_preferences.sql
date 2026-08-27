alter table public.profiles
  add column if not exists audio_preference text not null default 'auto',
  add column if not exists onboarding_completed boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_audio_preference_check;

alter table public.profiles
  add constraint profiles_audio_preference_check
  check (audio_preference in ('auto','female','male'));
