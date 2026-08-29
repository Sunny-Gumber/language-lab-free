# TASKS.md

## Current product version

`13.1.0`

This file is the lightweight project tracker for ChatGPT/Codex and human contributors. It is intentionally shorter than the PRD and architecture documents.

## Current status

### Completed / established

- [x] Mobile-first multi-language learning platform.
- [x] Guest learning without required sign-in.
- [x] Google sign-in/account flow where configured.
- [x] Optional Supabase account synchronization.
- [x] Guest-to-account progress import.
- [x] Account/Guest progress isolation.
- [x] IndexedDB learning-event persistence.
- [x] Event-derived XP, streak, mastery, coverage and review state.
- [x] Incremental learning-event cloud sync.
- [x] Conflict-safe course-position synchronization.
- [x] Dirty-field preference synchronization.
- [x] Offline-capable PWA application shell.
- [x] First-visit landing/start experience.
- [x] Returning-learner dashboard.
- [x] Journey / Practice / Review / Explore / Progress structure.
- [x] Adaptive old/new Journey session planning.
- [x] Weak/due target review prioritization.
- [x] Same-session retry for difficult material.
- [x] Stable structural learning target IDs.
- [x] Japanese and Mandarin deeper curriculum paths.
- [x] Language-specific scaffolding.
- [x] Hindi/Devanagari pronunciation guidance for Japanese and Mandarin.
- [x] Japanese speech transcript matching accepts common Kanji/Hiragana/Katakana equivalents instead of false-failing the same spoken word.
- [x] Exact paused Journey session resume behavior.
- [x] Desktop Chromium, Android emulation, iPhone WebKit and offline PWA regression coverage.
- [x] GitHub Pages deployment from `main`.
- [x] `PRD.md`, `ARCHITECTURE.md`, `AGENTS.md`, `TASKS.md`, `CHANGELOG.md` project-control documentation.

## Protected behavior — do not break

Any future task touching these areas must include regression checks:

- [ ] Guest mode works without account creation.
- [ ] Google/account sign-in does not destroy local progress.
- [ ] Guest-to-account import does not duplicate or leak another account's progress.
- [ ] Signed-in users remain isolated by RLS and local account scoping.
- [ ] Learning events remain append-oriented and persist in IndexedDB.
- [ ] Passive audio/home demo does not generate XP/mastery.
- [ ] Manual speaking is not treated as a fake scored failure.
- [ ] Japanese browser transcripts such as `犬` must not score 0% against equivalent Kana targets such as `いぬ`.
- [ ] Writing remains effort/coverage until real assessment exists.
- [ ] Unit progression is not reduced to XP-only unlocking.
- [ ] Target IDs remain stable across curriculum reordering where possible.
- [ ] Incremental Supabase sync does not revert to full stale-snapshot overwrites.
- [ ] Course-position conflicts prefer the newest client update timestamp.
- [ ] Preference sync does not overwrite unrelated newer fields.
- [ ] Journey Continue/Resume restores the saved session/item/step.
- [ ] Offline installed app can still boot after runtime/service-worker changes.
- [ ] GitHub Pages production remains compatible with the runtime.
- [ ] Mobile layouts remain usable on Android/iPhone-sized screens.

## Candidate next improvements

These are **not automatically approved roadmap commitments**. They are known product opportunities/limitations already identified in the current product documentation. Move an item into active work only when explicitly selected.

### Learning quality

- [ ] Add dedicated Mandarin tone-pair discrimination exercises.
- [ ] Author explicit `canDo`, scenario/context and branching-task metadata for more units instead of deriving many statements from unit goals.
- [ ] Continue deepening the eight foundation-language courses beyond their current depth.
- [ ] Evaluate a stronger spaced-repetition scheduler only if it can be integrated without corrupting existing event history.

### Pronunciation and speaking

- [ ] Evaluate more accurate pronunciation assessment than browser transcript matching.
- [ ] Keep product wording honest until phoneme/accent/tone scoring is genuinely implemented.

### Writing

- [ ] Evaluate real handwriting/stroke-order assessment before assigning writing accuracy/mastery scores.

### Reliability / maintainability

- [ ] Keep regression tests aligned whenever new runtime modules are added.
- [ ] Keep service-worker asset coverage aligned with required runtime files.
- [ ] Review `.gitignore` if local tooling begins generating additional environment/cache artifacts.
- [ ] Keep `README.md`, `PRD.md`, `ARCHITECTURE.md`, `AGENTS.md` and `CHANGELOG.md` synchronized with future major releases.

## Active work

No new feature is marked active by this document at creation time.

When beginning a new version/task, record it here in this format:

```markdown
### Active: Vxx.x — short title

Goal:
- ...

Acceptance criteria:
- [ ] ...
- [ ] ...

Protected areas affected:
- ...

Required checks:
- [ ] npm run ci
- [ ] npm run e2e
```

## Definition of done checklist

For a normal code change:

- [ ] Requested behavior implemented.
- [ ] Relevant regression test added/updated.
- [ ] `npm run ci` passes.
- [ ] `npm run e2e` passes when browser/PWA behavior is affected.
- [ ] No new console/runtime errors.
- [ ] Mobile behavior checked when UI changed.
- [ ] Offline behavior checked when service-worker/runtime assets changed.
- [ ] Supabase migration/RLS reviewed when schema changed.
- [ ] Documentation updated when product/architecture/contracts changed.
- [ ] `CHANGELOG.md` updated for a release-significant change.