# V15 Course Packs

V15 introduces a content boundary between **course authoring** and the **learning runtime**.

The active learner experience is still V14 while this migration is validated. `src/course-pack.js` compiles the existing normalized V14 course data into the new contract without changing stable target IDs, speech-form equivalence, IndexedDB learning events, Journey behavior, or account/offline behavior.

## Why this exists

The current course content is assembled through `languages.js` plus the V7/V8/V9 authoring layers. That works, but it couples historical JavaScript authoring code to the application runtime.

The V15 target is:

```text
Course Pack
   ↓
Concept Graph
   ↓
Curriculum / competency rules
   ↓
Adaptive planner
   ↓
Typed activities
   ↓
Journey / Practice / Review
   ↓
Learning-event evidence
```

Course Packs are data. They must not contain runtime handlers, DOM code, progress mutations, account logic, or model-provider secrets.

## Current migration status

V15.0 foundation provides:

- `src/course-pack.js` — schema constants, legacy compiler and validation.
- `scripts/build-course-packs.js` — compile/validate Japanese and Mandarin reference packs; `--all` includes every course; `--write` emits JSON under `course-packs/generated/`.
- `tests/course-pack.test.js` — stable-ID, dialogue, reading, checkpoint, immutability and broken-reference coverage.

Generated JSON is a migration/debug artifact for now, not the runtime source of truth. The existing V14 authoring layers remain authoritative until a later migration explicitly switches runtime loading to authored Course Pack files.

## Top-level shape

```json
{
  "schemaVersion": "15.0",
  "course": {
    "id": "ja",
    "name": "Japanese",
    "locale": "ja-JP"
  },
  "stages": [],
  "concepts": [],
  "units": []
}
```

## Concepts

A concept has one stable identity that can participate in multiple skills and activities.

```json
{
  "id": "item:ja:u1:i1",
  "type": "script",
  "forms": {
    "native": "あ",
    "written": "",
    "roman": "a"
  },
  "meaning": "Short, clean ah.",
  "speechForms": ["あ"],
  "source": {
    "kind": "legacy-item",
    "targetId": "item:ja:u1:i1"
  }
}
```

Allowed concept types currently include:

- `vocabulary`
- `grammar`
- `expression`
- `script`
- `pronunciation`
- `culture`
- `language`

During migration, existing item/vocabulary target IDs are preserved exactly so historical learning events continue to refer to the same targets.

## Units

A unit connects competencies, concepts and typed activity templates:

```json
{
  "id": "unit:ja:u1",
  "stageId": "beginner-1",
  "title": "Japanese Sound System",
  "canDo": "I can ...",
  "prerequisites": [],
  "conceptIds": ["item:ja:u1:i1"],
  "activities": []
}
```

V15.0 does **not** permanently encode the current immediate `learn → retrieve` order into Course Packs. The pack identifies concepts and authored connected content; the future adaptive planner remains responsible for selecting and interleaving review/new targets.

## Typed activities

The contract reserves explicit types for connected input, retrieval and later exercise-engine work, including:

- `mission`
- `model-dialogue`
- `concept-intro`
- `multiple-choice`
- `translation`
- `cloze`
- `matching`
- `word-bank`
- `listening-choice`
- `listening-dictation`
- `fixed-speaking`
- `fixed-retrieval`
- `free-speaking`
- `free-writing`
- `reading`
- `reading-question`
- `roleplay`
- `script-writing`
- `checkpoint`
- `complete`

Only a subset is produced by the legacy compiler today. Later authored Course Packs and the V15 activity engine can use the richer set.

## Build and validate

```bash
npm run course-packs:check
npm run course-packs:build
```

`course-packs:check` compiles and validates Japanese + Mandarin without writing files.

`course-packs:build` writes the generated Japanese + Mandarin JSON packs. For all ten courses:

```bash
node scripts/build-course-packs.js --all --write
```

## Migration rules

1. Keep the current stable item/vocabulary IDs when a legacy target becomes a V15 concept.
2. Preserve authored `kanjiForm`, `speechForms` and `speechAliases` equivalence.
3. Do not let Course Pack compilation mutate normalized V14 data.
4. Validate every unit/activity concept reference before runtime use.
5. Keep curriculum/progression deterministic. AI-generated content must fit a validated activity/course contract rather than redefine learner mastery or progression.
6. Do not maintain V14 and V15 as permanent parallel runtimes. Once the new data model is proven and the runtime switches, remove superseded authoring/runtime compatibility code instead of keeping it indefinitely.
