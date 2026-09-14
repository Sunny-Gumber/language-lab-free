# TASKS.md

## Current product version

`15.1.0`

Language Lab Free is currently positioned as:

> **A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.**

The project remains in active test/development. Learning quality and technical honesty take priority over preserving obsolete screen sequences or shallow compatibility behavior.

## V15 status

### V15.0 — Course Pack foundation

- [x] Add a versioned Course Pack contract for courses, stages, concepts, units and typed activity templates.
- [x] Add a read-only compiler from normalized course data so existing stable target IDs remain unchanged.
- [x] Preserve authored speech-form equivalence, dialogue, reading, production and stage-checkpoint metadata.
- [x] Validate duplicate IDs, unknown types and broken concept/stage references.
- [x] Add Japanese/Mandarin reference-pack regression tests.
- [x] Add CLI checks/build output for migration inspection.
- [ ] Author native Course Pack files for Japanese and Mandarin after the compiled shape is fully reviewed.
- [ ] Switch course loading to native Course Packs after parity tests prove identity/behavior preservation.
- [ ] Remove V7/V8/V9 legacy authoring layers after Course Packs become authoritative.

### V15.1 — typed interleaved Journey planner

- [x] Add `src/activity-engine.js` as the active typed planning seam.
- [x] Give planned steps canonical V15 `activityType` identities while retaining temporary renderer aliases for `src/journey-v14.js`.
- [x] Separate adaptive target selection from pedagogical activity ordering.
- [x] Retrieve review targets before re-teaching them.
- [x] Delay first retrieval of new targets by at least one intervening activity in normal multi-target sessions.
- [x] Allow an explicit `spacingLimited` exception when a single-target session has no meaningful activity available for spacing.
- [x] Preserve wrong-answer same-session retry behavior.
- [x] Update Journey copy so it no longer promises immediate retrieval after target introduction.
- [x] Cache `course-pack.js` and `activity-engine.js` for PWA/offline runtime.
- [x] Add unit tests for interleaving, review-first retrieval, canonical types and spacing-limited sessions.
- [x] Make browser tests navigate by learner state/selector instead of hard-coded screen counts.
- [x] Preserve stable target IDs, learning-event semantics, account/Guest isolation and fixed/open speech distinctions.

### Next V15 runtime work

- [ ] Render additional canonical activity types directly instead of routing everything through V14 aliases.
- [ ] Add a real recognition activity (`multiple-choice`) that can serve as contextual interleaving without revealing a new target.
- [ ] Add authored/generated `cloze` support with strict answer validation.
- [ ] Add typed listening checks (`listening-choice` / `listening-dictation`).
- [ ] Move the renderer from V14 aliases toward canonical `activityType` dispatch after parity is proven.
- [ ] Improve resume persistence so an in-progress adaptive plan can survive evidence changes without relying only on a rebuilt activity index.
- [ ] Upgrade review scheduling around concept × skill evidence while keeping IndexedDB as source of truth.
- [ ] Add deterministic placement/competency mapping before any AI-assisted placement extension.
- [ ] Add reading vocabulary capture with source-sentence context.
- [ ] Add optional bounded AI for explanations, generated exercises and multi-turn roleplay; AI must not directly set mastery or progression.

## Existing platform behavior to protect

- [x] Mobile-first 10-language platform.
- [x] Guest learning without required sign-in.
- [x] Optional Supabase account synchronization.
- [x] Guest-to-account progress import.
- [x] Account/Guest progress isolation and RLS-backed ownership.
- [x] IndexedDB learning-event persistence.
- [x] Incremental event sync and conflict-safe course-position synchronization.
- [x] Journey / Practice / Review / Explore / Progress navigation.
- [x] Stable structural learning target IDs.
- [x] Connected dialogue and reading where authored.
- [x] Same-session retry for incorrect retrieval.
- [x] Free-response production without fake model-answer percentages.
- [x] Fixed-target speech using accepted authored forms.
- [x] Japanese Kanji/Hiragana/Katakana transcript equivalence.
- [x] Japanese/Mandarin Hindi/Devanagari pronunciation support.
- [x] Romaji/Pinyin scaffold fading independent of Hindi pronunciation support.
- [x] GitHub Pages deployment and offline PWA startup.

## Protected behavior

Do not regress these contracts without an explicit architectural decision:

- [ ] Never commit service-role keys, database passwords, OAuth secrets or private tokens.
- [ ] Authenticated data remains isolated by RLS and local account scoping.
- [ ] Guest and signed-in account data do not leak into each other.
- [ ] Learning events remain in IndexedDB rather than an ever-growing localStorage snapshot.
- [ ] Passive audio does not generate mastery evidence.
- [ ] Manual speaking is not treated as a fake scored failure.
- [ ] Open speaking is not assigned a percentage against one arbitrary sentence.
- [ ] Fixed-target speech uses authored accepted forms.
- [ ] Japanese transcripts such as `犬`, `いぬ` and `イヌ` can represent the same authored spoken target.
- [ ] Hindi pronunciation support remains available for Japanese/Mandarin where source Romaji/Pinyin exists.
- [ ] Writing remains effort/coverage until genuine assessment exists.
- [ ] Journey sessions can resume when possible.
- [ ] Offline installed app can boot after runtime/service-worker changes.
- [ ] Mobile layouts remain usable on Android/iPhone-sized screens.

## Highest-priority curriculum work

### Japanese reference course

- [ ] **Kanji integration batch 1: units 13–17.** Add `kanjiForm` to already-known vocabulary/grammar/examples; introduce roughly 5–10 useful Kanji per unit rather than cold lists.
- [ ] Expand grammar-heavy units toward 6–8 meaningful examples where functions differ.
- [ ] Add explicit contrasts: polite/plain, て-form functions, passive/causative, register.
- [ ] Author explicit `canDo`, scenario and dialogue metadata.
- [ ] Increase connected reading length gradually by stage.
- [ ] Add more natural upper/advanced multi-turn dialogue.
- [ ] Expand upper/advanced vocabulary and input volume.

### Mandarin reference course

- [ ] Expand 把, 被, potential complements and aspect-marker practice.
- [ ] Add completion-vs-change-of-state contrasts for `了`.
- [ ] Add dedicated tone-pair drills including third-tone sandhi.
- [ ] Increase connected dialogue and reading volume.
- [ ] Add more open production around intermediate plateau grammar.

### Both reference courses

- [ ] Author 4–6 line sample dialogues for every stage checkpoint.
- [ ] Add longer natural-speed listening beyond short browser TTS.
- [ ] Add branching scenario metadata.
- [ ] Build explicit concept relationships among vocabulary, grammar, script, dialogue and reading.
- [ ] Evaluate FSRS only after content/concept structure stabilizes.

### Other eight languages

- [ ] Keep them honestly labelled as foundation courses.
- [ ] Do not mass-generate shallow advanced units.
- [ ] Expand after the Japanese/Mandarin reference model is validated.

## Definition of done for learning/runtime changes

- [ ] Learner behavior actually works, not only UI presentation.
- [ ] Context precedes memorisation when content supports it.
- [ ] New-target retrieval is meaningfully spaced when possible.
- [ ] Review is tested before re-teaching.
- [ ] Retrieval is required, not only recognition.
- [ ] Fixed-target vs open-response scoring remains honest.
- [ ] Japanese/Mandarin scaffolding remains language-specific.
- [ ] New runtime modules are included in the service worker when needed.
- [ ] `npm run ci` passes.
- [ ] `npm run e2e` passes for browser/PWA-affecting work.
- [ ] Documentation reflects actual capability rather than aspirational marketing.
