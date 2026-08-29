# Architecture — Language Lab Free

## 1. Overview

Language Lab Free is a static, browser-based PWA hosted on GitHub Pages. The application uses ES modules for the runtime, IndexedDB for append-oriented learning-event storage, localStorage for small scoped state, and optional Supabase services for signed-in synchronization.

The architecture intentionally avoids requiring a traditional application server for normal use.

```text
Browser / PWA
├── UI + learning runtime (ES modules)
├── localStorage (small scoped state)
├── IndexedDB (learning-event ledger)
├── Service Worker (offline application shell)
└── Optional Supabase connection
    ├── Google/Auth session
    ├── profiles
    ├── learning_events
    └── course_positions

GitHub Pages
└── static production hosting from main
```

## 2. Architectural principles

1. **Local-first learner continuity** — Guest learning must work without an account.
2. **Event-derived learning state** — XP, streak, mastery, coverage and review state are derived from learning evidence rather than treated as authoritative mutable counters.
3. **Account isolation** — Guest and signed-in account data must remain scoped and must not leak across identities.
4. **Incremental cloud sync** — synchronize new learning events instead of repeatedly replacing entire progress snapshots.
5. **Static-hosting compatibility** — keep the core application deployable to GitHub Pages.
6. **Offline-capable shell** — an installed app should be able to start with cached runtime assets.
7. **Progressive learning architecture** — Journey is the guiding experience; supporting tools remain available without flattening the product into disconnected utilities.
8. **Small safe changes** — preserve working behavior and existing tests rather than replacing the runtime wholesale.

## 3. Runtime module map

### `src/app.js`

Application bootstrap and high-level render coordination. It wires core controllers and routes primary learner actions into the correct feature areas.

### `src/store.js`

Holds scoped preferences/UI state, exact course positions and the in-memory view of learning events. Account/Guest scoping is critical here.

### `src/event-db.js`

IndexedDB persistence layer for the append-oriented learning-event ledger.

### `src/cloud.js`

Cloud integration layer. Responsibilities include:

- Google authentication integration
- incremental Supabase learning-event sync
- profile/preference sync
- course-position sync
- conflict handling
- Realtime/fallback reconciliation behavior

### `src/learning.js`

Derives learning state from events, including:

- XP
- streaks
- mastery
- practice coverage
- review scheduling signals

This module should remain evidence-driven rather than depending on mutable snapshot counters.

### `src/data.js`

Normalizes course content and provides curriculum/stage-aware targeting. Persistent learning target IDs are structural so curriculum reordering does not automatically invalidate historical evidence.

### `src/session.js`

Builds adaptive Journey sessions. It handles:

- review/new ratios
- due/weak target prioritization
- mistake memory
- same-session retry behavior
- language-specific scaffolding

### `src/audio.js`

Browser TTS and voice-selection behavior.

### `src/practice.js`

Focused listening/speaking practice for previously introduced material.

### `src/course.js`

Detailed lesson notes, language guide, writing, vocabulary, cards, quiz and progress presentation.

### `src/journey.js`

Base Journey path and guided-session behavior.

### `src/resumable-journey.js`

Persists and restores the exact paused Journey session state so Continue/Resume does not silently recalculate another unit/item/step.

### `src/home.js`

Controls the two home states:

- first-visit/new-learner landing-and-start experience
- returning-learner progress dashboard

### `src/auth-ui.js`

User/account UX including:

- sign-in
- onboarding
- Guest-to-account import
- language management

### `src/writing.js`

Touch/stylus/mouse writing practice pad.

### `src/utils.js`

Shared pure utilities.

### `src/pronunciation-hi.js`

Hindi/Devanagari pronunciation guidance layer for supported Japanese and Mandarin learning content.

## 4. Historical content layers

Files from V7/V8/V9 remain as course-content authoring/data layers. They are not the primary runtime architecture and should not be used to reintroduce historical monkey-patching or layered override behavior.

## 5. Persistence architecture

### 5.1 localStorage

Use localStorage only for relatively small scoped state such as:

- account/Guest preferences
- UI state
- sync cursor metadata
- course-position metadata

Do not move a growing learning-event ledger back into localStorage.

### 5.2 IndexedDB

IndexedDB stores learning events locally. This avoids localStorage quota pressure and provides a better model for append-oriented historical learning evidence.

The event ledger is the basis for derived XP/mastery/coverage/review behavior.

### 5.3 Supabase

The active cloud contract uses:

- `profiles`
- `learning_events`
- `course_positions`

See `supabase/README.md` and `supabase/migrations/` for the schema contract and migration history.

Security requirements:

- RLS must remain enabled for user-owned tables.
- authenticated reads/writes must be restricted to the owning user.
- service-role keys, database passwords and OAuth client secrets must never be committed.
- the browser publishable Supabase key is intentionally public.

## 6. Synchronization model

### Learning events

Cloud reconciliation is incremental from the last known server `created_at` cursor rather than a full replacement/download of the complete ledger on every sync.

Event UUIDs provide deduplication.

### Course positions

Exact last unit/item position is synchronized per language. Conflict handling keeps the newest `client_updated_at` value.

### Preferences

Preference sync tracks dirty fields independently so a stale client does not overwrite unrelated newer fields by pushing a complete old snapshot.

### Identity transitions

Guest-to-account import is a deliberate one-time transition. It must not create cross-account leakage or duplicate progress inflation.

## 7. Learning-state architecture

The product records evidence and derives state from that evidence.

Examples:

```text
Learner action
  -> learning event
      -> local IndexedDB
      -> in-memory event view
      -> learning.js derives XP/mastery/coverage/review
      -> optional incremental Supabase sync
```

Important contracts:

- Passive playback/home demo: no XP/mastery.
- Guided listening/check: listening + recognition evidence.
- Reverse retrieval: recall evidence.
- Browser speech recognition: may produce assessed transcript-match evidence.
- Manual speaking: unscored practice coverage.
- Writing: effort/coverage, not fabricated handwriting accuracy.
- Reset: append-only marker invalidating older course events rather than destructive history deletion.

## 8. Adaptive Journey architecture

Journey is built around a sequence:

```text
Context -> Listen -> Understand -> Check -> Recall -> Use -> Complete
```

Session planning mixes old and new targets according to recent scored accuracy, while prioritizing due and weak items.

Mistakes can be retained as confusion metadata and difficult targets can reappear later in the same session.

A persisted paused session records enough queue/item/step state to restore exact learner continuity.

## 9. Offline/PWA architecture

The service worker caches the local application shell and required runtime assets.

The offline strategy should:

- allow an already-installed application to boot offline
- cache local app/runtime assets
- keep required pinned browser dependencies available
- avoid treating Supabase auth/API requests as ordinary static cacheable assets

Any new runtime file required for boot must be considered for service-worker asset coverage.

## 10. Testing architecture

Package scripts:

```bash
npm run check
npm test
npm run ci
npm run e2e
```

`npm run ci` combines syntax/module checks and Node tests.

Playwright regression coverage includes representative desktop/mobile browser flows and PWA/offline behavior.

When changing browser behavior, persistence, authentication, Journey logic, service-worker assets or sync, corresponding regression coverage should be updated.

## 11. Deployment architecture

```text
feature/hotfix branch
  -> tests / pull request / CI
      -> main
          -> GitHub Pages production
```

`main` is production.

The current architecture assumes static hosting. A future server-side component should only be introduced when a product requirement cannot reasonably be met with the current model.

## 12. Architectural risk areas

Changes in these areas deserve extra review and testing:

- account/Guest scoping
- IndexedDB migrations or event semantics
- Supabase schema/RLS
- incremental synchronization and deduplication
- XP/mastery derivation
- target ID stability
- Journey queue/session persistence
- service-worker asset lists/cache versioning
- authentication transitions
- curriculum reordering

## 13. Related documents

- `PRD.md` — product requirements and product behavior.
- `AGENTS.md` — rules for ChatGPT/Codex development.
- `TASKS.md` — current protected areas and candidate work.
- `CHANGELOG.md` — release history.
- `README.md` — user/developer overview and quick reference.
- `supabase/README.md` — active database/sync contract.
