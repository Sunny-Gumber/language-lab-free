# AGENTS.md

## Purpose

This file is the operating guide for ChatGPT/Codex and other coding agents working on Language Lab Free.

The current priority is **learning quality, pedagogical architecture and a small reliable runtime**, not preservation of obsolete screen sequences or historical test-state quirks.

## Product snapshot

- Product: **A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.**
- Current package/runtime version: `15.1.0`.
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
6. `course-packs/README.md` for V15 content-contract work
7. `supabase/README.md` for database/sync work

## Learning-model mandate

The user has explicitly approved broad pedagogical/code rewrites during the test phase.

Therefore:

1. **Do not preserve a weak learning design only for backward compatibility with test data.**
2. Large coherent rewrites are allowed when they materially improve learning.
3. XP, old completion thresholds and historical test progress are not sacred contracts.
4. Prefer correct learning semantics over preserving an old screen sequence.
5. Do not mass-generate shallow “advanced” content merely to increase unit count.
6. Japanese and Mandarin are the reference courses before expanding all ten languages equally.
7. Keep product claims honest: internal advanced stages are not certification guarantees.

## V15 architecture mandate

V15 separates course data, adaptive target selection, pedagogical ordering and rendering.

- `src/course-pack.js` owns the versioned Course Pack schema/compiler/validator and canonical activity-type registry.
- Existing stable item/vocabulary IDs must remain unchanged when they become V15 concepts unless an explicit event migration is designed.
- The legacy Course Pack compiler must remain read-only; it must not mutate normalized `src/data.js` course objects.
- Course Packs are data contracts, not DOM/runtime handlers. Do not put progress mutations, account logic or provider secrets into course content.
- `src/session.js` chooses **which** review/new targets enter a session.
- `src/activity-engine.js` decides **how those targets are ordered** inside the typed learning plan.
- `src/learning-flow.js` gathers unit/context data and delegates ordering rather than hard-coding target-by-target screen pairs.
- `src/journey-v14.js` remains the active renderer during migration. Do not create a parallel Journey implementation merely to add V15 pedagogy.
- Canonical `activityType` is the durable planning identity. The old `type` field is a temporary renderer alias while the V14 renderer remains active.
- Curriculum/progression rules remain deterministic. AI may later generate/explain/evaluate bounded activities, but AI must not directly set mastery, mark a unit complete or promote a learner.
- Generated Course Pack JSON remains migration/debug output until native authored packs become the source of truth.
- Do not maintain V7/V8/V9 and native Course Packs forever. After parity/cutover, remove superseded authoring layers instead of creating permanent dual systems.

## V15.1 interleaving contracts

Treat these as active pedagogical contracts:

- Journey remains the normal learning entry point.
- Previously seen review targets should be retrieved **before** re-teaching/revealing them.
- A newly introduced target should not normally be retrieved on the immediately following activity.
- In normal multi-target sessions, at least one meaningful activity should intervene before first retrieval of a new target.
- If a session genuinely has only one usable new target and no meaningful intervening activity, mark the retrieval `spacingLimited` rather than inventing filler content.
- Wrong retrieval can still cause a later same-session retry.
- Open/free-response tasks must not be fake-scored against one arbitrary model sentence.
- Fixed-target speech may use transcript matching against authored accepted forms.
- Japanese speech targets can use `kanjiForm`, `speechForms` and `speechAliases` so Kanji/Kana/Katakana representations do not false-fail.
- Japanese/Mandarin Hindi pronunciation support remains a learner aid; audio is still the pronunciation authority.
- Romaji/Pinyin may fade as recognition improves.
- Writing remains practice/coverage until genuine assessment exists.
- All units may remain directly accessible while the curriculum/runtime is being tested.

## Code-hygiene mandate

- Git history is the archive. Do not keep superseded implementations in the active tree merely “for reference”.
- Delete helpers/modules with no runtime or test caller unless they are an intentional documented API.
- Prefer one source of truth over compatibility wrappers and duplicated transformations.
- Do not repeatedly scan/sort full learning-event history in target/unit render loops; use the revision index in `src/learning.js`.
- Treat normalized course data as immutable and reuse cached lookups in `src/data.js`.
- Avoid copying the full event array during unrelated UI/preference updates.
- Prefer a coherent change over monkey patches, cloned handlers or parallel “V-next” implementations.
- Before adding a helper, search for an existing equivalent. Before retaining old code, search for an actual caller.
- Performance changes must preserve learning semantics, account isolation and offline behavior.

## Non-negotiable security rules

1. **Never expose secrets.** Do not commit Supabase service-role keys, database passwords, OAuth client secrets, private tokens or credentials.
2. Browser Supabase publishable keys may be public by design; privileged secrets may not.
3. Keep authenticated tables protected by Row Level Security.
4. Do not introduce cross-account or Guest/account leakage.
5. Any Supabase schema change requires a migration and documentation update.
6. Keep GitHub Pages deployable unless an explicit product decision changes hosting.
7. Avoid required paid infrastructure/APIs without explicit approval.

## Course-depth rules

### Japanese

Prioritize Kanji integrated with known vocabulary/grammar, richer grammar contrasts, connected dialogue, longer reading/listening, register contrasts and meaningful upper/advanced production.

### Mandarin

Prioritize tone-pair work, richer 把/被/complement/aspect practice, Hanzi in connected context, connected dialogue/reading and intermediate production.

### Other eight languages

Keep them honestly labelled as foundation courses until the Japanese/Mandarin model is validated. Do not copy advanced labels without equivalent content depth.

## Active module responsibilities

- `src/app.js` — bootstrap/render coordination; exposes runtime version `15.1.0`.
- `src/data.js` — normalization, stages, stable IDs, accepted speech forms and immutable lookup caches.
- `src/session.js` — adaptive review/new target selection and weak/due prioritization.
- `src/course-pack.js` — V15 Course Pack schema/compiler/validator + canonical type registry.
- `src/activity-engine.js` — **active V15.1 typed/interleaved activity planner**.
- `src/learning-flow.js` — integrated unit/context assembly and delegation to the activity engine.
- `src/journey-v14.js` — **active Journey renderer/interaction engine during migration**.
- `src/practice.js` — focused listening, shadowing and fixed-target speaking.
- `src/pronunciation-hi.js` — Japanese/Mandarin Hindi/Devanagari pronunciation support.
- `src/learning.js` — event-indexed evidence, review signals, mastery and XP feedback.
- `src/event-db.js` — IndexedDB event persistence.
- `src/store.js` — scoped state and event-revision invalidation.
- `src/cloud.js` — optional auth/Supabase sync.
- `src/audio.js` — TTS/voice selection.
- `src/course.js` — supporting notes, vocabulary, cards, quiz, writing and progress.
- `src/home.js` — first-visit and returning dashboard.
- `src/auth-ui.js` — optional account UX.
- `src/writing.js` — writing pad.
- `src/utils.js` — shared utilities and speech normalization/matching.

Historical superseded Journey/runtime modules remain in Git history, not the active tree.

V7/V8/V9 remain temporary course-authoring layers during Course Pack parity. Do not add new runtime monkey-patching through them. Once native Course Packs are authoritative, remove the superseded layers.

## Persistence guidance

- IndexedDB remains the learning-event ledger unless intentionally redesigned.
- localStorage is for small scoped state, not growing event history.
- Journey resume currently preserves unit/activity continuity; do not silently discard resume when changing activity order.
- Existing Supabase/account infrastructure must not dictate pedagogy.
- V15 concept migration must preserve target identity unless a dedicated event migration is designed.

## Development workflow

For meaningful code changes:

1. Understand the learning outcome, not only the requested UI.
2. Inspect relevant curriculum data and runtime modules.
3. Update the content/planning contract before layering UI hacks.
4. Search for duplicate/dead implementation before adding code.
5. Add/update tests for the new behavior.
6. Run:
   - `npm run ci`
   - `npm run e2e` for browser/PWA changes
   - `npm run course-packs:check` for Course Pack/type-contract changes
7. Check mobile layout and runtime console errors.
8. Update `README.md`, `PRD.md`, `ARCHITECTURE.md`, `TASKS.md` and `CHANGELOG.md` when contracts change.
9. Use a feature branch + pull request for non-trivial work.
10. Never force-push `main`.

## Definition of done

A learning/runtime change is complete when:

- the requested learner behavior actually works
- the flow is pedagogically coherent rather than merely visually complete
- canonical activity planning remains separate from rendering
- new-target retrieval is spaced when meaningful material permits
- review is tested before re-teaching
- fixed-target vs open-response scoring semantics remain honest
- Japanese/Mandarin scaffolding remains correct where affected
- duplicated/dead code is not left behind unnecessarily
- required offline assets are cached
- relevant tests pass
- security/account isolation is preserved
- documentation states actual capability and limitations

A Course Pack migration change is additionally complete when stable legacy identity is preserved, the compiler is read-only, all references validate and no course-source runtime cutover is implied unless explicitly included.

## When uncertain

Prefer the design that teaches the learner more effectively while remaining technically honest and operationally simple. Do not let obsolete XP/progression/history assumptions or old implementation files block a better architecture.
