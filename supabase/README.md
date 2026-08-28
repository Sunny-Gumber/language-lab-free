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

Older migrations remain in migration history so a database can be reproduced chronologically. The V11 contract migration removes the obsolete `language_progress` and `study_activity` tables plus snapshot XP/streak/selected-language profile columns. The active application no longer carries the old snapshot progress model.

## Migration order

Apply the files in `supabase/migrations/` in chronological order. The V11 additions are:

- `20260827_v11_event_learning_model.sql`
- `20260828_v11_course_positions.sql`
- `20260828_v11_remove_legacy_progress_schema.sql`
