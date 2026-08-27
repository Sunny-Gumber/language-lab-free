# Language Lab Free

Free, mobile-first multi-language learning platform hosted on GitHub Pages with optional Supabase account sync.

## Languages

Japanese, Mandarin Chinese, Korean, English, Hindi, Spanish, French, German, Arabic, and Portuguese.

## Current learning experience

- Listen-first and speak-early practice
- Browser text-to-speech with Auto / female-preferred / male-preferred / exact-device voice choice
- Browser speech-recognition practice where supported
- Japanese and Mandarin staged beginner → advanced curriculum paths
- Foundation courses for the other eight languages
- Reading, vocabulary, phrase building, flashcards, quizzes and writing practice
- Five-skill tracking: listening, speaking, recognition, recall and writing
- Skill mastery now reports course coverage so one practiced item cannot appear as 100% course mastery
- XP, streaks, weak-item review and course position
- First-login language + audio onboarding
- Signed-in “My Languages” home with add / remove / make-primary controls
- Guest mode with device-local progress
- Google sign-in with account-scoped local state and Supabase cloud sync
- Offline-capable PWA shell

## Architecture

The app remains a zero-build static website. V10 introduces shared infrastructure before further feature growth:

- `core-logic.js` — pure shared/date/merge helpers, also used by tests
- `storage-scope.js` — account/guest browser-state isolation
- `cloud-sync-v10.js` — Supabase reconciliation, preference sync and Realtime debounce
- `skills-v10.js` — five-skill mastery + coverage
- `v10-hardening.js` — compatibility protection for older V6/V8 learning layers
- `onboarding-v10.js` — account learning preferences
- `my-languages-v10.js` — primary/enabled-language management

Legacy course/content layers (`v7-content.js`, `v8-content.js`, `v9-content.js`, `v9-course-ui.js`, `v6-learning.js`, `v8-listen-speak.js`) are still present while the learning UI is migrated gradually rather than rewritten in one risky release.

## Cloud data

Supabase stores:

- user profile + primary/enabled languages + audio preference
- per-language progress/mastery/favorites/counters
- daily study activity

RLS restricts each authenticated user to their own rows. Browser publishable credentials are intentionally public; service-role keys and database passwords must never be committed.

V10 also prevents the service worker from intercepting or caching Supabase/OAuth/CDN traffic.

## Important limitations

- Speech scoring compares browser-recognized text with the target; it is **not phoneme-level pronunciation or Mandarin tone scoring**.
- Writing completion measures drawing/practice activity; it does **not yet validate stroke shape/order with AI**.
- Current cloud counters still use monotonic/MAX reconciliation. This prevents stale-device rollback but does not mathematically preserve simultaneous offline increments from multiple devices. A unique event ledger is planned as a separate data migration.
- Review scheduling is mastery-based, not yet a full FSRS/SRS scheduler.
- Japanese/Mandarin “advanced” labels describe the internal curriculum path, not official JLPT/HSK certification.

## Development checks

No build step is required for GitHub Pages. Node is used only for development checks:

```bash
npm run ci
```

This runs JavaScript syntax checks and zero-dependency regression tests for shared V10 logic. Pull requests also run the same checks through GitHub Actions.

## Hosting

GitHub Pages publishes directly from `main` → `/ (root)`.

Expected site:

`https://sunny-gumber.github.io/language-lab-free/`

## Branch workflow

- `main` — production
- feature/hotfix branches — start from current `main`, merge through pull requests

## License

MIT
