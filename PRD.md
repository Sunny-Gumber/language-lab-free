# Product Requirements Document — Language Lab Free

## 1. Product summary

Language Lab Free is a **guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages**.

The product is designed around a learning loop that moves a learner from understanding a situation to hearing connected language, learning useful forms, retrieving them from memory, reading them in context and finally producing a response.

Supported languages:

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

Japanese and Mandarin are the reference courses for deeper staged curriculum design. Korean, English, Hindi, Spanish, French, German, Arabic and Portuguese currently remain foundation courses and should not be presented as equally deep.

## 2. Product goal

The long-term product goal is to help a learner build practical language ability rather than simply finish lessons.

A completed learning path should increasingly train the learner to:

1. understand useful spoken language
2. connect sound, script and meaning
3. retrieve language without first seeing the answer
4. understand connected dialogue and reading
5. respond in their own words
6. revisit weak material over time
7. progress from survival communication toward increasingly complex real-world use

The product must remain honest about course depth. Internal labels such as `advanced` describe curriculum topics and do not by themselves claim JLPT, HSK, CEFR or other certification equivalence.

## 3. V14 integrated learning loop

The normal Journey experience follows this sequence:

```text
Mission
  -> Model conversation / connected input
  -> Learn useful forms
  -> Retrieve from memory
  -> Connected reading when available
  -> Free-response scenario
  -> Stage checkpoint when applicable
  -> Return weak material later
```

### Mission

The learner first sees a real-world can-do goal and the useful concepts involved.

### Model conversation

When authored dialogue exists, the learner hears language in a multi-turn situation before treating individual targets as flashcards.

### Learn useful forms

The learner connects sound, script, meaning and grammar/pronunciation guidance.

Japanese and Mandarin may additionally show:

- Kanji/Hanzi
- Kana/Pinyin
- Romaji/Pinyin scaffolding
- Hindi/Devanagari pronunciation guidance

### Retrieve

The learner must bring the language back from meaning rather than only recognize it passively. Incorrect retrieval should cause the target to return later in the same session or future review.

### Connected reading

Where authored reading exists, familiar language appears inside a longer message. Translation is support, not the first thing shown.

### Free-response scenario

The learner receives a communicative task and responds in their own words. Open responses must **not** be falsely graded against one mandatory model sentence.

Browser speech recognition may display what the browser heard. It remains transcript evidence, not phoneme-level pronunciation, accent, pitch-accent or Mandarin tone scoring.

### Stage checkpoint

At the end of a stage, the learner should see the stage can-do list and perform a connected task rather than only answer isolated multiple-choice questions.

## 4. Adaptive session planning

Journey sessions continue to mix previously seen material with new material.

Current adaptive target mix:

- no scored history: 0 review + 3 new
- recent accuracy below 60%: 4 review + 1 new
- recent accuracy 60–79%: 3 review + 2 new
- recent accuracy 80%+: 2 review + 3 new

Weak and due targets should receive higher review priority.

V14 may place the selected targets inside dialogue, retrieval and production activities instead of presenting the session as a flat list of independent cards.

During the current product test phase, all units may remain directly accessible so advanced units and interactions can be tested without manufacturing learner history.

## 5. Language-specific requirements

### Japanese

The Japanese course should progressively integrate:

- sound foundations
- Hiragana and Katakana
- practical vocabulary and grammar
- Kanji attached to already-known vocabulary/grammar
- connected dialogue
- increasingly long reading
- casual, polite, honorific and humble register
- spontaneous and structured production

Romaji should fade as recognition improves. Hindi pronunciation support may remain visible longer as an optional learner aid. Authored `kanjiForm`, `speechForms` and `speechAliases` must be accepted by speech transcript matching.

### Mandarin Chinese

The Mandarin course should progressively integrate:

- Pinyin and the four tones
- tone-pair awareness
- Hanzi
- practical vocabulary and grammar
- aspect and complement systems
- 把 / 被 and other intermediate structures
- connected dialogue and reading
- increasingly open production

Pinyin may fade as recognition grows. Hindi/Devanagari pronunciation support should preserve tone guidance. Audio remains authoritative for tone learning.

### Other eight languages

The other eight languages currently provide practical foundations using the same learning engine. They should be expanded only after the deeper Japanese/Mandarin course model is proven.

## 6. Navigation

The learning product uses five primary areas:

- **Journey** — guided integrated path and recommended next learning session
- **Practice** — focused listening, shadowing, model-answer speaking and conversation drills
- **Review** — weak/due material, recall and recognition
- **Explore** — lesson notes, language guide, vocabulary and writing
- **Progress** — evidence and course progress

Journey is the normal entry point.

## 7. Speech behavior

Speech transcript matching must use authored accepted forms rather than one surface string.

For example, a Japanese target may accept:

```text
いぬ
犬
イヌ
```

as equivalent transcript representations when those forms belong to the same authored target.

Free-response scenarios are different: the system may capture the transcript but should not assign a percentage merely because the response differs from one sample sentence.

## 8. Learning evidence

The system may continue to record learning events for practice and adaptive decisions.

Important semantics:

- passive playback is not learning mastery evidence
- listening checks can be assessed
- retrieval can be assessed
- fixed-target speech can use transcript-match evidence
- open free response is production practice unless genuine semantic/pronunciation assessment exists
- manual speaking is practice coverage, not a fake 0% failure
- writing is effort/coverage until genuine writing assessment exists

XP is optional product feedback and must not define curriculum completion by itself.

## 9. Persistence and accounts

The current implementation supports:

- Guest learning
- IndexedDB learning-event storage
- Google sign-in where configured
- optional Supabase synchronization
- account-scoped local/cloud data

These systems are infrastructure around the learning experience, not the curriculum model itself.

## 10. Offline and hosting

The application remains a static browser/PWA product hosted from GitHub Pages.

An installed app should cache the runtime modules required for the V14 learning flow, including the connected Journey planner and Hindi pronunciation support.

## 11. Quality gates

Normal development checks:

```bash
npm run ci
npm run e2e
```

V14 regression coverage should include:

- first-visit flow
- honest course-depth presentation
- integrated Journey sequence
- connected dialogue
- retrieval + speaking
- accepted speech forms
- Japanese/Mandarin Hindi pronunciation guidance
- saved V14 activity resume
- account/Guest flows where still enabled
- offline PWA startup

## 12. Current limitation statement

Language Lab Free should currently be described as:

> **A guided adaptive language-learning platform with deepening Japanese and Mandarin paths and foundation courses for eight additional languages.**

It should not yet claim that every supported course can independently take any learner from absolute zero to certified advanced proficiency.