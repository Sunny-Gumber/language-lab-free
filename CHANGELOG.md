# Changelog

All notable product and architecture changes should be recorded here.

## 14.0.0 — 2026-08-30

### Integrated learning-flow rewrite

- Replaced the V13 seven-screen item loop as the normal Journey with a V14 integrated unit experience.
- Added `src/learning-flow.js` as the pedagogical planning seam between course content, adaptive target selection and the Journey renderer.
- Added `src/journey-v14.js` and `journey-v14.css` as the active guided learning experience.
- V14 sessions can combine Mission → model dialogue → target learning → active retrieval → connected reading → free-response production → stage checkpoint → completion.
- Existing adaptive review/new selection remains in use, but selected targets are now embedded in connected activities instead of presented only as isolated cards.
- Wrong retrieval can schedule the target to return later in the same session.
- All units are directly accessible during the current test phase so later Japanese/Mandarin stages can be evaluated without manufacturing progress history.

### Conversation and production

- Added connected multi-turn model dialogue to the Journey when authored V9/V14 dialogue is available.
- Added connected reading when authored unit reading exists.
- Added open free-response scenarios based on unit production goals.
- Free responses are deliberately **not** assigned a fake percentage against one sample answer; the browser may capture what it heard as unscored production evidence.
- Fixed-target speech remains scoreable through transcript matching because the target has an explicit accepted-form set.

### Japanese and Mandarin scaffolding

- Kept Romaji/Pinyin scaffolding fade behavior in the new Journey.
- Kept Hindi/Devanagari pronunciation guidance visible independently for Japanese and Mandarin.
- Practice and V14 fixed-target speech now use authored `kanjiForm`, `speechForms` and `speechAliases` through `bestSpeechMatch()`.
- Preserved Japanese Kanji/Hiragana/Katakana equivalence for authored spoken targets.

### Product positioning

- Product wording is now explicitly: **“A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.”**
- Japanese/Mandarin remain the reference courses for deeper curriculum development.
- The other eight languages remain honestly labelled as foundation courses.
- Internal `advanced` stage labels do not claim JLPT/HSK/certification equivalence.

### Runtime and PWA

- Application version moved to `14.0.0` / `window.LanguageLab.version = 14.0`.
- PWA cache moved to `language-lab-free-v14-0` and now includes `journey-v14.css`, `src/journey-v14.js` and `src/learning-flow.js`.
- Existing Guest/account/IndexedDB/Supabase infrastructure remains available around the rewritten learning experience.

## Unreleased / V13.1 follow-up fixes

- Japanese browser speech matching treats common Kanji, Hiragana and Katakana renderings of the same spoken target as equivalent, preventing false 0% results such as browser-heard `犬` versus lesson target `いぬ`.
- Added a data-driven speech-form contract: authored `kanjiForm`, `speechForms`, and `speechAliases` values are normalized and registered as accepted transcript equivalents.
- Practice targets carry normalized speech-form metadata.
- Transcript matching remains text-recognition evidence only; it does not claim phoneme-level accent, pitch-accent or Mandarin tone grading.

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

- Persisted the exact V13 guided Journey session/item/step.
- Added clearer labels for cross-unit review items.
- Preserved resume support offline.

## 12.0.0 — 2026-08-29

- Added separate new-visitor and returning-learner home states.
- Added a listening demo, honest course-depth information and no-account-required start path.
- Added a returning learner dashboard with Continue Learning, practice and progress information.

## 11.2.0 — 2026-08-29

- Moved learning-event persistence to IndexedDB.
- Hardened account/Guest-scoped local state and Guest-to-account import.
- Implemented incremental learning-event synchronization and conflict-safe position/preference synchronization.
- Added stable target IDs and stage-aware practice data.
- Pinned and cached the Supabase browser runtime for offline startup.
- Added service-worker/offline PWA regression testing.

## 11.0.0 — 2026-08-28

- Replaced the historical layered runtime with a cleaner ES-module architecture.
- Moved learning state toward an event-derived model.
- Added course-position synchronization and stronger mobile/browser regression coverage.

## 10.0.0 — 2026-08-27

- Hardened account-scoped storage, cloud reconciliation, PWA metadata and CI safety.

## 9.0.0 — 2026-08-27

- Added deeper integrated Japanese and Mandarin lesson packs and richer lesson/checkpoint content.

## 8.0.0 — 2026-08-27

- Added expanded Japanese and Mandarin multi-stage curricula and multi-skill mastery support.

## 7.0.0 — 2026-08-27

- Added higher-quality beginner course content and the V7 content layer.

## 6.0.0 — 2026-08-27

- Added guided daily learning behavior, course-selection/dashboard improvements, local-calendar streak handling and offline caching.

For detailed historical implementation commits, use Git history and pull requests.