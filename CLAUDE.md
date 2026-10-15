# Il Mazzo — guide for Claude Code

Italian flashcards for one learner (Nassim), in a single HTML file served by GitHub Pages at https://nassim55.github.io/il-mazzo/. Read `README.md` for what the app does.

## Workflow for every change

1. Make the change in `index.html` (markup, CSS, data and code all live there).
2. Add or update tests in `tests/` for any new behaviour.
3. Run `npm test` — **every suite must pass** before committing. Run one suite with `node tests/<name>.test.js` to see each check.
4. Commit with a descriptive message and push:
   - **On a laptop** (Claude Code desktop or terminal): push to `main`. GitHub Actions re-tests it and publishes the site.
   - **In Claude Code on the web**: push your `claude/…` branch as usual. GitHub Actions tests it and, if every suite passes, merges it into `main` and publishes. If a test fails, the branch is not merged — fix it and push again.
   The live site updates a minute or two after `main` passes.

If a suite fails, fix the cause; never weaken a test to make it pass unless the behaviour change was requested (then update the test and say why in the commit).

## Rules that protect the user's data

- **Never rename saved-data keys.** Progress lives in each browser's localStorage under keys such as `sostantivi-stats-v1`, `verbi-regolari-stats` (old `{attempts, wrongs}` format — keep it), `aggettivi-stats-v1`, `frasi-stats-v1`, their `-iten` / `-listen` variants, the `:srs` review schedules, the `*-assoc-v1` association keys, `flipcards-subject`, `mazzo-audio-v1` and `mazzo-ripasso-dir`. Renaming any of them silently wipes the user's history.
- New saved data goes in new keys, and must be added to `storageKeys()` so backups include it.
- `tests/fixtures/original-*.html` are the user's original standalone games, used to prove the ports haven't drifted. Never edit them.

## Behaviour conventions

- No regressions: existing features keep working exactly as before unless the user asks otherwise.
- British English in UI text and notes ("practise" as the verb, "colour").
- Answers stay lenient where it doesn't matter (accents, punctuation, capitals) and strict where it does (articles for nouns, *tu*/*Lei* in phrases, pronouns for verbs).
- History notes: accurate etymology, English cognates, links to other words in the deck, false friends flagged; say "uncertain"/"perhaps" when the origin is disputed.
- Verb pronunciations: the syllabifier marks stress by rule; verbs with early or unusual stress need a `pronMap` entry (see `abitare`, `significare`, `creare`).
- Frequency rankings blend written (wordfreq) and spoken (OpenSubtitles) counts, weighted by part-of-speech share in the Italian UD treebanks; method notes sit beside each data block.
- Layout must work from desktop down to 320px phones with no sideways scroll.

## Code landmarks (search for these in `index.html`)

- `SUBJECTS` — the five sections (items, themes, frequency order, stats/association keys, panel).
- `cardsForItem`, `render`, `handleSubmit` — card building, display and checking; checkers are `checkAnswer` (nouns), `checkVerbAnswer`, `checkAdjAnswer`, `checkPhraseAnswer`.
- `startGame`, `sessionPool` / `sessionMaxDeck` — sessions; Deck size, Focus and "practise the ones I missed" filter the session pool.
- `srsAnswer`, `dueList`, `startRipasso`, `setCardContext` — spaced repetition and the mixed Ripasso del giorno review.
- `speak`, `chosenVoice`, `renderAudioRow` — Italian text-to-speech and Listening mode.
- `buildBackup`, `restoreFromText`, `storageKeys` — backup and restore.
- `validateSubjects` (runs at start-up) warns in the console about data problems; the tests fail on any such warning.
