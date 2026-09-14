# Architecture — Language Lab Free V15.1

## 1. Overview

Language Lab Free is a static browser/PWA hosted on GitHub Pages. V15.1 separates four concerns that were historically closer together:

1. course/content normalization
2. adaptive target selection
3. pedagogical activity ordering
4. Journey rendering and interaction

```text
Course content (temporary V7/V8/V9 authoring layers)
        |
        v
src/data.js
  normalized units/stages/targets
  stable IDs + accepted speech forms
        |
        +------------------------------+
        |                              |
        v                              v
src/session.js                   src/course-pack.js
adaptive review/new              V15 schema/type registry
selection                        legacy compiler/validator
        |                              |
        +---------------+--------------+
                        v
                src/learning-flow.js
            assembles unit/context data
                        |
                        v
                src/activity-engine.js
           typed + interleaved activity plan
                        |
                        v
                src/journey-v14.js
          active renderer/interaction engine
                        |
                        v
               learning-event evidence
                 IndexedDB + optional
                    Supabase sync
```

The filename `journey-v14.js` remains during the migration because it is still the stable renderer. V15.1 does **not** create a parallel Journey runtime merely to change activity planning.

## 2. Course/data layer

### `src/data.js`

`src/data.js` normalizes authored course content and owns the stable learning-target identity currently used by IndexedDB and Supabase events.

It also owns the speech-authoring contract:

```text
native
kanjiForm
speechForms
speechAliases
```

Authored equivalents can therefore represent one spoken target using Japanese Kanji, Hiragana or Katakana without creating separate learning identities.

Normalized course data is treated as immutable after normalization and cached for course/stage/item/practice/conversation lookup.

### `src/course-pack.js`

The Course Pack layer introduced in V15.0 provides:

- schema version `15.0`
- concept types
- canonical typed activity names
- conversion from the normalized legacy course model
- stable target-ID preservation
- dialogue/reading/production/checkpoint conversion
- structural validation

The Course Pack compiler remains read-only. Existing item/vocabulary IDs become concept IDs unchanged during migration so historical learning events continue to resolve.

Native authored Course Packs are **not yet** the browser content source of truth. V7/V8/V9 remain temporary authoring layers until parity and runtime cutover are proven.

## 3. Adaptive selection vs pedagogical ordering

### `src/session.js` — selection

The adaptive selector decides **which targets** enter a session.

Current target mix:

- first steps: 0 review + 3 new
- recent accuracy <60%: 4 review + 1 new
- 60–79%: 3 review + 2 new
- 80%+: 2 review + 3 new

Weak/due material receives higher review priority.

`src/session.js` does not decide the final screen sequence.

### `src/activity-engine.js` — ordering

V15.1 introduces the active typed activity planner.

Each activity has:

```js
{
  activityType, // canonical V15 identity
  type,         // temporary V14 renderer alias
  key,
  ...payload
}
```

Examples:

```text
canonical          renderer alias
---------          --------------
mission            mission
model-dialogue     dialogue
concept-intro      learn
fixed-retrieval    retrieve
reading            reading
free-speaking      scenario
checkpoint         checkpoint
complete           complete
```

The alias is temporary migration infrastructure. New pedagogical behavior should be expressed through canonical activity types rather than by inventing new UI-specific screen names.

## 4. Interleaving contract

The old V14 planner paired every target as:

```text
Learn A
Retrieve A
Learn B
Retrieve B
```

V15.1 changes that contract.

### New targets

A new target is introduced and, when another meaningful activity is available, retrieval is delayed by at least one intervening activity.

Typical first session:

```text
Mission
Dialogue
Introduce A
Introduce B
Retrieve A
Introduce C
Retrieve B
Reading / context where available
Retrieve C
Scenario
```

The exact order depends on the adaptive review/new queue and authored connected content.

### Review targets

Previously seen review material is retrieved **before re-teaching**. The planner does not automatically reveal a review target immediately before testing it.

A review activity may also act as the intervening activity that spaces retrieval of a newly introduced target.

### Single-target limitation

If a session contains only one usable new target and there is no legitimate intervening activity, the retrieval is marked:

```js
{ spacingLimited: true }
```

The validator permits that explicit exception. The system does not create meaningless filler merely to satisfy a spacing metric.

### Wrong-answer retry

The existing Journey interaction engine can insert an incorrect retrieval again later in the same session. This remains separate from the first-retrieval interleaving rule.

## 5. `src/learning-flow.js`

`src/learning-flow.js` is now primarily an **experience assembler**, not the owner of target-screen ordering.

It gathers:

- current unit and stage
- selected adaptive targets
- model dialogue or fallback connected input
- connected reading
- production goal
- stage checkpoint
- concept map metadata

Then it delegates ordering to:

```js
buildInterleavedActivityPlan(...)
```

and validates the result with:

```js
assertInterleavedActivityPlan(...)
```

This keeps pedagogy testable without DOM/browser rendering.

## 6. `src/journey-v14.js`

The existing Journey remains the active renderer and interaction controller during the V15 migration.

It currently handles:

- Mission/can-do orientation
- model dialogue playback
- target introduction
- retrieval options
- fixed-target speaking
- connected reading
- free-response production
- stage checkpoints
- same-session retry insertion
- session resume metadata
- Review/Explore navigation

Open production remains deliberately unscored against one arbitrary model sentence.

Future work can progressively render canonical types such as cloze, listening checks or word-bank activities directly, after which the temporary renderer aliases can be reduced and eventually removed.

## 7. Learning evidence pipeline

Learner evidence continues through the existing event pipeline:

```text
learner action
  -> recordPractice()
  -> store.js event revision changes
  -> IndexedDB persistence
  -> learning.js rebuilds derived index once
  -> mastery/review/progress reuse that index
  -> optional incremental Supabase sync
```

V15.1 changes activity sequencing; it does not change historical target IDs, account ownership, IndexedDB schema or Supabase schema.

Important evidence semantics remain:

- retrieval answer: may be assessed
- fixed-target speech: may use accepted-form transcript-match evidence
- open scenario response: unscored production evidence
- connected reading reveal: practice evidence, not fabricated comprehension accuracy
- stage self-assessment: unscored checkpoint evidence

XP is feedback, not the curriculum architecture.

## 8. Japanese and Mandarin scaffolding

Japanese and Mandarin can expose multiple representations of one target:

```text
script form
reading
Romaji/Pinyin
Hindi/Devanagari pronunciation
meaning
```

`shouldShowRoman()` controls gradual Romaji/Pinyin fade. Hindi pronunciation can remain visible independently. Audio remains the pronunciation authority.

## 9. Persistence and resume

### Local

- localStorage: small scoped UI/preferences + Journey activity-resume metadata
- IndexedDB: learning-event history

### Cloud

Optional Supabase tables remain:

- `profiles`
- `learning_events`
- `course_positions`

No V15.1 database migration is required.

Journey resume still stores unit/activity continuity rather than serializing a second full course/runtime state.

## 10. Offline/PWA

The service-worker cache is:

```text
language-lab-free-v15-1
```

The cached runtime includes:

- `src/course-pack.js`
- `src/activity-engine.js`
- `src/learning-flow.js`
- `src/session.js`
- `src/journey-v14.js`
- pronunciation and other required browser modules
- pinned Supabase browser runtime

This is necessary because the active planner imports the canonical activity registry from `course-pack.js`.

## 11. Runtime module map

- `src/app.js` — bootstrap/render coordination; runtime version `15.1.0`
- `src/store.js` — scoped UI/preferences and event-revision invalidation
- `src/event-db.js` — IndexedDB event persistence
- `src/cloud.js` — optional auth/Supabase sync
- `src/learning.js` — indexed learning evidence, review signals, mastery and XP
- `src/data.js` — course normalization and stable target data
- `src/session.js` — adaptive target selection
- `src/course-pack.js` — V15 schema/compiler/canonical type registry
- `src/activity-engine.js` — V15.1 typed/interleaved ordering
- `src/learning-flow.js` — integrated experience assembly
- `src/journey-v14.js` — active Journey renderer during migration
- `src/practice.js` — focused listening/speaking
- `src/pronunciation-hi.js` — Japanese/Mandarin Hindi pronunciation helper
- `src/audio.js` — browser TTS/voice selection
- `src/course.js` — notes/vocabulary/writing/cards/progress
- `src/home.js` — home/course selection/dashboard
- `src/auth-ui.js` — optional account UX
- `src/writing.js` — writing pad
- `src/utils.js` — shared helpers and speech matching

Historical superseded runtime implementations remain in Git history, not the active tree.

## 12. Testing

```bash
npm run ci
npm run e2e
npm run course-packs:check
```

Coverage includes:

- canonical activity typing
- delayed/interleaved retrieval for normal multi-target sessions
- review-before-reteach ordering
- explicit single-target `spacingLimited` behavior
- wrong-answer retry
- stable Course Pack identity and validation
- Journey resume
- fixed vs open speech semantics
- Japanese/Mandarin pronunciation scaffolding
- account/Guest isolation
- IndexedDB persistence
- offline PWA startup
