# Changelog

All notable product and architecture changes should be recorded here.

This changelog was initialized from the repository's existing release commits and current documentation. It is not intended to reproduce every historical commit.

## Unreleased

### Documentation

- Added `AGENTS.md` for ChatGPT/Codex development rules and regression-sensitive contracts.
- Added `PRD.md` for current product requirements.
- Added `ARCHITECTURE.md` for runtime, data, sync, offline and deployment architecture.
- Added `TASKS.md` for protected behavior and candidate follow-up work.
- Added this release changelog.

## 13.1.0 — 2026-08-29

### Adaptive communicative Journey

- Introduced a progressive Journey centered on Context -> Listen -> Understand -> Check -> Recall -> Use -> Complete.
- Added adaptive old/new session mixing based on recent scored accuracy.
- Prioritized weak and due targets for review.
- Added recall and speaking/use steps.
- Added mistake memory and same-session retry behavior.
- Added language-specific scaffolding and curriculum ordering.
- Strengthened stable structural learning target IDs.

### Pronunciation support

- Added learner-friendly Hindi/Devanagari pronunciation guidance for Japanese and Mandarin while retaining Romaji/Pinyin.
- Added Mandarin tone guidance.
- Included browser and offline/PWA coverage for the pronunciation layer.

### Journey resume hardening

- Persisted the exact guided Journey session rather than recalculating another recommended unit after leaving/reloading.
- Added exact paused item/step restoration.
- Added clearer labels for cross-unit review items.
- Preserved resume support offline.

## 12.0.0 — 2026-08-29

### Home experience redesign

- Added separate home states for new visitors and returning learners.
- New learners receive a landing-and-start experience instead of an empty dashboard.
- Added an interactive listening demo, language selection, product explanation and no-account-required start path.
- Returning learners receive a progress-oriented dashboard with continuation and practice information.
- Added responsive home presentation and regression coverage.

## 11.2.0 — 2026-08-29

### Sync, identity, offline and mastery hardening

- Moved learning-event persistence to IndexedDB.
- Hardened account/Guest-scoped local state.
- Implemented incremental learning-event synchronization.
- Improved conflict-safe preference synchronization.
- Added stable target IDs and stage-aware practice data.
- Corrected mastery calculations and reduced duplicate XP behavior.
- Corrected writing progress semantics and reset behavior.
- Added stage-aware practice and conversation behavior.
- Added Guest-to-account progress import.
- Hardened exact course-position conflict handling.
- Pinned and cached the Supabase browser runtime for offline startup.
- Added service-worker/offline PWA regression testing.

## 11.0.0 — 2026-08-28

### Clean architecture and event-based learning core

- Replaced the historical layered runtime with a cleaner ES-module architecture.
- Moved learning state toward an event-derived model.
- Added exact course-position synchronization.
- Strengthened mobile-first UI behavior.
- Added V11 Supabase migrations and stronger CI checks.
- Removed obsolete legacy progress schema after the event-based contract became active.
- Added browser regression coverage across desktop, Android and iPhone flows.

## 10.0.0 — 2026-08-27

### Architecture hardening

- Hardened account-scoped storage and cloud reconciliation.
- Improved service-worker isolation and PWA metadata.
- Strengthened learning preferences and skill coverage handling.
- Improved CI regression safety.

## 9.0.0 — 2026-08-27

### Japanese and Mandarin lesson quality

- Added deeper integrated Japanese and Mandarin lesson packs.
- Added richer lesson/checkpoint UI.
- Improved offline caching for integrated lesson assets.

## 8.0.0 — 2026-08-27

### Multi-skill mastery and advanced paths

- Added expanded Japanese and Mandarin multi-stage curricula.
- Added a multi-skill mastery engine.
- Added adaptive skill-practice layers and supporting offline assets.

## 7.0.0 — 2026-08-27

### Course-content expansion

- Added higher-quality beginner course content.
- Added and cached the V7 content layer for offline use.

## 6.0.0 — 2026-08-27

### Adaptive daily learning experience

- Added guided daily learning behavior.
- Improved daily mission/selected-language stability.
- Added course-selection/dashboard refresh behavior.
- Corrected local-calendar streak handling.
- Improved Continue Learning position handling.
- Preserved offline caching for the completed V6 experience.

## Historical fixes leading into V6+

Notable pre-V6/V6-era maintenance included:

- reduced fallback cloud reconciliation frequency to hourly
- account-scoped progress isolation fixes
- first-login learning-preference onboarding
- My Languages management and mobile layout hardening
- communication-first listening/speaking and voice-selection behavior

For detailed historical implementation commits, use the Git history and pull requests.
