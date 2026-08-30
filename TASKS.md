# TASKS.md

## Current product version

`14.0.0`

Language Lab Free is currently positioned as:

> **A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.**

V14 is a test-phase learning-model rewrite. Backward compatibility with earlier test progress is not a product blocker unless explicitly requested; security, account isolation and secret-handling rules still apply.

## Completed / established

### V14 learning model

- [x] Journey rewritten around an integrated learning flow rather than isolated item screens.
- [x] Mission / can-do orientation before target memorisation.
- [x] Connected multi-turn dialogue when authored content exists.
- [x] Adaptive old/new target selection retained inside the richer flow.
- [x] Active retrieval from meaning.
- [x] Wrong retrieval can schedule a same-session retry.
- [x] Connected reading when authored content exists.
- [x] Free-response production task that does **not** fake-grade every answer against one model sentence.
- [x] Stage checkpoint presentation when checkpoint metadata exists.
- [x] All units directly accessible during the V14 test phase.
- [x] Japanese/Mandarin Hindi/Devanagari pronunciation support retained in the new Journey.
- [x] Romaji/Pinyin scaffolding can fade independently from Hindi pronunciation support.
- [x] Fixed-target speech uses authored `kanjiForm`, `speechForms` and `speechAliases` accepted forms.
- [x] Focused Practice also uses accepted speech forms instead of one surface string.
- [x] Japanese Kanji/Hiragana/Katakana transcript equivalence retained.
- [x] V14 unit/activity resume metadata persists locally.
- [x] V14 runtime is included in the offline/PWA cache.

### Existing platform infrastructure retained

- [x] Mobile-first 10-language platform.
- [x] Guest learning without required sign-in.
- [x] Google sign-in/account flow where configured.
- [x] Optional Supabase account synchronization.
- [x] Guest-to-account progress import.
- [x] Account/Guest progress isolation and RLS-backed cloud ownership.
- [x] IndexedDB learning-event persistence.
- [x] Incremental learning-event cloud sync.
- [x] Conflict-safe course-position synchronization.
- [x] Dirty-field preference synchronization.
- [x] First-visit start experience and returning-learner dashboard.
- [x] Journey / Practice / Review / Explore / Progress navigation.
- [x] Stable structural learning target IDs.
- [x] GitHub Pages deployment from `main`.
- [x] Project-control documentation (`PRD.md`, `ARCHITECTURE.md`, `AGENTS.md`, `TASKS.md`, `CHANGELOG.md`).

## Protected behavior

Even during the test phase, do not regress these contracts without an explicit architectural decision:

- [ ] Never commit service-role keys, database passwords, OAuth client secrets or private tokens.
- [ ] Authenticated users remain isolated by RLS and local account scoping.
- [ ] Guest and signed-in account data do not leak into each other.
- [ ] Learning events remain in IndexedDB rather than a growing localStorage snapshot.
- [ ] Passive audio/home demo does not generate mastery evidence.
- [ ] Manual speaking is not treated as a fake scored failure.
- [ ] Open/free-response speaking is not assigned a percentage against one arbitrary model answer.
- [ ] Fixed-target speech uses accepted authored forms.
- [ ] Japanese browser transcripts such as `犬`, `いぬ` and `イヌ` can represent the same authored spoken target.
- [ ] Hindi pronunciation support remains available for Japanese and Mandarin where source Romaji/Pinyin exists.
- [ ] Writing remains effort/coverage until genuine assessment exists.
- [ ] V14 saved unit/activity can resume after reload when possible.
- [ ] Offline installed app can boot after runtime/service-worker changes.
- [ ] Mobile layouts remain usable on Android/iPhone-sized screens.

## Next curriculum work — highest priority

### Japanese reference course

- [ ] **Kanji integration batch 1: units 13–17.** Add `kanjiForm` to vocabulary/grammar/examples already known in kana; introduce roughly 5–10 useful Kanji per unit rather than cold character lists.
- [ ] Expand grammar-heavy units from four examples toward 6–8 meaningful examples where a grammar point has multiple functions.
- [ ] Add explicit contrast pairs: e.g. polite/plain, て-form functions, passive/causative distinctions, register contrasts.
- [ ] Author explicit `canDo`, scenario and dialogue metadata instead of relying on inferred unit goals.
- [ ] Increase connected reading length gradually by stage.
- [ ] Add more natural multi-turn dialogues, especially upper/advanced workplace, opinion, inference and register situations.
- [ ] Expand upper/advanced vocabulary and input volume before treating the path as genuinely advanced.

### Mandarin reference course

- [ ] Expand 把, 被, potential complements and aspect-marker units with multiple functional examples.
- [ ] Add completion-vs-change-of-state contrasts for `了` and other minimal-pair grammar contrasts.
- [ ] Add dedicated tone-pair drills, including 3rd-tone sandhi patterns.
- [ ] Increase connected dialogue and reading volume by stage.
- [ ] Add more open production around intermediate plateau grammar.

### Both reference courses

- [ ] Author 4–6 line `sampleDialogue` examples for every stage checkpoint.
- [ ] Add longer natural-speed listening material beyond short browser-TTS sentences.
- [ ] Add branching scenario metadata so a learner response can lead to a meaningful next turn instead of only one fixed reply.
- [ ] Build concept relationships between vocabulary, forms, grammar, script, dialogue and reading rather than duplicating disconnected examples.
- [ ] Evaluate FSRS after content structure is stable; scheduling is not the current blocker.

### Other eight languages

- [ ] Keep them honestly labelled as foundation courses.
- [ ] Do not mass-generate shallow “advanced” units.
- [ ] Expand them only after the Japanese/Mandarin reference-course model has been validated.

## Definition of done for V14 learning changes

- [ ] The learner understands a situation before memorising forms.
- [ ] Useful language appears in connected context when content supports it.
- [ ] Retrieval is required, not only recognition.
- [ ] Speaking distinguishes fixed-target transcript matching from open production.
- [ ] Japanese/Mandarin scaffolding remains language-specific.
- [ ] New runtime modules are included in the service worker when needed.
- [ ] `npm run ci` passes.
- [ ] `npm run e2e` passes for browser/PWA-affecting work.
- [ ] Documentation reflects the actual product rather than aspirational marketing.