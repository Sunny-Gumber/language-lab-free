# Language Lab Free

**A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.**

Language Lab Free is a free, mobile-first browser/PWA learning project hosted on GitHub Pages. Guest learning works without an account; optional sign-in can synchronize supported data through Supabase.

## Languages and current depth

**Deepening reference paths**

- 🇯🇵 Japanese
- 🇨🇳 Mandarin Chinese

These two courses contain the deepest staged curriculum and are where the zero-to-advanced learning model is being developed and tested.

**Foundation courses**

- Korean
- English
- Hindi
- Spanish
- French
- German
- Arabic
- Portuguese

The eight foundation courses use the same learning engine but should not yet be described as equally deep.

## V14 — integrated learning flow

V14 changes the normal Journey from a sequence of isolated item screens into a connected unit experience.

```text
Mission / can-do goal
      ↓
Model conversation / connected input
      ↓
Learn useful forms
      ↓
Retrieve from memory
      ↓
Connected reading when available
      ↓
Free-response scenario
      ↓
Stage checkpoint when applicable
      ↓
Weak material returns later
```

### Why this changed

Finishing flashcards is not the same as learning a language. V14 tries to connect vocabulary, grammar, script, listening, reading and production around situations the learner can actually use.

A selected target may therefore appear several ways:

```text
sound
  ↕
script / Kanji / Hanzi
  ↕
reading / Romaji / Pinyin
  ↕
meaning
  ↕
grammar or usage
  ↕
dialogue
  ↕
reading
  ↕
retrieval
  ↕
free response
```

## Adaptive target selection

The existing adaptive planner still mixes review and new targets:

- no scored history: **0 review + 3 new**
- recent accuracy below 60%: **4 review + 1 new**
- recent accuracy 60–79%: **3 review + 2 new**
- recent accuracy 80%+: **2 review + 3 new**

Due and weak targets receive higher review priority. Wrong retrieval can make a target return later in the same session.

During the current V14 test phase, **all units are directly accessible** so later Japanese/Mandarin content and interactions can be tested without manufacturing earlier progress.

## Speaking: fixed target vs free response

V14 deliberately separates two different things.

### Fixed-target speaking

When the learner is asked to say a specific form, browser speech recognition can compare the transcript against authored accepted forms.

For Japanese, one target can legitimately accept forms such as:

```text
犬
いぬ
イヌ
```

Course data supports:

- `native`
- `kanjiForm`
- `speechForms`
- `speechAliases`

The speech engine uses those authored forms rather than requiring one hard-coded surface string.

### Open/free response

When a task allows many natural answers, Language Lab does **not** assign a fake percentage because the learner did not copy one model sentence.

The browser can display the recognized transcript and record that production practice happened, but true semantic conversation assessment is a separate future capability.

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
- data-driven Kanji/Kana speech transcript equivalence

The next major curriculum work is to integrate Kanji directly into elementary+ vocabulary/grammar examples and increase content density, especially in upper/advanced stages.

## Mandarin scaffolding

Mandarin currently combines:

- Pinyin and four-tone foundations
- Hanzi
- staged grammar and vocabulary
- connected dialogue and reading in richer units
- Pinyin scaffolding that can fade
- Hindi/Devanagari pronunciation guidance with tone markers

A dedicated tone-pair drill and deeper intermediate grammar practice remain planned improvements.

## Main navigation

- **Journey** — recommended integrated learning session
- **Practice** — focused listening, shadowing and fixed-target speaking
- **Review** — weak/due material, recall and recognition
- **Explore** — lesson notes, guide, vocabulary and writing
- **Progress** — learning evidence and course progress

Journey is the normal entry point.

## Current runtime architecture

The application uses browser ES modules under `src/`:

- `src/app.js` — bootstrap and coordination
- `src/data.js` — normalized course/stage/target data and accepted speech forms
- `src/session.js` — adaptive review/new target selection
- `src/learning-flow.js` — **V14 integrated unit-experience planner**
- `src/journey-v14.js` — **V14 Journey renderer and interaction engine**
- `src/practice.js` — focused listening/speaking practice
- `src/pronunciation-hi.js` — Japanese/Mandarin Hindi pronunciation guidance
- `src/learning.js` — derived learning evidence, review signals, mastery and XP feedback
- `src/event-db.js` — IndexedDB learning-event persistence
- `src/store.js` — scoped local state
- `src/cloud.js` — optional auth/Supabase synchronization
- `src/audio.js` — browser TTS and device voice selection
- `src/course.js` — detailed notes, vocabulary, cards, quiz, writing and progress
- `src/home.js` — first-visit experience and returning learner dashboard
- `src/auth-ui.js` — optional account UX
- `src/writing.js` — touch/stylus/mouse writing pad
- `src/utils.js` — shared helpers and speech matching

V7/V8/V9 JavaScript files remain **content-authoring layers**, not the active runtime architecture.

## Local, cloud and offline behavior

Local:

- `localStorage` — small scoped UI/preferences, positions and V14 activity-resume metadata
- IndexedDB — append-oriented learning events

Optional Supabase:

- `profiles`
- `learning_events`
- `course_positions`

The service worker cache `language-lab-free-v14-0` includes the V14 Journey, integrated planner, pronunciation support and required runtime assets for offline startup of an already-installed app.

## Important limitations

Language Lab Free is still in active development.

- Japanese/Mandarin `advanced` stages are **internal curriculum stages**, not an official JLPT/HSK guarantee.
- The current content volume is **not yet enough to claim true zero-to-certified-advanced proficiency**.
- Browser speech matching is transcript matching, **not** phoneme-level pronunciation, accent, Japanese pitch-accent or Mandarin tone grading.
- Free-response scenarios do not yet semantically grade arbitrary answers.
- Longer natural multi-speaker listening needs much more content.
- Japanese Kanji integration needs to be expanded through elementary and later stages.
- Mandarin still needs dedicated tone-pair practice.
- Writing practice does not yet judge character shape or stroke order with AI.
- Review scheduling remains a lightweight interval model rather than full FSRS.
- The other eight languages remain foundation courses.

These limitations are intentional product statements, not hidden behind “advanced” marketing.

## Development checks

```bash
npm run ci
npm run e2e
```

The test suite covers Node/runtime checks plus representative desktop, Android, iPhone, account/Guest, IndexedDB and PWA/offline flows.

## Hosting

GitHub Pages publishes production from `main`.

Expected site: `https://sunny-gumber.github.io/language-lab-free/`

## Branch workflow

- `main` — production
- feature/hotfix branches — development and validation through pull requests

## License

MIT