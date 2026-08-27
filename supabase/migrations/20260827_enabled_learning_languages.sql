alter table public.profiles
  add column if not exists enabled_languages text[] not null default '{}'::text[];

update public.profiles
set enabled_languages = array[selected_language]
where coalesce(array_length(enabled_languages,1),0)=0
  and selected_language is not null;
