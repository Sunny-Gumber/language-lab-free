# AGENTS.md

## Purpose

This file is the operating guide for ChatGPT/Codex and other coding agents working on Language Lab Free.

The goal is to improve the product without breaking working learning, account, sync, offline, or deployment behavior.

## Project snapshot

- Product: free, mobile-first, multi-language learning platform.
- Current package version: `13.1.0`.
- Production branch: `main`.
- Production hosting: GitHub Pages from `main`.
- Optional signed-in sync: Supabase.
- Local learning-event persistence: IndexedDB.
- Small account/UI preferences and positions: localStorage plus Supabase where applicable.
- App runtime: browser ES modules under `src/`.
- Tests: Node tests plus Playwright browser/PWA regression coverage.

Before changing code, read:

1. `PRD.md`
2. `ARCHITECTURE.md`
3. `TASKS.md`
4. `CHANGELOG.md`
5. `README.md`
6. `supabase/README.md` for database or sync work

## Non-negotiable rules

1. **Do not remove a working feature unless the task explicitly requires it.**
2. **Preserve backward compatibility for learner data whenever reasonably possible.**
3. **Never expose secrets.** Do not commit Supabase service-role keys, database passwords, OAuth client secrets, private tokens, or credentials.
4. The browser Supabase publishable key may be public by design; privileged secrets may not.
5. Do not change the Supabase schema casually. Any schema change must have a migration and corresponding documentation update.
6. Keep authenticated data protected by Row Level Security.
7. Never reintroduce cross-account or account/Guest progress leakage.
8. Preserve Guest mode and Guest-to-account import behavior.
9. Preserve offline/PWA startup unless the requested change intentionally changes offline support.
10. Preserve exact Journey resume behavior: a paused guided session should resume the saved session/item/step rather than silently recalculating another unit.
11. Preserve event-based learning history. Do not replace append-oriented learning events with mutable snapshot counters.
12. Preserve stable structural learning target IDs. Do not derive persistent IDs from translated display text or raw list positions.
13. Do not award XP/mastery for passive audio playback or the home demo.
14. Manual speaking practice must not be recorded as fake 0% assessed speaking.
15. Writing is practice/coverage until genuine handwriting assessment exists; do not fabricate writing accuracy.
16. Unit progression must not become XP-only. Current readiness uses practice coverage and active mastery evidence.
17. Keep the app mobile-first and usable on desktop, Android-sized layouts, and iPhone-sized layouts.
18. Avoid adding paid infrastructure or required paid APIs without explicit approval.
19. Prefer the smallest safe change over a broad rewrite.
20. Do not replace the existing architecture simply because another framework is fashionable.

## Protected product behavior

Treat these areas as regression-sensitive:

- New-visitor home experience versus returning-learner dashboard.
- Journey / Practice / Review / Explore / Progress navigation model.
- Adaptive old/new session mixing.
- Due and weak-item review prioritization.
- Same-session retry of difficult targets.
- Listening, recognition, recall, speaking/use evidence.
- Japanese and Mandarin language-specific scaffolding.
- Hindi/Devanagari pronunciation guidance for Japanese and Mandarin.
- Google sign-in and account onboarding.
- Guest mode and one-time Guest progress import.
- My Languages and primary-language preference behavior.
- IndexedDB learning-event persistence.
- Incremental Supabase event synchronization.
- Course-position conflict handling using client update timestamps.
- Preference dirty-field synchronization.
- Offline PWA shell and pinned browser runtime dependencies.
- GitHub Pages deployment from `main`.

## Architecture boundaries

Use the existing module responsibilities unless there is a clear reason to change them:

- `src/app.js` — bootstrap and render coordination.
- `src/store.js` — scoped preferences/UI state, exact positions, in-memory event view.
- `src/event-db.js` — IndexedDB learning-event persistence.
- `src/cloud.js` — Google auth, Supabase sync, preference sync, positions, Realtime/fallback reconciliation.
- `src/learning.js` — derived XP, streak, mastery, coverage, review scheduling.
- `src/data.js` — normalized course data, curriculum/stage targeting, structural target IDs.
- `src/session.js` — adaptive review/new planning, weak/due selection, mistake memory, scaffolding.
- `src/audio.js` — TTS and voice selection.
- `src/practice.js` — listening/speaking practice.
- `src/course.js` — lesson notes, guide, writing, vocabulary, cards, quiz, progress.
- `src/journey.js` — base Journey behavior.
- `src/resumable-journey.js` — persisted/resumable Journey session behavior.
- `src/home.js` — first-visit experience and returning dashboard.
- `src/auth-ui.js` — sign-in, onboarding, Guest import, language management.
- `src/writing.js` — touch/stylus/mouse writing pad.
- `src/utils.js` — shared pure utilities.

Historical V7/V8/V9 files are course-content authoring layers, not a license to reintroduce runtime monkey-patching.

## Development workflow

For each implementation task:

1. Understand the requested behavior and acceptance criteria.
2. Inspect the affected implementation and related tests before editing.
3. Check `TASKS.md` for protected behavior and current work.
4. Make the smallest coherent change.
5. Add or update tests for the regression being addressed.
6. Run:
   - `npm run ci`
   - `npm run e2e` when browser/PWA behavior is affected.
7. Check for console/runtime errors and mobile regressions.
8. Update documentation when architecture, product behavior, schema, deployment, or limitations change.
9. Update `CHANGELOG.md` for user-visible or architecture-significant releases.
10. Update `TASKS.md` when a tracked item is completed or a new known issue is discovered.

## Git workflow

- `main` is production.
- Prefer a feature/hotfix branch from current `main` for code changes.
- Use pull requests and CI for non-trivial code changes.
- Documentation-only maintenance may be committed directly when explicitly requested.
- Never force-push `main`.

## Definition of done

A task is complete only when:

- Requested behavior works.
- Existing protected behavior still works.
- Relevant tests pass.
- No new browser/runtime error is introduced.
- Offline behavior is checked when service-worker/runtime assets changed.
- Data migration/sync implications are handled when persistence changed.
- Documentation reflects any changed contract.

## When uncertain

If the requested implementation conflicts with an existing contract, preserve the existing safe behavior and surface the conflict instead of silently deleting or rewriting functionality.
