# Architecture — Language Lab Free V14

## 1. Overview

Language Lab Free is a static, browser-based PWA hosted on GitHub Pages. V14 separates the **learning-flow planner** from the **Journey renderer** so curriculum content can be turned into connected learning experiences instead of a flat sequence of item screens.

```text
Course content (V7/V8/V9 authoring layers)
        |
        v
src/data.js
  normalizes units, stages, targets and speech forms
  caches immutable course/stage/target lookups
        |
        v
src/learning-flow.js
  builds one integrated unit experience
        |
        +--> mission
        +--> dialogue / connected input
        +--> adaptive review + new targets
        +--> retrieval
        +--> connected reading
        +--> free-response scenario
        +--> stage checkpoint
        |
        v
src/journey-v14.js
  renders and records the learner interaction
```

The application continues to use ES modules, IndexedDB, localStorage, an offline service worker and optional Supabase account synchronization.

## 2. V14 learning architecture

### `src/learning-flow.js`

This is the V14 pedagogical planning seam.

It combines the current unit, stage information, adaptive target selection from `src/session.js`, V9/V14 dialogue and reading metadata, unit production tasks, stage checkpoints and script/character focus into one ordered `experience.activities` array.

Activity types currently include:

```text
mission
 dialogue
 learn
 retrieve
 reading
 scenario
 checkpoint
 complete
```

Not every unit must contain every activity. Foundation courses can fall back to available item examples while Japanese and Mandarin can use their richer integrated content.

### `src/journey-v14.js`

The V14 Journey controller is the normal learner entry point. It renders the integrated activity list and handles mission/can-do orientation, model dialogue, target learning, active retrieval, same-session retry scheduling, connected reading, free-response production, stage checkpoints, speech-recognition capture, Journey/Review/Explore navigation and lightweight activity resume.

Open production is deliberately **not** forced against one model sentence.

### `src/session.js`

The adaptive target-selection engine remains separate from the presentation flow. It decides the review/new mix and prioritizes weak/due targets. V14 then places those targets inside richer learning activities.

V13-only helpers that no longer have a V14 caller are removed instead of being retained as compatibility code.

### `src/data.js`

In addition to structural IDs and stage targeting, `src/data.js` owns the speech-authoring contract:

```text
native
kanjiForm
speechForms
speechAliases
```

Authored equivalent forms are registered for transcript matching. This is especially important for Japanese speech recognition, where a browser may return Kanji, Hiragana or Katakana for the same spoken form.

Course data is treated as immutable after normalization. V14.0.1 therefore caches:

- course lookup by code
- available stages per course
- target/item lookup per course
- practice-target lists per course/skill/stage
- conversation items per course/stage
- all target IDs per course

This avoids rebuilding the same arrays and scanning the same curriculum on every render.

## 3. Runtime module map

- `src/app.js` — bootstrap and render coordination; imports V14 Journey.
- `src/store.js` — scoped preferences/UI state, positions, in-memory event view and event-revision invalidation.
- `src/event-db.js` — IndexedDB learning-event persistence.
- `src/cloud.js` — authentication and optional Supabase synchronization.
- `src/learning.js` — indexed event-derived XP, mastery, coverage, streak and review signals.
- `src/data.js` — course normalization, stages, stable target IDs, speech forms and immutable lookup caches.
- `src/session.js` — adaptive review/new target planner.
- `src/learning-flow.js` — V14 integrated unit-experience planner.
- `src/journey-v14.js` — V14 connected Journey UI and interaction engine.
- `src/practice.js` — focused listening/speaking practice using authored accepted speech forms.
- `src/pronunciation-hi.js` — Japanese/Mandarin Hindi pronunciation helper.
- `src/audio.js` — browser TTS and voice selection.
- `src/course.js` — detailed lesson notes, vocabulary, writing, cards and progress.
- `src/home.js` — first-visit course selection and returning dashboard.
- `src/auth-ui.js` — optional account UX.
- `src/writing.js` — touch/stylus/mouse writing pad.
- `src/utils.js` — shared utilities, speech normalization and matching.

Historical V13 Journey/resume modules, V13 Journey CSS and the V10 compatibility runtime were removed in V14.0.1. Git history is the archive; they are not maintained as parallel implementations.

## 4. Learning evidence and event indexing

Learner actions still use the existing event pipeline:

```text
learner action
  -> recordPractice()
  -> store.js event revision changes
  -> IndexedDB persistence
  -> learning.js rebuilds its derived index once
  -> subsequent target/unit/review calculations reuse that index
  -> optional incremental Supabase sync
```

`src/store.js` exposes an event revision that changes only when the learning-event view is loaded/replaced or semantically changes. Unrelated UI/preference normalization preserves the existing event array instead of copying it.

`src/learning.js` uses the revision to cache:

- latest reset cutoff per language
- activity events per language
- practice history per language + target + skill
- scored practice history per language + target + skill
- mastery values for the current revision

Before V14.0.1, functions such as mastery, skill statistics, unit mastery and review selection could repeatedly filter/sort the complete event history. The indexed design makes those calls operate on the relevant small history instead.

## 5. Learning-flow data contract

An integrated experience contains:

```js
{
  courseId,
  unitIndex,
  unit,
  stage,
  canDo,
  targets,
  dialogue,
  reading,
  production,
  checkpoint,
  concepts,
  activities,
  mix
}
```

A selected learning target includes:

```js
{
  id,
  native,
  kanjiForm,
  roman,
  meaning,
  speechForms,
  guide,
  kind
}
```

This lets one target participate in listening, retrieval, speech and script presentation without duplicating identity.

## 6. Fixed-target speech vs open production

### Fixed-target speech

When the learner is asked to say a specific target, browser transcripts are compared against the target's accepted authored forms using `bestSpeechMatch()`.

This can support cases such as:

```text
犬 == いぬ == イヌ
```

when those forms are authored as equivalents.

### Open free response

When a task allows many natural answers, the browser may capture the transcript but the app does not generate a fake percentage against one sample answer.

This protects the product from presenting text similarity as semantic conversation ability.

## 7. Japanese and Mandarin scaffolding

Japanese and Mandarin can display multiple learner aids from the same target:

```text
script form
reading
Romaji/Pinyin
Hindi/Devanagari pronunciation
meaning
```

`shouldShowRoman()` controls gradual Romaji/Pinyin fade. Hindi pronunciation can remain visible independently. For Mandarin, the Hindi helper preserves tone-number guidance. Audio remains the pronunciation authority.

## 8. Learning-evidence semantics

Important distinctions remain:

- retrieval answer: may be assessed
- fixed-target speech: may use transcript-match score
- open scenario response: unscored production evidence
- connected reading reveal: practice evidence, not fabricated comprehension accuracy
- stage self-assessment: unscored checkpoint evidence

XP is not the curriculum architecture and does not determine V14 lesson structure.

## 9. Test-phase progression

During V14 testing, all units are directly accessible. The Journey still recommends the first unit lacking sufficient evidence, but testers can open later Japanese/Mandarin stages without manufacturing progress history.

This is intentional while curriculum depth and advanced interactions are still being validated.

## 10. Persistence

### Local

- localStorage: small scoped UI/preferences and V14 activity-resume metadata
- IndexedDB: learning-event history

Only the active IndexedDB operations remain in `src/event-db.js`: load and upsert. Unused delete/count helpers were removed.

### Cloud

Optional Supabase services remain available for account testing:

- `profiles`
- `learning_events`
- `course_positions`

V14.0.1 does not require new database tables or schema changes.

## 11. Offline/PWA

`sw.js` cache version `language-lab-free-v14-0-1` includes the V14 Journey, learning-flow, session, pronunciation and runtime modules plus the pinned Supabase browser runtime.

An already-installed app should therefore refresh to the V14.0.1 runtime and continue to start offline after the new cache activates.

## 12. Testing

```bash
npm run ci
npm run e2e
```

Browser coverage is intended to exercise visitor vs returning learner state, honest course-depth messaging, mission -> dialogue -> target -> retrieval flow, retry signaling, accepted speech forms, Hindi pronunciation scaffolding, account/Guest infrastructure, IndexedDB persistence and PWA offline startup.
