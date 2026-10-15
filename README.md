# Il Mazzo

Italian flashcards in a single HTML file: nouns, regular and irregular verbs, adjectives and everyday phrases, with progress tracking, history notes and spoken Italian. No server, no accounts, no build step — open `index.html` and play.

## Sections

| Section | Items | What you practise |
|---|---|---|
| Sostantivi | 831 nouns | the noun with its definite article (*il pane, lo zaino, l'acqua*) |
| Verbi regolari | 150 verbs | present-tense conjugations, or just the infinitive |
| Verbi irregolari | 50 verbs | the most common verbs that are irregular in the present |
| Aggettivi | 100 adjectives | the dictionary form, or every gender and number |
| Frasi | 50 phrases | everyday expressions, with *tu* and *Lei* forms kept distinct |

Every section works in three directions — English → Italian, Italian → English, and Listening (hear the Italian, type it) — and each direction keeps its own progress.

## Features

- Themes, quick picks (Random, Weakest), hand-picking, and "the most common" by frequency
- Deck size and Focus, to grow or narrow a round while playing
- A history note on every item, plus your own word associations
- Reference panels (verb endings, irregular patterns, adjective agreement, *tu* or *Lei*) and a *Da ripassare* list of your weakest items
- Practise the cards you missed, as a filter on the round you just played
- Spoken Italian using the device's own voices, and stress-marked pronunciation for verbs
- Back up and restore all progress to a file

## Your progress

Progress, associations and voice settings are saved in the browser's local storage — never in this repository. Each browser keeps its own copy, and so does each address the page is opened from, so use **back up** and **restore** on the setup screen to move progress between them (for example, from a local copy to GitHub Pages).

## Using it

- **Locally:** clone or download the repository and open `index.html` in a browser.
- **Online:** in the repository's Settings → Pages, choose *Deploy from a branch*, then `main` and `/ (root)`. The app appears at `https://<username>.github.io/<repository>/`. On a free GitHub plan, Pages needs the repository to be public.
- **Spoken Italian** needs an Italian voice on the device. On a Mac: System Settings → Accessibility → Spoken Content → ⓘ next to System voice → Italiano, then download a Premium or Enhanced voice.

## Development

Everything — markup, styles, data and code — lives in `index.html`. The tests load it in [jsdom](https://github.com/jsdom/jsdom) and play it the way a person would: clicking, typing answers and checking what appears.

```sh
npm install
npm test                    # every suite, one line each
npm test -- audio nouns     # only suites whose name contains "audio" or "nouns"
node tests/audio.test.js    # one suite, listing every check
```

Node 20 or later is required. GitHub Actions runs the full suite on every push and pull request (`.github/workflows/tests.yml`).

### What the tests cover

- **Against the originals:** `regular-verbs-vs-original` and `adjectives-vs-original` load the original standalone games from `tests/fixtures/` side by side with Il Mazzo and compare every card, answer verdict, ranking and saved-progress format — over 23,000 comparisons — so the ports can't quietly drift.
- **Each section:** `nouns-core`, `nouns-features`, `regular-verbs`, `regular-verbs-additions`, `irregular-verbs`, `adjectives`, `phrases`.
- **Shared features:** `audio`, `practise-missed`, `weakest-panel`, `backup-restore`, `grid-order`, `verb-notes`, `start-begin-labels`.

## Project layout

```
index.html                   the whole app
tests/
  run-all.js                 runs every suite; exits non-zero if any fails
  harness.js                 loads index.html in jsdom, plus small helpers
  *.test.js                  the suites
  fixtures/                  the original verb and adjective games, and the list of added verbs
.github/workflows/tests.yml  continuous integration
```

## Data

Frequency rankings combine written Italian (wordfreq), spoken Italian (OpenSubtitles 2018 word counts) and the Italian Universal Dependencies treebanks, which are used to count only true noun, verb or adjective uses of each form. The phrases were chosen by cross-checking native teachers' and language publishers' lists of everyday Italian with research on spoken Italian. Notes on method sit beside each data block in `index.html`.
