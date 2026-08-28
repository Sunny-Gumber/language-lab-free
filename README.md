# Language Lab Free

Free, mobile-first multi-language learning platform hosted on GitHub Pages with optional Supabase account sync.

## Languages

Japanese, Mandarin Chinese, Korean, English, Hindi, Spanish, French, German, Arabic, and Portuguese.

## Learning experience

- Listen-first and speak-early practice
- Browser text-to-speech with Auto / female-preferred / male-preferred / exact-device voice choice
- Browser speech-recognition practice where supported
- Japanese and Mandarin staged beginner → advanced curriculum paths
- Foundation courses for the other eight languages
- Reading, vocabulary, phrase building, flashcards, quizzes and writing practice
- Five-skill model weighted toward communication: Listening 40%, Speaking 30%, Recognition 15%, Recall 10%, Writing 5%
- Skill mastery + coverage instead of a single inflated percentage
- Time-aware review scheduling based on recent practice and mastery
- First-login primary-language + audio onboarding
- Signed-in My Languages view with add / remove / make-primary controls
- Guest mode with separate device-local state
- Offline-capable PWA shell

## V11 architecture

V11 replaces the historical V6/V8/V9/V10 runtime patch stack with ES modules under `src/`:

- `src/app.js` — application bootstrap and render coordination
- `src/store.js` — account/guest local state, preferences, exact course position and event queue
- `src/cloud.js` — Google auth, Supabase event sync, preferences, exact course-position sync and Realtime
- `src/learning.js` — event-derived XP, streak, mastery, coverage and review scheduling
- `src/data.js` — normalized course access and stable learning-target IDs
- `src/audio.js` — TTS and per-device voice selection
- `src/practice.js` — listening, shadowing, speak-from-meaning and conversation practice
- `src/course.js` — lessons, guide, writing, vocabulary, cards, quiz and progress
- `src/home.js` — dashboard, daily mission and My Languages rendering
- `src/auth-ui.js` — sign-in, onboarding and language management
- `src/writing.js` — touch/stylus/mouse practice pad
- `src/utils.js` — shared pure utilities

The old runtime monkey-patching, cloned-button overrides, periodic position writer, snapshot MAX merge and runtime CSS injection have been removed.

The V7/V8/V9 files that remain are **course-content authoring layers only**. They no longer patch application behavior.

## Cloud model

Supabase stores:

- `profiles` — account metadata and learning preferences
- `learning_events` — append-oriented practice/favorite/reset events with unique UUIDs
- `course_positions` — exact last unit/item per language

XP, streaks, mastery, coverage and review state are derived from learning events instead of being treated as authoritative counters. Independent offline events can therefore coexist and sync without the old `MAX(local, cloud)` loss problem.

RLS restricts each authenticated user to their own rows. The browser publishable Supabase key is intentionally public; service-role keys and database passwords must never be committed.

## Progress rules

- Passive audio playback does **not** award XP or mastery.
- Active attempts generate learning events.
- Repeating the same or lower score on the same target/skill on the same day does not farm additional XP.
- Improved attempts can still earn XP.
- Reset markers make older course practice stop counting across devices.
- Daily streaks use one local-calendar date implementation.

## Important limitations

- Speech scoring compares browser-recognized text with the target. It is **not phoneme-level pronunciation, accent or Mandarin tone scoring**.
- Writing records meaningful drawing/practice effort. It does **not yet validate stroke shape/order with AI**.
- Browser TTS quality and available male/female voices vary by device/OS.
- Review scheduling is a lightweight V11 interval model, not yet a full FSRS implementation.
- Japanese/Mandarin advanced labels describe the internal learning path, not official JLPT/HSK certification.

## Development checks

No build step is required for GitHub Pages. Node is used for repository checks:

```bash
npm run ci
```

CI checks JavaScript syntax, module references, service-worker assets, PWA files, removal of legacy runtime references and core utility behavior.

## Hosting

GitHub Pages publishes directly from `main` → `/ (root)`.

Expected site:

`https://sunny-gumber.github.io/language-lab-free/`

## Branch workflow

- `main` — production
- feature/hotfix branches — start from current `main`, merge through pull requests

## License

MIT
