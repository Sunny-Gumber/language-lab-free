# Product Requirements Document — Language Lab Free

## 1. Product summary

Language Lab Free is a **guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages**.

The product should help learners build practical language ability through connected input, retrieval, reading and production rather than merely complete isolated cards.

Supported languages:

- Japanese
- Mandarin Chinese
- Korean
- English
- Hindi
- Spanish
- French
- German
- Arabic
- Portuguese

Japanese and Mandarin are the reference courses for deeper staged curriculum design. The other eight languages remain foundation courses and must not be presented as equally deep.

## 2. Product goals

The learning path should increasingly train a learner to:

1. understand useful spoken language
2. connect sound, script and meaning
3. retrieve language without first seeing the answer
4. understand connected dialogue and reading
5. respond in their own words
6. revisit weak material over time
7. progress from survival communication toward increasingly complex real-world use

Internal labels such as `advanced` describe curriculum stages; they do not by themselves claim JLPT, HSK, CEFR or certification equivalence.

## 3. Active V15.1 learning loop

The learner experience builds on the V14 connected Journey with a V15.1 typed/interleaved planner:

```text
Mission
  -> Model conversation / connected input
  -> Adaptive target selection
  -> Review target: retrieve before re-teaching
  -> New target: introduce -> intervening activity -> retrieve
  -> Connected reading when available
  -> Free-response scenario
  -> Stage checkpoint when applicable
  -> Weak material may return later
```

### Mission

The learner first sees a real-world can-do goal and the useful concepts involved.

### Model conversation

When authored dialogue exists, the learner encounters language in a connected situation before treating targets as isolated forms.

### New target introduction

A new target connects sound, script, meaning and appropriate grammar/pronunciation support.

For normal multi-target sessions, the first retrieval of that target should **not** occur on the immediately following activity. At least one meaningful activity should intervene.

### Review-first retrieval

Previously seen review material should be retrieved before the system reveals/re-teaches the answer. Review should test memory rather than prime it immediately beforehand.

### Spacing limitation

If a session genuinely contains only one usable new target and there is no meaningful intervening activity, immediate retrieval is allowed only as an explicit `spacingLimited` case. The system should not generate meaningless filler solely to satisfy a spacing rule.

### Wrong-answer return

Incorrect retrieval may cause the target to return later in the same session and/or future review.

### Connected reading

Where authored reading exists, familiar language appears inside a longer message. Translation is support, not the first thing shown.

### Free-response scenario

The learner receives a communicative task and responds in their own words. Open responses must **not** be falsely graded against one mandatory model sentence.

Browser speech recognition may display what the browser heard. It remains transcript evidence, not phoneme-level pronunciation, accent, pitch-accent or Mandarin tone scoring.

### Stage checkpoint

At the end of a stage, the learner sees a can-do list and performs a connected task rather than only answering isolated recognition questions.

## 4. Adaptive session planning

Current adaptive target mix:

- no scored history: 0 review + 3 new
- recent accuracy below 60%: 4 review + 1 new
- recent accuracy 60–79%: 3 review + 2 new
- recent accuracy 80%+: 2 review + 3 new

Weak and due targets receive higher review priority.

Target **selection** and activity **ordering** are separate responsibilities:

- `src/session.js` selects review/new targets.
- `src/activity-engine.js` turns selected targets and authored context into a typed/interleaved activity plan.
- `src/journey-v14.js` remains the active renderer during migration.

During the current test phase, all units may remain directly accessible so later Japanese/Mandarin content can be evaluated without manufacturing learner history.

## 5. V15 Course Pack and concept architecture

V15 separates authored course data from runtime implementation through a versioned Course Pack contract.

A Course Pack contains:

- course metadata
- stages / competency bands
- stable learning concepts
- units and can-do goals
- prerequisites
- authored dialogue, reading, production and checkpoint content
- typed activity templates

Existing V14 item/vocabulary target IDs must remain stable when those targets become V15 concepts unless a deliberate migration updates historical learning events.

One concept may participate across recognition, recall, listening, reading, speaking and writing while learner evidence remains skill-specific.

### Typed activity contract

Canonical activity types may include:

- mission
- model-dialogue
- concept-intro
- multiple-choice
- translation
- cloze
- matching
- word-bank
- listening-choice
- listening-dictation
- fixed-speaking
- fixed-retrieval
- free-speaking
- free-writing
- reading
- reading-question
- roleplay
- script-writing
- checkpoint
- complete

V15.1 actively uses a subset of these types. Temporary renderer aliases may remain while `src/journey-v14.js` is the active renderer, but pedagogical logic should be expressed through canonical activity types.

Generated or authored activities must be validated before rendering. Arbitrary model-generated HTML must not become a Journey execution path.

## 6. Language-specific requirements

### Japanese

The Japanese course should progressively integrate:

- sound foundations
- Hiragana and Katakana
- practical vocabulary and grammar
- Kanji attached to already-known vocabulary/grammar
- connected dialogue
- increasingly long reading
- casual, polite, honorific and humble register
- spontaneous and structured production

Romaji should fade as recognition improves. Hindi pronunciation support may remain visible longer as an optional learner aid. Authored `kanjiForm`, `speechForms` and `speechAliases` must remain valid accepted transcript forms.

### Mandarin Chinese

The Mandarin course should progressively integrate:

- Pinyin and four-tone foundations
- tone-pair awareness
- Hanzi
- practical vocabulary and grammar
- aspect and complement systems
- 把 / 被 and other intermediate structures
- connected dialogue and reading
- increasingly open production

Pinyin may fade as recognition grows. Hindi/Devanagari pronunciation support should preserve tone guidance. Audio remains authoritative for tone learning.

### Other eight languages

The other eight languages currently provide practical foundations using the same engine. They should be expanded after the deeper Japanese/Mandarin model is validated rather than receiving shallow mass-generated advanced content.

## 7. Speech behavior

Fixed-target transcript matching must use authored accepted forms rather than one surface string.

For example, when authored as equivalents:

```text
いぬ
犬
イヌ
```

may represent the same spoken target.

Free-response scenarios are different: the system may capture a transcript but should not assign a percentage merely because the response differs from one sample sentence.

## 8. Learning evidence

Important semantics:

- passive playback is not mastery evidence
- listening checks may be assessed
- retrieval may be assessed
- fixed-target speech may use accepted-form transcript-match evidence
- open free response is production practice unless genuine semantic/pronunciation assessment exists
- manual speaking is practice coverage, not a fake 0% failure
- writing is effort/coverage until genuine writing assessment exists

XP is optional feedback and must not define curriculum completion by itself.

V15.1 must preserve the existing IndexedDB event ledger and stable target identities.

## 9. Deterministic curriculum ownership

Curriculum order, prerequisites, competencies, target selection and progression remain application-owned and deterministic.

A future AI layer may:

- explain a concept
- generate a bounded exercise
- generate content inside a known unit/competency
- evaluate an open response where appropriate
- participate in multi-turn roleplay

AI must **not** directly:

- assign mastery values
- mark units complete
- promote a learner to a stage/level
- silently redefine course prerequisites or competency claims

Learner evidence is recorded first; deterministic learning logic decides progression.

## 10. Navigation

Primary areas:

- **Journey** — guided integrated path and recommended next session
- **Practice** — focused listening, shadowing and fixed-target speaking
- **Review** — weak/due material, recall and recognition
- **Explore** — lesson notes, language guide, vocabulary and writing
- **Progress** — evidence and course progress

Journey is the normal entry point.

## 11. Persistence and accounts

The implementation supports:

- Guest learning
- IndexedDB learning-event storage
- Google sign-in where configured
- optional Supabase synchronization
- account-scoped local/cloud data

No V15.1 database-schema change is required.

## 12. Offline and hosting

The application remains a static browser/PWA product hosted from GitHub Pages.

The active service-worker cache must include the Course Pack type registry, V15.1 activity engine, learning-flow planner, Journey renderer and language-specific pronunciation support required for offline startup.

Core Journey/Practice/Review/reading/progress must remain functional without an AI service.

## 13. Quality gates

Normal development checks:

```bash
npm run ci
npm run e2e
npm run course-packs:check
```

V15.1 regression coverage should include:

- first-visit flow
- honest course-depth presentation
- canonical activity typing
- delayed/interleaved retrieval for normal multi-target sessions
- review-before-reteach behavior
- explicit single-target `spacingLimited` behavior
- wrong-answer same-session retry
- connected dialogue/reading
- retrieval + fixed-target speaking
- open-response non-fake-scoring
- accepted speech forms
- Japanese/Mandarin Hindi pronunciation guidance
- saved Journey activity resume
- account/Guest isolation
- IndexedDB persistence
- offline PWA startup

Course Pack coverage should additionally verify stable target identity, compiler immutability, valid references and rejection of unknown types/broken references.

## 14. Current limitation statement

Language Lab Free should currently be described as:

> **A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.**

It should not yet claim that every supported course can independently take any learner from absolute zero to certified advanced proficiency.
