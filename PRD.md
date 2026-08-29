# Product Requirements Document — Language Lab Free

## 1. Product summary

Language Lab Free is a free, mobile-first language-learning web application designed to help learners build practical language ability through guided, adaptive practice rather than a collection of disconnected study tools.

The product supports:

- Japanese
- Mandarin Chinese
- Korean
- English
- Hindi
- Spanish
- French
- German
- Arabic
- Portuguese

The application works without requiring an account. Signed-in users can optionally synchronize supported learning data across devices through Supabase.

## 2. Product goals

The product should:

1. Help a new learner start quickly without forcing account creation.
2. Guide learners through a clear progressive Journey.
3. Mix new material with review of weak and due material.
4. Build learning around listening, understanding, retrieval, recall and use.
5. Preserve learner progress locally and, when signed in, safely synchronize it across devices.
6. Remain usable as a lightweight PWA with meaningful offline capability.
7. Work well on mobile devices while remaining functional on desktop.
8. Keep the core product free to run and free to use wherever practical.

## 3. Primary user states

### 3.1 New visitor / new learner

A first-time learner should see a clear landing-and-start experience rather than an empty progress dashboard.

The experience should include:

- language selection
- a small listening/demo interaction
- clear explanation of how learning works
- honest indication of course depth
- no-account-required start path

### 3.2 Returning learner

After real practice history exists, the home experience should become a learner dashboard showing useful continuation and progress information, including:

- Continue Learning
- today's practice
- XP goal
- streak
- review needs
- course progress

## 4. Core navigation

The internal learning experience is organized around five primary areas:

- **Journey** — recommended progressive path and adaptive mixed sessions.
- **Practice** — focused listening and speaking work for introduced material.
- **Review** — weak/due material, recall cards and recognition checks.
- **Explore** — lesson notes, language guide, vocabulary and optional writing.
- **Progress** — skill and course progress.

Normal language entry should guide the learner toward Journey rather than presenting all tools as equally important.

## 5. Guided learning sequence

A guided Journey activity follows this learning sequence:

1. **Context** — understand the goal or foundation skill.
2. **Listen** — hear the language before relying heavily on text.
3. **Understand** — connect sound, form and meaning.
4. **Check** — perform recognition/listening comprehension.
5. **Recall** — retrieve language from meaning without first seeing the answer.
6. **Use** — speak or produce the target in a small task.
7. **Complete** — record evidence, schedule weak material to return and continue.

## 6. Adaptive session behavior

Journey sessions should mix old and new material.

Current planning behavior:

- No scored history: 0 review + 3 new.
- Recent accuracy below 60%: 4 review + 1 new.
- Recent accuracy 60–79%: 3 review + 2 new.
- Recent accuracy 80% or higher: 2 review + 3 new.

The system should prioritize due and weak targets for review.

Wrong choices should be retained as useful learning evidence and may return as later distractors. A difficult target should be inserted again later in the same session rather than being treated as learned after one exposure.

A paused Journey session should resume the exact saved session/item/step when possible instead of silently recalculating a different recommended unit.

## 7. Language-specific learning behavior

The framework is shared, but scaffolding should respect the language.

### Japanese

- Start with sound foundations.
- Introduce useful greetings and self-introduction early.
- Interleave kana with communication.
- Fade romanization as listening/recognition becomes stronger.
- Provide learner-friendly Hindi/Devanagari pronunciation support while retaining Romaji.

### Mandarin Chinese

- Begin with tones and Pinyin foundations.
- Introduce basic questions and greetings before character-heavy work.
- Fade Pinyin support gradually as recognition improves.
- Provide learner-friendly Hindi/Devanagari pronunciation support and tone guidance while retaining Pinyin.

### Korean

- Develop useful phrases and Hangul recognition together.

### Arabic / RTL courses

- Develop spoken chunks and right-to-left script familiarity together.

### Latin-script languages

- Move into practical communication sooner because extensive script training is not required.

## 8. Learning evidence and mastery rules

The system should derive learning state from real practice evidence.

Important rules:

- Passive audio playback does not award XP or mastery.
- The homepage demo does not award XP or mastery.
- Active attempts generate learning events.
- Guided listening/check generates listening and recognition evidence.
- Reverse retrieval generates recall evidence.
- Browser speech recognition may generate assessed transcript-match evidence.
- Manual speaking is unscored practice coverage, not a fake failed attempt.
- Writing records effort/coverage until real handwriting assessment exists.
- Repeating the same or lower scored attempt for the same target/skill/day should not repeatedly inflate local XP.
- Derived XP should reduce duplicate multi-device awards by grouping target + skill + day and using the strongest applicable evidence.
- Unit progression should rely on practice coverage and active mastery, not XP alone.

Current communication-weighted assessed mastery emphasis:

- Listening: 40%
- Speaking: 30%
- Recognition: 15%
- Recall: 10%
- Writing: tracked separately as practice coverage until genuine handwriting assessment exists

## 9. Progress persistence

### Local

- `localStorage` stores small account/Guest preferences, UI state, sync cursor and course-position metadata.
- IndexedDB stores append-oriented learning-event history.

### Signed-in cloud sync

Supabase stores:

- `profiles`
- `learning_events`
- `course_positions`

Requirements:

- Learning event synchronization should be incremental rather than repeatedly downloading the complete event ledger.
- Event UUIDs should provide deduplication.
- Course-position conflicts should prefer the newest `client_updated_at` value.
- Preference synchronization should track dirty fields rather than overwriting the server with an entire stale preference snapshot.
- Authenticated users must only be able to read/write their own rows through Row Level Security.

## 10. Account behavior

The product should support:

- no-account Guest use
- Google sign-in where configured
- first-login learning preferences/onboarding
- enabled-language management
- primary-language selection
- one-time Guest-to-account progress import
- isolation between Guest data and different signed-in accounts

Cross-account progress leakage is a critical defect and must not be introduced.

## 11. Offline and PWA requirements

The already-installed application should be able to start offline using its cached application shell and required local runtime assets.

The service worker should cache application/runtime assets but must not cache Supabase auth/API requests as ordinary static content.

Offline support must not depend on an unpinned third-party browser runtime unexpectedly remaining available.

## 12. Quality and compatibility

The application must remain mobile-first and regression-tested across representative browser/device sizes.

Current quality checks:

```bash
npm run ci
npm run e2e
```

Browser regression coverage includes desktop Chromium, Android emulation, iPhone WebKit emulation, account/cross-device behavior, Guest import, IndexedDB persistence, Journey behavior, first-visit/returning-home behavior and offline PWA startup.

## 13. Hosting and deployment constraints

- Production is published from `main` to GitHub Pages.
- The application should remain compatible with static hosting unless a future product requirement explicitly changes that architecture.
- Paid infrastructure or required paid APIs should not be introduced without explicit approval.

## 14. Known limitations

Current limitations that should be represented honestly in the product:

- Browser speech scoring is transcript-match based, not phoneme-level pronunciation/accent/tone scoring.
- Writing does not yet validate handwriting stroke shape/order with AI.
- TTS quality and voice-gender identification vary by browser/OS.
- Review scheduling is a lightweight interval model, not full FSRS.
- Many unit Can-Do statements are derived from unit goals rather than individually authored task metadata.
- Mandarin still needs dedicated tone-pair discrimination beyond general listening/recall Journey work.
- Japanese/Mandarin advanced labels describe the internal course path, not official JLPT/HSK certification.
- Japanese and Mandarin currently have the deepest paths; the other eight languages are primarily foundation courses.

## 15. Success criteria for future changes

A feature or release should be considered successful when it improves learner usefulness without regressing:

- data integrity
- account isolation
- Guest use
- adaptive progression
- offline startup
- mobile usability
- existing tested learning behavior
- free/static-hosting viability unless intentionally changed

See `TASKS.md` for tracked current and candidate follow-up work.
