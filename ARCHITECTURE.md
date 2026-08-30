# Architecture — Language Lab Free V14

## 1. Overview

Language Lab Free is a static, browser-based PWA hosted on GitHub Pages. V14 separates the **learning-flow planner** from the **Journey renderer** so curriculum content can be turned into connected learning experiences instead of a flat sequence of item screens.

```text
Course content (V7/V8/V9 authoring layers)
        |
        v
src/data.js
  normalizes units, stages, targets and speech forms
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

It combines:

- the current unit
- stage information
- adaptive target selection from `src/session.js`
- V9/V14 dialogue metadata when available
- V9/V14 reading metadata when available
- unit production tasks
- stage checkpoints
- script/character focus

and produces one ordered `experience.activities` array.

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

The V14 Journey controller is the normal learner entry point. It renders the integrated activity list and handles:

- mission/can-do orientation
- multi-turn model dialogue
- target learning
- active retrieval
- same-session retry scheduling
- connected reading
- free-response production
- stage checkpoints
- speech-recognition capture
- Journey/Review/Explore navigation
- lightweight activity resume

Open production is deliberately **not** forced against one model sentence.

### `src/session.js`

The adaptive target-selection engine remains separate from the presentation flow.

It continues to decide the review/new mix and prioritize weak/due targets. V14 then places those targets inside richer learning activities.

### `src/data.js`

In addition to structural IDs and stage targeting, `src/data.js` owns the speech-authoring contract:

```text
native
kanjiForm
speechForms
speechAliases
```

Authored equivalent forms are registered for transcript matching. This is especially important for Japanese speech recognition, where a browser may return Kanji, Hiragana or Katakana for the same spoken form.

## 3. Runtime module map

- `src/app.js` — bootstrap and render coordination; imports V14 Journey.
- `src/store.js` — scoped preferences/UI state, positions and in-memory event view.
- `src/event-db.js` — IndexedDB learning-event persistence.
- `src/cloud.js` — authentication and optional Supabase synchronization.
- `src/learning.js` — event-derived XP, mastery, coverage, streak and review signals.
- `src/data.js` — course normalization, stages, stable target IDs and speech forms.
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

The older `src/journey.js` and `src/resumable-journey.js` remain historical V13 modules but are no longer the application entry Journey in V14.

## 4. Learning-flow data contract

An integrated experience contains the following high-level structure:

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

### Target contract

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

## 5. Fixed-target speech vs open production

These are intentionally different systems.

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

## 6. Japanese and Mandarin scaffolding

Japanese and Mandarin can display multiple learner aids from the same target:

```text
script form
reading
Romaji/Pinyin
Hindi/Devanagari pronunciation
meaning
```

`shouldShowRoman()` controls gradual Romaji/Pinyin fade. Hindi pronunciation can remain visible independently.

For Mandarin, the Hindi helper preserves tone-number guidance. Audio remains the pronunciation authority.

## 7. Learning evidence

V14 still records evidence through the existing event pipeline so adaptive review and dashboards continue to work.

```text
learner action
  -> recordPractice()
  -> IndexedDB event
  -> learning.js derived state
  -> optional incremental Supabase sync
```

Important distinctions:

- retrieval answer: may be assessed
- fixed-target speech: may use transcript-match score
- open scenario response: unscored production evidence
- connected reading reveal: practice evidence, not fabricated comprehension accuracy
- stage self-assessment: unscored checkpoint evidence

XP is not the curriculum architecture and does not determine V14 lesson structure.

## 8. Test-phase progression

During V14 testing, all units are directly accessible. The Journey still recommends the first unit lacking sufficient evidence, but testers can open later Japanese/Mandarin stages without manufacturing progress history.

This is intentional while curriculum depth and advanced interactions are still being validated.

## 9. Persistence

### Local

- localStorage: small scoped UI/preferences and V14 activity-resume metadata
- IndexedDB: learning-event history

### Cloud

Optional Supabase services remain available for account testing:

- `profiles`
- `learning_events`
- `course_positions`

V14 does not require new database tables.

## 10. Offline/PWA

`sw.js` cache version `language-lab-free-v14-0` includes:

- `journey-v14.css`
- `src/journey-v14.js`
- `src/learning-flow.js`
- `src/session.js`
- pronunciation/runtime modules
- the pinned Supabase browser runtime

An already-installed app should therefore be able to start the V14 learning runtime offline.

## 11. Testing

```bash
npm run ci
npm run e2e
```

V14 browser coverage is intended to exercise:

- visitor vs returning learner state
- honest course-depth messaging
- V14 mission -> dialogue -> target -> retrieval flow
- same-session retry signaling
- accepted speech forms
- Hindi pronunciation scaffolding
- account/Guest infrastructure where enabled
- IndexedDB persistence
- V14 PWA offline startup
