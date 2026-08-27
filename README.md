# Language Lab Free

Free interactive multi-language learning platform.

## Languages

Japanese, Mandarin Chinese, Korean, English, Hindi, Spanish, French, German, Arabic, and Portuguese.

## Current features

- Language-specific beginner lessons
- Browser text-to-speech
- Slow listening practice
- Mobile handwriting / tracing canvas
- Pronunciation and writing-system guides
- Searchable vocabulary and favorites
- Phrase builder
- Browser speech-recognition practice where supported
- Flashcards and quizzes
- XP, streaks, weak-item review, and per-language mastery
- Local browser progress
- Installable/offline-capable PWA

## Free hosting with GitHub Pages

This repository is designed to publish directly from the `main` branch.

In GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/ (root)` → Save**.

The expected project URL is:

`https://sunny-gumber.github.io/language-lab-free/`

## Branch workflow

- `main` — stable production website
- `dev` — development and testing

Larger features can use `feature/...` branches and merge through pull requests.

## Progress storage

The current version uses browser `localStorage`, so guest progress stays on the same browser/device. A future phase will add optional Supabase authentication and cloud sync.

## Important limitations

Speech scoring currently compares the speech-recognition transcript with the target text; it is not phoneme-level accent scoring. Handwriting is an interactive practice canvas and does not yet perform AI stroke recognition.

## License

MIT
