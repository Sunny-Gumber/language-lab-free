# Language Lab Free

Free, mobile-first multi-language learning platform hosted on GitHub Pages with optional Supabase account sync.

## Languages

Japanese, Mandarin Chinese, Korean, English, Hindi, Spanish, French, German, Arabic, and Portuguese.

## V12 home experience

The home page has two product states instead of showing an empty learner dashboard to everybody:

- **New visitor / new learner** — sees a landing-and-start experience with a small interactive listening demo, clear language selection, how-it-works steps, product benefits, honest course-depth information and a no-account-required CTA.
- **Returning learner** — after the first real practice event, the same home page becomes the dashboard with Continue Learning, Today's Practice, XP goal, streak, reviews and course progress.

## V13.1 adaptive learning journey

The internal course now behaves like a guided learning system rather than a collection of equal tools.

Primary navigation is:

- **Journey** — recommended learning path and adaptive mixed sessions
- **Practice** — focused listening/speaking work for introduced material
- **Review** — weak/due material, recall cards and recognition checks
- **Explore** — full lesson notes, language guide, vocabulary and optional writing
- **Progress** — skill and course progress

Normal language entry opens Journey. Each guided activity follows a research-informed sequence:

1. **Context** — understand the goal or foundation skill.
2. **Listen** — hear the language before relying on text.
3. **Understand** — connect sound, form and meaning.
4. **Check** — complete an interpretive listening/recognition check.
5. **Recall** — retrieve the language from meaning without being shown first.
6. **Use** — say it in a small task or produce the foundation form from memory.
7. **Complete** — record evidence, schedule weak material to return, and continue.

Journey sessions mix old and new material instead of treating a completed unit as permanently learned. The planner looks at recent scored practice:

- no history: **0 review + 3 new**
- recent accuracy below 60%: **4 review + 1 new**
- recent accuracy 60–79%: **3 review + 2 new**
- recent accuracy 80%+: **2 review + 3 new**

Due and weak targets are prioritised for review. Wrong choices are stored as learning evidence, can return as future distractors, and a difficult target is inserted again later in the same session rather than being treated as mastered after one pass.

Later units unlock from real practice coverage + active mastery, not XP. Supporting tools remain available through Review/Explore, so progression guides the learner without hiding the rest of the course.

### Language-specific progression

The Journey framework is shared, but scaffolding is language-aware:

- **Japanese** — sound foundations first, useful greetings/self-introduction appear early, kana is interleaved with communication, and romanization fades after listening/recognition becomes stronger.
- **Mandarin** — tones/Pinyin remain the first foundation, basic questions and greetings come before character-heavy study, and Pinyin support gradually fades as recognition improves.
- **Korean** — useful phrases and Hangul recognition develop together.
- **Arabic/RTL courses** — spoken chunks and right-to-left script familiarity progress together.
- **Latin-script languages** — move into useful phrases and communication sooner because extensive script training is unnecessary.

## Learning experience

- Context → input → retrieval → speaking/use → spaced return
- Adaptive old/new session mixing
- Mistake-driven retry and confusion memory
- Progressive Journey for a new language
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
- `src/data.js` — normalized course data, structural target IDs, curriculum ordering and stage-aware targets
- `src/session.js` — adaptive review/new ratio, due/weak target selection, mistake memory and language-specific scaffolding
- `src/audio.js` — TTS and device voice selection
- `src/practice.js` — listening, shadowing, speak-from-meaning and stage-aware conversation practice
- `src/course.js` — detailed lesson notes, guide, writing, vocabulary, cards, quiz and progress
- `src/journey.js` — unit readiness, adaptive guided session player, Review and Explore hubs
- `src/home.js` — V12 first-visit experience plus returning learner dashboard
- `src/auth-ui.js` — sign-in, onboarding, Guest import and language management
- `src/writing.js` — touch/stylus/mouse practice pad
- `src/utils.js` — shared pure utilities
- `home-v12.css` — first-visit/returning-home presentation rules
- `journey-v13.css` — progressive internal-course and guided-session presentation rules

The historical runtime monkey-patching, cloned-button overrides, periodic position writer and snapshot MAX merge are gone. V7/V8/V9 files that remain are course-content authoring layers only.

## Local and cloud data

Local:

- `localStorage` stores small account/Guest preferences, UI state, sync cursor and course-position metadata.
- IndexedDB stores the append-oriented learning-event history so event growth does not consume localStorage quota.

Supabase:

- `profiles` — account metadata and learning preferences
- `learning_events` — practice/favorite/reset events with unique UUIDs and flexible learning metadata
- `course_positions` — exact last unit/item per language plus a client update timestamp

Normal cloud reconciliation fetches learning events incrementally from the last server `created_at` cursor rather than downloading the complete event ledger each time. Event UUIDs provide deduplication.

RLS restricts authenticated users to their own rows. The browser publishable Supabase key is intentionally public; service-role keys and database passwords must never be committed.

## Progress and learning rules

- Passive audio playback and the homepage demo do **not** award XP or mastery.
- Active attempts generate learning events.
- Guided listening/check records listening + recognition evidence.
- Reverse retrieval records recall evidence.
- Browser speech recognition can record assessed transcript-match evidence; manual speaking is **unscored practice coverage** and no longer lowers mastery as a fake 0% attempt.
- Same/lower repeated scored attempts on the same target/skill/day do not award more local XP.
- Derived XP groups target + skill + day and counts the best XP delta, reducing duplicate multi-device XP.
- Writing records effort/coverage, not fabricated handwriting accuracy.
- Unit mastery uses assessed listening, speaking, recognition and recall evidence; writing is excluded until real writing assessment exists.
- A next unit unlocks only after enough practice coverage and readiness; XP alone cannot unlock it.
- Wrong guided answers set a retry signal and preserve the selected/correct answer as mistake metadata.
- Spaced review prioritises due/weak earlier material inside later sessions.
- Reset is append-only: a reset event invalidates older course events without deleting the reset marker from cloud history.
- Course-position conflict handling keeps the newest `client_updated_at` value.
- Preference sync tracks dirty fields independently instead of pushing a full stale preference snapshot.
- Daily streaks use one local-calendar date implementation.

## Target IDs and content stages

Learning target IDs are structural (`language → unit title/key → item key/roman/native`) instead of hashes of visible translations or raw list positions. Reordering a curriculum therefore does not automatically renumber every learning target. Content authors can still supply explicit `key` / `authorId` values for long-term stability.

Practice vocabulary and lesson targets are filtered by stage. Legacy vocabulary without explicit stage metadata is inferred conservatively; future content should set `stageId` explicitly. Curated conversation mode is shown only for stages that actually contain conversation content.

## Offline behavior

The service worker caches the local application shell, home/Journey styles and modules, the adaptive session engine, and a pinned Supabase browser runtime while leaving Supabase API/auth requests uncached. This allows an already-installed app to start offline without losing the learning runtime because a CDN dependency is unavailable.

## Important limitations

- Browser speech scoring compares recognized text with the target. It is **not phoneme-level pronunciation, accent or Mandarin tone scoring**.
- Writing does **not** validate stroke shape/order with AI yet.
- Browser TTS quality and male/female voice identification vary by browser/OS.
- Review scheduling is a lightweight interval model, not full FSRS.
- Many unit Can-Do statements are currently derived from authored unit goals; the strongest future content improvement is explicit `canDo`, scenario/context and branching-task metadata for every unit.
- Mandarin still needs dedicated tone-pair discrimination exercises beyond the general listening/recall Journey.
- Japanese/Mandarin advanced labels describe the internal learning path, not official JLPT/HSK certification.
- Japanese and Mandarin have the deepest paths; the other eight currently remain foundation courses.

## Development checks

```bash
npm run ci
npm run e2e
```

CI covers syntax/module/DOM/PWA checks plus Playwright desktop Chromium, Android emulation, iPhone WebKit emulation, adaptive Journey behavior, recall/retry progression, mocked account/cross-device flows, Guest import, IndexedDB persistence, first-visit → dashboard transition and a service-worker offline start test.

## Hosting

GitHub Pages publishes production from `main` → `/ (root)`.

Expected site: `https://sunny-gumber.github.io/language-lab-free/`

## Branch workflow

- `main` — production
- feature/hotfix branches — start from current `main`, validate through pull requests and CI

## License

MIT
