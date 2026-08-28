# Supabase schema

Language Lab Free uses Supabase for signed-in account preferences and additive learning-event synchronization.

## Active V11 tables

- `profiles` — display metadata, timezone, primary/enabled languages, audio preference, daily XP goal and onboarding state
- `learning_events` — unique practice/favorite/reset events used to derive XP, streak, mastery, coverage and review state
- `course_positions` — exact last unit/item for each language

## Security

Row Level Security is enabled on V11 user-owned tables. Policies restrict reads and writes to rows where `auth.uid()` matches `user_id` (or the profile `id`).

The frontend contains only the Supabase project URL and publishable browser key. Never commit a service-role key, database password or OAuth client secret.

## Historical schema

Older migrations for `language_progress` and `study_activity` remain in migration history so an existing project can reproduce its schema safely. The V11 frontend no longer uses those tables. A later contract migration can remove them after all clients have moved to V11.

## Migration order

Apply the files in `supabase/migrations/` in chronological order. The V11 additions are:

- `20260827_v11_event_learning_model.sql`
- `20260828_v11_course_positions.sql`
