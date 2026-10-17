# Il Mazzo

Italian flashcards in a single HTML file: nouns, regular and irregular verbs, adjectives and everyday phrases, with progress tracking, history notes and spoken Italian — and an illustrated story to read, built from the words you're learning. No server, no accounts, no build step — open `index.html` and play.

## Sections

| Section | Items | What you practise |
|---|---|---|
| Sostantivi | 831 nouns | the noun with its definite article (*il pane, lo zaino, l'acqua*) |
| Verbi regolari | 150 verbs | present-tense conjugations, or just the infinitive |
| Verbi irregolari | 50 verbs | the most common verbs that are irregular in the present |
| Aggettivi | 100 adjectives | the dictionary form, or every gender and number |
| Frasi | 50 phrases | everyday expressions, with *tu* and *Lei* forms kept distinct |
| Racconto | 3 chapters | *La casa di pietra*, an illustrated story to read, plus the 30 words it teaches |

Every card section works in three directions — English → Italian, Italian → English, and Listening (hear the Italian, type it) — and each direction keeps its own progress.

## Features

- **Ripasso del giorno** — spaced repetition across every section: every item you practise is scheduled, and the daily review brings back exactly what's due (see below)
- Themes, quick picks (Random, Weakest), hand-picking, and "the most common" by frequency
- Deck size and Focus, to grow or narrow a round while playing
- A history note on every item, plus your own word associations
- Reference panels (verb endings, irregular patterns, adjective agreement, *tu* or *Lei*) and a *Da ripassare* list of your weakest items
- Practise the cards you missed, as a filter on the round you just played
- Spoken Italian using the device's own voices, and stress-marked pronunciation for verbs
- Back up and restore all progress to a file
- **Racconto** — a story to read, in which every word links to its card (see below)

## Ripasso del giorno

Every item you answer gets a review date, separately for each direction. A correct answer moves it up a box and pushes it further out — 1, 2, 4, 8, 16, 32, then 64 days — while a wrong answer brings it back tomorrow. Only the first correct answer of the day moves an item up, so six right conjugations of one verb count once. Progress from before the schedule existed seeds it: weak items come due straight away and solid ones are spread over the following days.

The strip at the top of the setup screen shows what's due today in the chosen direction, by section. **Start** mixes it all into one round (up to 30 cards to begin with; Deck size reaches the rest), each card labelled with its section and checked by that section's rules. Schedules are part of backups, and resetting a section's progress clears its schedule.

## Racconto: *La casa di pietra*

A diary in Italian, in the present tense, set in Boarezzo in the Valganna. The narrator is you: you arrive with the key to an old stone house, and a letter from 1923 turns up behind a loose stone. About 70% of the words come from the deck; the rest are taught as you read.

- **The map** charts the journey from Malpensa up the valley, with a pin for each chapter. Finishing a chapter's questions stamps it *Letto*.
- **Every word can be tapped.** A word from the deck shows its card's meaning, its dictionary form (and person, for a verb), its history note and whether you know it yet; the story's own words have notes too; small words like *di* or *alla* just show a meaning. **+ Ripasso** puts the word on today's review.
- **Underlines show where you stand:** none for words you know (box 2 or above in either direction), dotted for words you're learning, dashed for deck words you haven't practised, wavy for words the story teaches.
- **The readiness meter** on each chapter is the share of its words you already know.
- **Listening and translation:** ▶ reads a sentence aloud, *Ascolta il capitolo* reads the whole chapter with each sentence highlighted, and EN reveals a sentence's English.
- **After each chapter:** three questions, and *Trova la parola* — find the word that means "key" by tapping it in the text. *Esercitati* then practises every word in the chapter as one mixed round.
- The story's own words are a section of their own (drilled like phrases), so they come back in Ripasso del giorno with everything else.

### Writing a chapter

Chapters live in `STORY_CHAPTERS` in `index.html`; words the deck doesn't have live in `STORY_WORDS`, each with a meaning and a history note. A chapter is:

```js
{ id: 'c4', title: 'Domenica', place: 'Boarezzo', art: 'c4',
  paragraphs: [[['Italian sentence.', 'Its English.'], …], …],
  senses: { case: 'nouns:casa' },          // plurals, and words that could be read two ways
  glossary: { camino: 'camino' },          // words (or phrases) taught from STORY_WORDS
  context: { paese: 'the village — …' },   // optional: what a word means here
  questions: [{ q: '…?', options: ['right', 'wrong', 'wrong'], answer: 0 }, …,
              { find: 'nouns:chiave', q: 'Trova la parola che vuol dire «key».' }] }
```

It also needs a picture (a drawing function in `STORY_ART`) and a pin position in `STORY_PINS`. Each word in the text is matched in this order: the chapter's `senses`, its `glossary`, names, then the deck — after an article or preposition a noun is preferred, so *la porta* is the door rather than *porta*, "carries". The start-up check warns about any word left unexplained, a sense or glossary entry pointing nowhere, or a *Trova la parola* word missing from the text, and the tests fail on any warning.

## Syncing across devices

Progress syncs between devices through a small API of Il Mazzo's own — a Cloudflare Worker with a D1 (SQLite) database, both on Cloudflare's free plan. The browser stays the working copy, so the app stays instant and works offline; the server holds the latest agreed copy.

**How copies merge.** Merging is three-way: each device remembers the copy it last agreed with the server, so changes on each side since then can be told apart and both kept. Answer counts add up (*casa* seen 3 times, then twice more on one laptop and once on the other, is 6); review schedules keep the most recently answered record; associations keep whichever side changed; a chapter read on either device counts. On a device's first sync, when there's no shared copy yet, the larger count is kept instead, so the same backup restored on two devices isn't counted twice. A reset or a restore raises that store's *epoch* and wins outright. Voice, speed, last section and review direction stay per device.

**The server** (`worker/`) stores each progress store's JSON and a version number. A save names the version it was based on and is refused if another device saved in between — that device fetches, merges again and retries — so two devices saving at once can't overwrite each other. Requests carry a sync key; the server stores only its SHA-256 hash.

**Using it.** There's nothing to set up and nothing to see: syncing is invisible. Il Mazzo is a personal site, so the app has one built-in sync key and every device that opens it records to the same place — when the app opens, when the setup screen comes back after practice, and when the tab is hidden, never in the middle of a round. Offline, it simply catches up later. A device's existing progress is merged in the first time it connects. The trade-off: the key is public with the code, so anyone with the site's address could read or change the progress. Sync works on the published site (the API only accepts browser requests from it, or from `localhost`).

**To deploy the API**, add to the repository's Settings → Secrets and variables → Actions: the secrets `CLOUDFLARE_API_TOKEN` (the *Edit Cloudflare Workers* template plus *Account · D1 · Edit*) and `CLOUDFLARE_ACCOUNT_ID`, and the variable `D1_DATABASE_ID` (the ID of a D1 database named `il-mazzo`). The workflow then applies the database migrations and deploys the Worker after every successful test run on `main`.

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
- **The story:** `story` — every word explained and read the right way (*porta* the door, *legge* "reads"), the reader, word cards, + Ripasso, reading aloud, the questions and stamp, chapter practice, and backups.
- **Sync:** `sync-merge` (what syncs, the merge rules, epochs, and two devices syncing through a stand-in server), `sync-client` (the Sync panel and sync step against the real Worker: turning on, linking, two devices syncing at the same instant, an answer saved mid-sync, offline, deleting) and `sync-worker` (the API against real SQLite — browser access, key hashing, the version check including two simultaneous saves, validation, and two app instances syncing through it).
- **Shared features:** `ripasso` (the schedule, seeding, the mixed review — with the clock under test control), `audio`, `practise-missed`, `weakest-panel`, `backup-restore`, `grid-order`, `verb-notes`, `start-begin-labels`.

## Project layout

```
index.html                   the whole app
worker/                      the sync API (Cloudflare Worker + D1 migrations)
CLAUDE.md                    project rules and landmarks for Claude Code
tests/
  run-all.js                 runs every suite; exits non-zero if any fails
  harness.js                 loads index.html in jsdom, plus small helpers
  *.test.js                  the suites
  fixtures/                  the original verb and adjective games, and the list of added verbs
.github/workflows/tests.yml  continuous integration
```

## Data

Frequency rankings combine written Italian (wordfreq), spoken Italian (OpenSubtitles 2018 word counts) and the Italian Universal Dependencies treebanks, which are used to count only true noun, verb or adjective uses of each form. The phrases were chosen by cross-checking native teachers' and language publishers' lists of everyday Italian with research on spoken Italian. Notes on method sit beside each data block in `index.html`. The story and its illustrations are original to Il Mazzo.
