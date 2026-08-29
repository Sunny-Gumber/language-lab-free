# Language Lab Free

Free, mobile-first multi-language learning platform hosted on GitHub Pages with optional Supabase account sync.

## Languages

Japanese, Mandarin Chinese, Korean, English, Hindi, Spanish, French, German, Arabic, and Portuguese.

## V12 home experience

The home page has two product states instead of showing an empty learner dashboard to everybody:

- **New visitor / new learner** — sees a landing-and-start experience with a small interactive listening demo, clear language selection, how-it-works steps, product benefits, honest course-depth information and a no-account-required CTA.
- **Returning learner** — after the first real practice event, the same home page becomes the dashboard with Continue Learning, Today's Practice, XP goal, streak, reviews and course progress.

## V13 progressive learning experience

The internal course experience is designed around a gradual learning journey instead of exposing every tool as an equal first step.

Primary course navigation is now:

- **Journey** — the recommended next unit and guided beginner flow
- **Practice** — adaptive listening/speaking practice for already introduced material
- **Review** — weak/due material, recall cards and recognition checks
- **Explore** — full lesson notes, language guide, vocabulary and optional writing tools
- **Progress** — skill and course progress

Normal language entry opens Journey. A new learner starts with Unit 1 and learns one item through a small sequence:

1. **Listen** before reading the answer.
2. **Understand** the form, meaning and pronunciation note.
3. **Check** comprehension with an active listening/recognition question.
4. **Speak** the item aloud, optionally using browser speech recognition.
5. **Complete** the item and continue gradually.

Later units begin locked and unlock from real unit evidence rather than XP. The readiness calculation combines how much of the unit has actually been practised with assessed active mastery. This is a soft curriculum gate: supporting tools remain available through Explore/Review even when a later guided unit is not recommended yet.

## Learning experience

- Listen-first and speak-early practice
- Progressive Journey for new-language learning
- Browser text-to-speech with Auto / female-preferred / male-preferred / exact-device voice choice
- Browser speech-recognition practice where supported
- Japanese and Mandarin staged beginner → advanced-topic curriculum paths
- Foundation courses for the other eight languages
- Reading, vocabulary, phrase building, flashcards, quizzes and writing practice
- Communication-weighted assessed mastery: Listening 40%, Speaking 30%, Recognition 15%, Recall 10%; writing is tracked separately as practice coverage until real handwriting assessment exists
- Time-aware review scheduling
- First-login primary-language + audio onboarding
- Signed-in My Languages view with add / remove / make-primary controls
- One-time Guest → account progress import
- Offline-capable PWA shell

## Architecture

The application runtime is split into ES modules under `src/`:

- `src/app.js` — bootstrap and render coordination
- `src/store.js` — scoped preferences/UI state, exact positions and in-memory event view
- `src/event-db.js` — IndexedDB persistence for learning events
- `src/cloud.js` — Google auth, incremental Supabase event sync, preference sync, positions and Realtime
- `src/learning.js` — event-derived XP, streak, mastery, coverage and review scheduling
- `src/data.js` — normalized course data, structural target IDs and stage-aware practice targets
- `src/audio.js` — TTS and device voice selection
- `src/practice.js` — listening, shadowing, speak-from-meaning and stage-aware conversation practice
- `src/course.js` — detailed lesson notes, guide, writing, vocabulary, cards, quiz and progress
- `src/journey.js` — V13 unit readiness, progressive path, guided lesson sequence, Review and Explore hubs
- `src/home.js` — V12 first-visit experience plus returning learner dashboard
- `src/auth-ui.js` — sign-in, onboarding, Guest import and language management
- `src/writing.js` — touch/stylus/mouse practice pad
- `src/utils.js` — shared pure utilities
- `home-v12.css` — first-visit/returning-home presentation rules
- `journey-v13.css` — progressive internal-course presentation rules

The historical runtime monkey-patching, cloned-button overrides, periodic position writer and snapshot MAX merge are gone. V7/V8/V9 files that remain are course-content authoring layers only.

## Local and cloud data

Local:

- `localStorage` stores small account/Guest preferences, UI state, sync cursor and course-position metadata.
- IndexedDB stores the append-oriented learning-event history so event growth does not consume localStorage quota.

Supabase:

- `profiles` — account metadata and learning preferences
- `learning_events` — practice/favorite/reset events with unique UUIDs
- `course_positions` — exact last unit/item per language plus a client update timestamp

Normal cloud reconciliation fetches learning events incrementally from the last server `created_at` cursor rather than downloading the complete event ledger each time. Event UUIDs provide deduplication.

RLS restricts authenticated users to their own rows. The browser publishable Supabase key is intentionally public; service-role keys and database passwords must never be committed.

## Progress and unlock rules

- Passive audio playback and the homepage demo do **not** award XP or mastery.
- Active attempts generate learning events.
- Guided Journey comprehension records listening and recognition evidence; speaking records assessed transcript-match evidence when the browser supports it, otherwise speaking can be recorded only as unscored practice coverage.
- Same/lower repeated scored attempts on the same target/skill/day do not award more local XP.
- Derived XP groups target + skill + day and counts the best XP delta, preventing duplicate offline attempts from double-counting after multi-device convergence.
- Writing practice records effort/coverage, not a fabricated handwriting-accuracy percentage.
- Overall/unit mastery uses assessed communication skills only.
- A next unit unlocks only after the previous unit reaches enough practice coverage and readiness; XP alone cannot unlock it.
- Reset is append-only: a reset event invalidates older course events without deleting the reset marker from cloud history.
- Course-position conflict handling keeps the newest `client_updated_at` value.
- Preference sync tracks dirty fields independently instead of pushing a full stale preference snapshot.
- Daily streaks use one local-calendar date implementation.

## Target IDs and content stages

Learning target IDs are structural (`language → unit → item/vocabulary`) rather than hashes of visible text. This prevents different targets with identical text, such as Japanese kana/number/particle forms, from sharing mastery. Content authors can supply stable `key` / `authorId` values; index-based structural keys are the fallback.

Practice vocabulary and lesson targets are filtered by the selected stage. Legacy vocabulary without explicit stage metadata is inferred conservatively; future content should set `stageId` explicitly. Curated conversation mode is shown only for stages that actually have conversation content.

## Offline behavior

The service worker caches the local application shell, home and Journey styles/modules, and a pinned Supabase browser runtime while leaving Supabase API/auth requests uncached. This allows an already-installed app to start offline without accidentally dropping a previously signed-in browser into a different runtime because the CDN script is unavailable.

## Important limitations

- Speech scoring compares browser-recognized text with the target. It is **not phoneme-level pronunciation, accent or Mandarin tone scoring**.
- Writing does **not** validate stroke shape/order with AI yet.
- Browser TTS quality and male/female voice identification vary by browser/OS.
- Review scheduling is a lightweight interval model, not a full FSRS implementation.
- Japanese/Mandarin advanced labels describe the internal learning path, not official JLPT/HSK certification.
- Fallback structural IDs remain position-based unless content supplies an explicit `key`/`authorId`; content authors should use explicit IDs before major reordering.

## Development checks

```bash
npm run ci
npm run e2e
```

CI covers syntax/module/DOM/PWA checks plus Playwright desktop Chromium, Android emulation, iPhone WebKit emulation, guided Journey behavior, mocked account/cross-device flows, Guest import, IndexedDB persistence, first-visit → dashboard transition and a real service-worker offline shell test.

## Hosting

GitHub Pages publishes production from `main` → `/ (root)`.

Expected site: `https://sunny-gumber.github.io/language-lab-free/`

## Branch workflow

- `main` — production
- feature/hotfix branches — start from current `main`, validate through pull requests and CI

## License

MIT
