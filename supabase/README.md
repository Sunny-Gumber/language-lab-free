# Supabase foundation

V5.1 adds the cloud data foundation for Language Lab Free.

## Project
- Supabase project: `language-lab-free`
- Browser integration uses only the project URL and publishable key.
- Never commit service-role keys, database passwords, OAuth client secrets, or other private credentials.

## Tables
- `profiles` — learner profile, timezone, XP and streak summary
- `language_progress` — per-language position, mastery, favorites and quiz/writing counters
- `study_activity` — one daily activity row per learner for streak/history calculations

## Security
Row Level Security is enabled on all V5.1 tables. Authenticated users can only select/insert/update/delete rows that belong to their own `auth.uid()`.

## Frontend behavior in V5.1
Supabase is loaded as an optional cloud layer. If the SDK/network is unavailable, the existing guest/localStorage learning experience continues to work.

Authentication UI and cloud synchronization are intentionally deferred to V5.2 and V5.3.
