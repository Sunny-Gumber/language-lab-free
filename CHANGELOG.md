# Changelog

All notable product and architecture changes should be recorded here.

## 15.1.0 — 2026-09-14

### Typed/interleaved learning planner

- Added `src/activity-engine.js` as the active pedagogical ordering layer between adaptive target selection and Journey rendering.
- Planned activities now retain canonical V15 `activityType` identities while temporarily mapping to the existing `src/journey-v14.js` renderer aliases.
- Previously seen review targets are retrieved before re-teaching rather than being revealed immediately before testing.
- New targets are introduced and then retrieved after at least one intervening activity whenever the session contains enough meaningful material.
- Single-target sessions explicitly mark an unavoidable immediate retrieval as `spacingLimited` instead of inventing filler content.
- `src/learning-flow.js` now assembles unit/context data and delegates activity ordering to the typed planner.
- Wrong retrieval can still schedule a later same-session retry.

### Learner experience

- Journey now explains that new language will be retrieved after a short delay rather than promising immediate retrieval.
- Session preview identifies interleaved retrieval.
- Completion copy reflects spaced retrieval while keeping open free-response assessment honest.
- Existing Japanese/Mandarin Romaji/Pinyin and Hindi/Devanagari pronunciation scaffolding is preserved.

### Testing and PWA

- Added unit tests for delayed new-target retrieval, review-before-reteach behavior, canonical typed activities and single-target spacing limits.
- Browser tests now advance by expected learner state/selector instead of depending on a fixed number of Journey screens.
- Runtime/package version moved to `15.1.0`.
- Service-worker cache moved to `language-lab-free-v15-1`.
- Offline assets now include `src/course-pack.js` and `src/activity-engine.js` because the active planner uses the V15 canonical type registry.
- No IndexedDB or Supabase schema change is required.

## V15 Course Pack foundation — merged 2026-09-14

This architecture-only foundation was merged before the learner-facing `15.1.0` version bump.

### Content architecture

- Added `src/course-pack.js` with a versioned `15.0` Course Pack contract covering courses, stages, concepts, units and typed activity templates.
- Added a read-only legacy compiler that consumes the existing normalized course model rather than duplicating stable-ID normalization.
- Existing item/vocabulary target IDs are preserved as concept IDs so historical learning events remain attached to the same learning identity.
- Authored speech forms, V9/V14 dialogue, connected reading, production tasks, script focus and stage checkpoints are carried into compiled packs.
- Added validation for duplicate IDs, unknown concept/activity types, invalid stage references and broken activity/unit concept references.

### Migration tooling and tests

- Added `scripts/build-course-packs.js` to compile/validate Japanese and Mandarin reference packs, with optional `--all` and `--write` modes.
- Added `npm run course-packs:check` and `npm run course-packs:build`.
- Added `tests/course-pack.test.js` for stable identity, connected-content preservation, compiler immutability and validation failures.
- Added `course-packs/README.md` documenting the migration contract and rules.
- Generated Course Pack JSON remains a debug/migration artifact and is ignored by Git until native authored packs become the source of truth.

### Runtime impact

- The foundation itself did not switch course loading or Journey rendering.
- V7/V8/V9 remain temporary authoring sources during parity work; the target is to remove them after native Course Pack/runtime cutover rather than maintain permanent dual systems.

## 14.0.1 — 2026-08-30

### Runtime reliability and load reduction

- Audited the active runtime for dead, duplicated and repeatedly recomputed work.
- Added event-revision invalidation in `src/store.js` and an indexed learning-event view in `src/learning.js`.
- Learning evidence is grouped once per revision by language/activity and language/target/skill rather than repeatedly filtering/sorting full history.
- Mastery values are cached for the current event revision.
- Unrelated UI/preference state updates preserve the existing event array.
- Added immutable lookup caches in `src/data.js`.
- Removed V13-only adaptive helpers with no active caller and unused IndexedDB helpers.
- Removed redundant Journey restoration and duplicate post-cloud boot renders.

### Legacy cleanup

- Removed obsolete V13 Journey/resume modules and CSS plus the unused V10 compatibility runtime.
- Git history remains the archive instead of keeping parallel inactive runtime implementations.

### PWA

- Bumped the offline cache to `language-lab-free-v14-0-1`.

## 14.0.0 — 2026-08-30

### Integrated learning-flow rewrite

- Replaced the V13 item loop with a connected unit experience.
- Added `src/learning-flow.js` as the pedagogical planning seam and `src/journey-v14.js` as the active guided renderer.
- Sessions can combine Mission → model dialogue → target learning → retrieval → connected reading → free-response production → checkpoint → completion.
- Adaptive review/new selection remains in use inside the richer flow.
- Wrong retrieval can return later in the same session.
- All units are directly accessible during the test phase.

### Conversation and production

- Added connected model dialogue and reading where authored.
- Added open free-response scenarios that are deliberately not fake-scored against one sample answer.
- Fixed-target speech can use authored accepted forms for transcript matching.

### Japanese and Mandarin scaffolding

- Preserved Romaji/Pinyin fade behavior and Hindi/Devanagari pronunciation guidance.
- Added data-driven `kanjiForm`, `speechForms` and `speechAliases` handling.
- Preserved Japanese Kanji/Hiragana/Katakana transcript equivalence.

### Product positioning

- Product wording became: **“A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.”**
- Internal advanced-stage labels do not claim JLPT/HSK/certification equivalence.

## 13.1.0 — 2026-08-29

- Introduced the adaptive communicative Journey around Context → Listen → Understand → Check → Recall → Use → Complete.
- Added weak/due prioritization, recall/speaking, mistake memory and same-session retry.
- Added Japanese/Mandarin Hindi pronunciation guidance and Mandarin tone guidance.
- Hardened Journey resume behavior.

## 12.0.0 — 2026-08-29

- Added separate first-visitor and returning-learner home states.
- Added honest course-depth messaging and a returning learner dashboard.

## 11.2.0 — 2026-08-29

- Moved learning-event persistence to IndexedDB.
- Hardened Guest/account scoping and Guest-to-account import.
- Added incremental event sync, course-position conflict handling, stable target IDs and PWA regression testing.

## 11.0.0 — 2026-08-28

- Replaced the historical layered runtime with browser ES modules and moved learning state toward an event-derived model.

## 10.0.0 — 2026-08-27

- Hardened account-scoped storage, cloud reconciliation, PWA metadata and CI safety.

## 9.0.0 — 2026-08-27

- Added deeper integrated Japanese/Mandarin lesson packs and richer checkpoint content.

## 8.0.0 — 2026-08-27

- Added expanded Japanese/Mandarin multi-stage curricula and multi-skill mastery support.

## 7.0.0 — 2026-08-27

- Added higher-quality beginner course content and the V7 content layer.

## 6.0.0 — 2026-08-27

- Added guided daily learning behavior, course-selection/dashboard improvements, local-calendar streak handling and offline caching.

For detailed historical implementation commits, use Git history and pull requests.
