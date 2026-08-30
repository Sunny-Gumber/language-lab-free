# AGENTS.md

## Purpose

This file is the operating guide for ChatGPT/Codex and other coding agents working on Language Lab Free.

The current priority is **learning quality, pedagogical architecture and a small reliable runtime**, not preservation of every V13 test-state detail.

## Product snapshot

- Product: **A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.**
- Current package version: `14.0.1`.
- Product status: active test/development phase.
- Production branch: `main`.
- Hosting: GitHub Pages from `main`.
- Runtime: browser ES modules under `src/`.
- Local event persistence: IndexedDB.
- Optional account sync: Supabase.
- Tests: Node checks + Playwright browser/PWA coverage.

Before changing code, read:

1. `PRD.md`
2. `ARCHITECTURE.md`
3. `TASKS.md`
4. `CHANGELOG.md`
5. `README.md`
6. `supabase/README.md` for database/sync work

## V14 development mandate

The user has explicitly approved broad learning-flow/code rewrites during the test phase.

Therefore:

1. **Do not preserve a weak pedagogical design only for backward compatibility with test data.**
2. Large coherent rewrites are allowed when they materially improve the learning model.
3. XP, old completion thresholds and historical test progress are not sacred product contracts.
4. Prefer correct learning semantics over keeping an old screen sequence unchanged.
5. Do not mass-generate shallow “advanced” content merely to increase unit count.
6. Japanese and Mandarin should be treated as reference courses for the deeper learning model before expanding all ten languages equally.
7. Keep product claims honest: an internal advanced stage is not automatically certified advanced proficiency.

## Code-hygiene mandate

Keep the runtime understandable enough that every retained line has a current purpose.

- Git history is the archive. Do not keep superseded runtime implementations in the active tree merely “for reference”.
- Delete functions/modules that have no runtime or test caller unless they are an intentional documented public API.
- Prefer one source of truth over compatibility wrappers and duplicated transformations.
- Do not repeatedly scan or sort the complete learning-event history inside per-target/per-unit render loops; use the event-revision index in `src/learning.js`.
- Treat normalized course data as immutable at runtime and reuse the cached stage/item/practice/conversation lookups in `src/data.js`.
- Avoid copying the full event array during unrelated UI/preference state updates.
- Prefer a small coherent change over another monkey patch, cloned handler or parallel “V-next” implementation.
- Before adding a helper, search for an existing equivalent. Before retaining an old helper, search for an actual caller.
- Performance optimizations must preserve learning semantics, account isolation and offline behavior.

## Non-negotiable safety/security rules

Even in the test phase:

1. **Never expose secrets.** Do not commit Supabase service-role keys, database passwords, OAuth client secrets, private tokens or credentials.
2. The browser Supabase publishable key may be public by design; privileged secrets may not.
3. Keep authenticated tables protected by Row Level Security.
4. Do not introduce cross-account or Guest/account data leakage.
5. Any Supabase schema change requires a migration and documentation update.
6. Keep GitHub Pages deployable unless an explicit product decision changes hosting.
7. Avoid required paid infrastructure/APIs without explicit approval.

## V14 learning contracts

Treat these as the active pedagogical contracts:

- Journey is the normal learning entry point.
- `src/learning-flow.js` converts curriculum + adaptive targets into a connected experience.
- `src/journey-v14.js` is the active Journey UI/interaction engine.
- The normal flow should move through situation/context, connected input, useful forms, retrieval, connected reading where available, production and checkpointing.
- Adaptive review/new target selection remains useful, but must serve the learning flow rather than define the whole product.
- Wrong retrieval can cause same-session return.
- Open/free-response tasks must not be fake-scored against one arbitrary model sentence.
- Fixed-target speech may use transcript matching against authored accepted forms.
- Japanese speech targets can use `kanjiForm`, `speechForms` and `speechAliases` so Kanji/Kana/Katakana representations do not false-fail.
- Japanese/Mandarin Hindi pronunciation support remains a learner aid; audio is still the pronunciation authority.
- Romaji/Pinyin may fade as recognition improves.
- Writing remains practice/coverage until genuine writing assessment exists.
- All units may remain directly accessible while V14 is being tested.

## Course-depth rules

### Japanese

Prioritize:

- Kanji integrated with already-known vocabulary/grammar
- richer examples per grammar function
- connected dialogues
- progressively longer reading/listening
- casual/polite/register contrasts
- meaningful upper/advanced production

### Mandarin

Prioritize:

- tone-pair work
- richer 把 / 被 / complement / aspect practice
- Hanzi in connected contexts
- connected dialogue/reading
- intermediate plateau production

### Other eight languages

Keep them honestly labelled as foundation courses until the deeper Japanese/Mandarin model is validated. Do not copy “advanced” labels without equivalent content depth.

## Active module responsibilities

- `src/app.js` — bootstrap and render coordination; imports the active V14 Journey.
- `src/data.js` — course normalization, stages, stable IDs, accepted speech-form registration and immutable lookup caches.
- `src/session.js` — adaptive review/new target selection and weak/due prioritization.
- `src/learning-flow.js` — **V14 pedagogical experience planner**.
- `src/journey-v14.js` — **active integrated Journey renderer and interaction engine**.
- `src/practice.js` — focused listening, shadowing and fixed-target speaking.
- `src/pronunciation-hi.js` — Japanese/Mandarin Hindi/Devanagari pronunciation support.
- `src/learning.js` — event-indexed learning evidence, review signals, mastery and XP feedback.
- `src/event-db.js` — IndexedDB event persistence.
- `src/store.js` — scoped local state plus event-revision invalidation for derived learning caches.
- `src/cloud.js` — optional auth/Supabase sync.
- `src/audio.js` — TTS/voice selection.
- `src/course.js` — supporting lesson notes, vocabulary, cards, quiz, writing and progress.
- `src/home.js` — first-visit experience and returning dashboard.
- `src/auth-ui.js` — optional account UX.
- `src/writing.js` — writing pad.
- `src/utils.js` — shared utilities and speech normalization/matching.

Historical V13 Journey/resume modules and V10 compatibility runtime have been removed from the active tree. Use Git history when historical implementation detail is needed; do not reintroduce those files as parallel runtime paths.

V7/V8/V9 files remain course-content authoring layers. Do not reintroduce runtime monkey-patching through them.

## Persistence guidance

- IndexedDB remains the event ledger unless intentionally redesigned.
- localStorage is for small scoped state, not an ever-growing event history.
- V14 session resume currently preserves unit/activity continuity; exact old V13 item-step compatibility is not a release requirement.
- Existing Supabase/account infrastructure may remain during the test phase but should not dictate pedagogy.

## Development workflow

For meaningful code changes:

1. Understand the learning outcome, not only the requested UI.
2. Inspect the relevant curriculum data and runtime modules.
3. Update the learning-flow contract before layering hacks into the UI.
4. Search for duplicate/dead implementation before adding code.
5. Add/update tests for the new behavior.
6. Run:
   - `npm run ci`
   - `npm run e2e` for browser/PWA changes
7. Check mobile layout and runtime console errors.
8. Update `README.md`, `PRD.md`, `ARCHITECTURE.md`, `TASKS.md` and `CHANGELOG.md` when contracts change.
9. Use a feature branch + pull request for non-trivial work.
10. Never force-push `main`.

## Definition of done

A learning-model or runtime change is complete when:

- the requested learner behavior actually works
- the flow is pedagogically coherent rather than merely visually complete
- fixed-target vs open-response scoring semantics are honest
- Japanese/Mandarin scaffolding remains correct where affected
- duplicated/dead runtime code has not been left behind unnecessarily
- repeated hot-path work has been avoided where a stable cache/index is appropriate
- required offline assets are cached
- relevant tests pass
- security/account isolation has not been accidentally weakened
- documentation states the actual capability and remaining limitations

## When uncertain

Prefer the design that teaches the learner more effectively while remaining technically honest and operationally simple. During this test phase, do not let obsolete XP/progression/history assumptions or obsolete implementation files block a better architecture.