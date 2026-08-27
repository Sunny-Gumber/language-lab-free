# V5.2 Supabase Auth setup

Language Lab Free uses Supabase Email Magic Links for passwordless sign-in.

## Production URL

`https://sunny-gumber.github.io/language-lab-free/`

## Required Supabase dashboard settings

Open the `language-lab-free` Supabase project, then go to:

**Authentication → URL Configuration**

Set:

- **Site URL:** `https://sunny-gumber.github.io/language-lab-free/`
- **Redirect URLs:** add `https://sunny-gumber.github.io/language-lab-free/`

Keep the trailing slash.

## Email provider

Email authentication and Magic Links are enabled by default on hosted Supabase projects. V5.2 calls `supabase.auth.signInWithOtp()` with `emailRedirectTo` set to the current Language Lab Free page.

## What V5.2 does

- Continue as Guest
- Email Magic Link sign-in
- Persistent browser session
- Header account state
- Sign out
- Profile bootstrap (`profiles` table)

## Not included until V5.3

- Cloud synchronization of XP or lesson progress
- Guest-to-account progress migration
- Cross-device learning progress merge

The learning engine remains local-first and continues to work if Supabase is unavailable.
