# Language Lab Free

**A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.**

Language Lab Free is a free, mobile-first browser/PWA project hosted on GitHub Pages. Guest learning works without an account; optional sign-in can synchronize supported data through Supabase.

## Languages and current depth

**Deepening reference paths**

- 🇯🇵 Japanese
- 🇨🇳 Mandarin Chinese

**Foundation courses**

- Korean
- English
- Hindi
- Spanish
- French
- German
- Arabic
- Portuguese

Japanese and Mandarin are the reference courses for deeper curriculum design. The other eight languages use the same learning platform but should not yet be described as equally deep.

## V15.1 — typed, interleaved Journey planning

V15.1 keeps the connected Journey introduced in V14, but removes the old assumption that every newly shown target should be tested immediately on the very next screen.

```text
Mission / can-do goal
        ↓
Model conversation / connected input
        ↓
Adaptive target selection
        ↓
┌──────────────────────────────────────┐
│ Review target → retrieve first       │
│ New target → introduce              │
│              → another activity      │
│              → retrieve from memory  │
└──────────────────────────────────────┘
        ↓
Connected reading when available
        ↓
Free-response scenario
        ↓
Stage checkpoint when applicable
        ↓
Weak material can return again
```

The aim is simple: **retrieval should require memory, not immediate copying**.

For normal multi-target sessions, a new target is separated from its first retrieval by at least one other learning activity. If a session genuinely contains only one usable target and no meaningful intervening activity exists, the planner marks that retrieval as `spacingLimited` rather than manufacturing filler content.

Previously seen review targets are different: the learner is asked to retrieve them before being re-taught. Wrong retrieval can still schedule a same-session retry.

## Typed activity planning

`src/activity-engine.js` is now the active planning seam between adaptive target selection and the existing Journey renderer.

Every planned step carries a canonical V15 activity type, for example:

```text
mission
model-dialogue
concept-intro
fixed-retrieval
reading
free-speaking
checkpoint
complete
```

During migration, the same activity also carries a temporary renderer alias understood by `src/journey-v14.js`:

```text
concept-intro    → learn
fixed-retrieval  → retrieve
model-dialogue   → dialogue
free-speaking    → scenario
```

This keeps one working Journey while the data/planning model evolves. It avoids creating a second parallel `journey-v15.js` runtime just to change pedagogy.

## V15 Course Pack foundation

V15 also separates **course authoring data** from runtime implementation through the Course Pack contract introduced in the previous foundation step.

```text
Existing V7/V8/V9 content
        ↓
src/data.js normalization
        ↓
src/course-pack.js
        ↓
Course Pack
  ├─ stages
  ├─ concepts
  ├─ units
  └─ typed activity templates
```

The migration compiler deliberately reuses existing normalization so stable target IDs and authored speech-form equivalence are preserved. Existing item/vocabulary IDs become V15 concept IDs instead of creating a second learning identity.

Japanese and Mandarin are the first reference packs. Generated Course Pack JSON remains a migration/debug artifact; native authored Course Packs are not yet the browser runtime source of truth.

See `course-packs/README.md` for the data contract and migration rules.

## Adaptive target selection

The adaptive session mix remains:

- no scored history: **0 review + 3 new**
- recent accuracy below 60%: **4 review + 1 new**
- recent accuracy 60–79%: **3 review + 2 new**
- recent accuracy 80%+: **2 review + 3 new**

Due and weak targets receive higher review priority. V15.1 changes **how selected targets are ordered inside the learning experience**, not the identity of those targets or the existing learning-event ledger.

During the current test phase, all units remain directly accessible so later Japanese/Mandarin content can be evaluated without manufacturing progress history.

## Speaking: fixed target vs free response

Language Lab deliberately separates fixed-target speech from open production.

### Fixed-target speaking

When the learner is asked to say a specific form, browser speech recognition can compare the transcript against authored accepted forms.

For Japanese, one target can legitimately accept forms such as:

```text
犬
いぬ
イヌ
```

Course data supports `native`, `kanjiForm`, `speechForms`, and `speechAliases`.

Transcript matching is still **text-recognition evidence**, not phoneme-level pronunciation, Japanese pitch-accent, accent, or Mandarin tone grading.

### Open/free response

When a task allows many natural answers, Language Lab does **not** assign a fake percentage because the learner did not copy one model sentence.

The browser may capture what it heard and record that production practice happened. Genuine semantic conversation assessment is a separate capability.

## Japanese scaffolding

Japanese currently combines:

- sound foundations
- Hiragana and Katakana
- practical grammar and vocabulary
- staged Kanji focus
- connected dialogue and reading in richer units
- polite/casual/formal topics in later stages
- Romaji scaffolding that can fade with recognition
- Hindi/Devanagari pronunciation support
- data-driven Kanji/Kana/Katakana speech equivalence

The next major curriculum work is to integrate Kanji directly into elementary+ vocabulary/grammar examples and increase content density, especially in upper/advanced stages.

## Mandarin scaffolding

Mandarin currently combines:

- Pinyin and four-tone foundations
- Hanzi
- staged grammar and vocabulary
- connected dialogue and reading in richer units
- Pinyin scaffolding that can fade
- Hindi/Devanagari pronunciation guidance with tone markers

Dedicated tone-pair drills and deeper intermediate grammar practice remain planned improvements.

## Main navigation

- **Journey** — recommended integrated learning session
- **Practice** — focused listening, shadowing and fixed-target speaking
- **Review** — weak/due material, recall and recognition
- **Explore** — lesson notes, guide, vocabulary and writing
- **Progress** — learning evidence and course progress

Journey is the normal entry point.

## Current runtime architecture

The browser runtime uses ES modules under `src/`:

- `src/app.js` — bootstrap and coordination
- `src/data.js` — normalized course/stage/target data and accepted speech forms
- `src/session.js` — adaptive review/new target selection
- `src/course-pack.js` — V15 Course Pack schema/compiler/typed activity registry
- `src/activity-engine.js` — **V15.1 typed/interleaved activity planner**
- `src/learning-flow.js` — assembles unit context and delegates target ordering to the activity engine
- `src/journey-v14.js` — active Journey renderer/interaction engine during migration
- `src/practice.js` — focused listening/speaking practice
- `src/pronunciation-hi.js` — Japanese/Mandarin Hindi pronunciation support
- `src/learning.js` — event-indexed learning evidence, review signals, mastery and XP feedback
- `src/event-db.js` — IndexedDB learning-event persistence
- `src/store.js` — scoped local state
- `src/cloud.js` — optional auth/Supabase synchronization
- `src/audio.js` — browser TTS and device voice selection
- `src/course.js` — lesson notes, vocabulary, cards, quiz, writing and progress
- `src/home.js` — first-visit and returning-learner dashboard
- `src/auth-ui.js` — optional account UX
- `src/writing.js` — touch/stylus/mouse writing pad
- `src/utils.js` — shared helpers and speech matching

V7/V8/V9 JavaScript files remain temporary content-authoring layers during Course Pack parity work. The goal is to remove them after native Course Packs and the runtime cutover are proven, not maintain permanent dual authoring systems.

## Local, cloud and offline behavior

Local:

- `localStorage` — small scoped UI/preferences and Journey resume metadata
- IndexedDB — append-oriented learning events

Optional Supabase:

- `profiles`
- `learning_events`
- `course_positions`

The service-worker cache is `language-lab-free-v15-1`. It includes the active Journey plus `course-pack.js`, `activity-engine.js`, `learning-flow.js`, pronunciation support and the other required runtime assets so an already-installed PWA can start offline.

## Important limitations

Language Lab Free is still in active development.

- Japanese/Mandarin `advanced` stages are **internal curriculum stages**, not official JLPT/HSK guarantees.
- Current content volume is **not enough to claim zero-to-certified-advanced proficiency**.
- Browser speech matching is transcript matching, not phoneme/accent/pitch-accent/tone grading.
- Free-response scenarios do not yet semantically grade arbitrary answers.
- Longer natural multi-speaker listening needs more authored content.
- Japanese Kanji integration needs expansion through elementary and later stages.
- Mandarin still needs dedicated tone-pair practice.
- Writing practice does not yet judge character shape or stroke order with AI.
- Review scheduling remains lightweight rather than FSRS.
- The other eight languages remain foundation courses.

## Development checks

```bash
npm run ci
npm run e2e
npm run course-packs:check
```

To emit generated Japanese/Mandarin Course Packs for inspection:

```bash
npm run course-packs:build
```

Tests cover the interleaving contract, Course Pack validation, desktop/mobile browser flows, account/Guest isolation, IndexedDB persistence, pronunciation scaffolding and PWA/offline startup.

## Hosting

GitHub Pages publishes production from `main`.

Expected site: `https://sunny-gumber.github.io/language-lab-free/`

## Branch workflow

- `main` — production
- feature/hotfix branches — development and validation through pull requests

## License

MIT
