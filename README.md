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

- **Ripasso del giorno** — spaced repetition across all five sections: every item you practise is scheduled, and the daily review brings back exactly what's due (see below)
- Themes, quick picks (Random, Weakest), hand-picking, and "the most common" by frequency
- Deck size and Focus, to grow or narrow a round while playing
- A history note on every item, plus your own word associations
- Reference panels (verb endings, irregular patterns, adjective agreement, *tu* or *Lei*) and a *Da ripassare* list of your weakest items
- Practise the cards you missed, as a filter on the round you just played
- Spoken Italian using the device's own voices, and stress-marked pronunciation for verbs
- Back up and restore all progress to a file

## Ripasso del giorno

Every item you answer gets a review date, separately for each direction. A correct answer moves it up a box and pushes it further out — 1, 2, 4, 8, 16, 32, then 64 days — while a wrong answer brings it back tomorrow. Only the first correct answer of the day moves an item up, so six right conjugations of one verb count once. Progress from before the schedule existed seeds it: weak items come due straight away and solid ones are spread over the following days.

The strip at the top of the setup screen shows what's due today in the chosen direction, by section. **Start** mixes it all into one round (up to 30 cards to begin with; Deck size reaches the rest), each card labelled with its section and checked by that section's rules. Schedules are part of backups, and resetting a section's progress clears its schedule.

## Your progress

Progress, associations and voice settings are saved in the browser's local storage — never in this repository. Each browser keeps its own copy, and so does each address the page is opened from, so use **back up** and **restore** on the setup screen to move progress between them (for example, from a local copy to GitHub Pages).

## Using it

- **Locally:** clone or download the repository and open `index.html` in a browser.
- **Online:** in the repository's Settings → Pages, set **Source** to **GitHub Actions**. The workflow then publishes `main` after every successful test run, at `https://<username>.github.io/<repository>/`. On a free GitHub plan, Pages needs the repository to be public.
- **Spoken Italian** needs an Italian voice on the device. On a Mac: System Settings → Accessibility → Spoken Content → ⓘ next to System voice → Italiano, then download a Premium or Enhanced voice.

## Development

Everything — markup, styles, data and code — lives in `index.html`. The tests load it in [jsdom](https://github.com/jsdom/jsdom) and play it the way a person would: clicking, typing answers and checking what appears.

```sh
npm install
npm test                    # every suite, one line each
npm test -- audio nouns     # only suites whose name contains "audio" or "nouns"
node tests/audio.test.js    # one suite, listing every check
```

Node 20 or later is required.

### Continuous integration and publishing

`.github/workflows/tests.yml` runs the full suite on every push, on any branch:

- **A push to `main`** (for example from Claude Code on a laptop) is tested, then published to GitHub Pages.
- **A push to a `claude/…` branch** (Claude Code on the web works on these) is tested; if everything passes, it's merged into `main` automatically, and `main` is re-tested and published.
- **Anything that fails** stays where it is — a red cross on the commit, and the live site untouched. A merge that conflicts with `main` also stops there.

### What the tests cover

- **Against the originals:** `regular-verbs-vs-original` and `adjectives-vs-original` load the original standalone games from `tests/fixtures/` side by side with Il Mazzo and compare every card, answer verdict, ranking and saved-progress format — over 23,000 comparisons — so the ports can't quietly drift.
- **Each section:** `nouns-core`, `nouns-features`, `regular-verbs`, `regular-verbs-additions`, `irregular-verbs`, `adjectives`, `phrases`.
- **Shared features:** `ripasso` (the schedule, seeding, the mixed review — with the clock under test control), `audio`, `practise-missed`, `weakest-panel`, `backup-restore`, `grid-order`, `verb-notes`, `start-begin-labels`.

## Project layout

```
index.html                   the whole app
CLAUDE.md                    project rules and landmarks for Claude Code
tests/
  run-all.js                 runs every suite; exits non-zero if any fails
  harness.js                 loads index.html in jsdom, plus small helpers
  *.test.js                  the suites
  fixtures/                  the original verb and adjective games, and the list of added verbs
.github/workflows/tests.yml  continuous integration
```

## Data

Frequency rankings combine written Italian (wordfreq), spoken Italian (OpenSubtitles 2018 word counts) and the Italian Universal Dependencies treebanks, which are used to count only true noun, verb or adjective uses of each form. The phrases were chosen by cross-checking native teachers' and language publishers' lists of everyday Italian with research on spoken Italian. Notes on method sit beside each data block in `index.html`.
