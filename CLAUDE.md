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

- **Never rename saved-data keys.** Progress lives in each browser's localStorage under keys such as `sostantivi-stats-v1`, `verbi-regolari-stats` (old `{attempts, wrongs}` format — keep it), `aggettivi-stats-v1`, `frasi-stats-v1`, their `-iten` / `-listen` variants, the `:srs` review schedules, the `*-assoc-v1` association keys, the story's `racconto-stats-*` keys and reading progress `mazzo-story-v1`, `flipcards-subject`, `mazzo-audio-v1` and `mazzo-ripasso-dir`. Renaming any of them silently wipes the user's history.
- New saved data goes in new keys, and must be added to `storageKeys()` so backups include it. New *progress* data must also be added to `syncedKeys()` with a merge rule (and a test in `sync-merge`).
- `mazzo-sync-meta-v1` and `mazzo-sync-base-v1` are per-device sync bookkeeping: never in backups, never synced.
- `tests/fixtures/original-*.html` are the user's original standalone games, used to prove the ports haven't drifted. Never edit them.

## Behaviour conventions

- No regressions: existing features keep working exactly as before unless the user asks otherwise.
- British English in UI text and notes ("practise" as the verb, "colour").
- Answers stay lenient where it doesn't matter (accents, punctuation, capitals) and strict where it does (articles for nouns, *tu*/*Lei* in phrases, pronouns for verbs).
- History notes: accurate etymology, English cognates, links to other words in the deck, false friends flagged; say "uncertain"/"perhaps" when the origin is disputed.
- Verb pronunciations: the syllabifier marks stress by rule; verbs with early or unusual stress need a `pronMap` entry (see `abitare`, `significare`, `creare`).
- Frequency rankings blend written (wordfreq) and spoken (OpenSubtitles) counts, weighted by part-of-speech share in the Italian UD treebanks; method notes sit beside each data block. The adjectives' first 100 are the user's original game (keep them first and unchanged — `adjectives-vs-original` checks); newer ones follow in `adjData` and in the themes, with history notes in `ADJ_NEW_NOTES`. Adding adjectives can change how story and sentence words resolve: compare every resolution before and after, and pin senses where needed (chapter 1's *solo* = only).
- Layout must work from desktop down to 320px phones with no sideways scroll.

## Sentences (*Scrittura*)

- `SENTENCE_DATA`: `[level, person, Italian, English, other correct Italian, other correct English]`. Present tense only (until the user says otherwise); every word must be in the deck or a small word in `STORY_FN` — the start-up check warns otherwise, and the tests fail. Plurals resolve to their singular card (`sentencePluralNoun`); give a word a sense in `SENTENCE_CH.senses` when it could be read two ways.
- The subject pronoun is accepted with or without automatically (`sentenceAccepted`); list other genuinely correct Italian as alternatives. Write the English word for word in the Italian's order, even where it isn't proper English (the user's choice): simple present, no do/does/don't, verb before subject where the Italian has it, only the Italian's articles and prepositions, adjectives after the noun, idioms as they are; keep natural English in the accepted alternatives. Where the word-for-word reads oddly, add the natural English to `SENTENCE_NATURAL` (shown under the prompt, English → Italian only). Mark every "you" as (tu) or (voi).
- Keys are slugs of the Italian (`sentenceKey`), so editing a sentence's Italian starts its history afresh.
- Sentence kinds: each level has a type (`presente` | `piacere`); `activeSentenceTypes()` (stored in the verb-persons store under `sentences`) narrows the section in `applySubject` and Ripasso in `dueList`. In *Mi piace* sentences the person code is the grammatical subject: `cosa` / `cose` for a thing (no subject pronoun added), or a real person (*Mi manchi*: `tu`).
- Section charts live in `SECTION_CHARTS` (one function per panel key), shared by the setup's side panel and the in-round *▦ chart* button (`openChart`), so they can't drift apart. A new chart goes there, with its title in `CHART_TITLES`. While a chart is open it owns the keyboard (Escape closes it, Enter never submits).
- Preposizioni (`PREP_DATA`, `PREP_THEME_DEFS`, `PREP_GROUPS`) runs on Scrittura's engine: the `sentences` flag means whole-phrase checking, the comparison and Why; `typeFilter` is Scrittura's own sentence-type filter. Each card has a `rule` (its theme's, or its own as `ownRule`), which Why uses when the preposition is wrong, missing or not needed. Fusion drills (`mech`) are English → Italian like every card (their English is the gloss: *of the book*); `mechPrompt` (*di + il libro*) is shown after answering. Fusion drills are pairs (`PREP_FUSION`: singular, then plural as the item's `pl`), each a short sentence with one fixed verb per preposition — *parlo di*, *vado a* (places), *vengo da* (people and places), *è in* / *sono in* (containers), *è su* / *sono su* (surfaces) — so new nouns must suit their verb; `fused` holds the joined form the tests check, `mechPrompt` the pieces; `cardsForItem` gives the cards that `activeNumbers()` allows (stored with the verb persons under `prepositions`), and `keepPairs` makes `shuffleDeck` / `takeCards` keep a pair together and Ripasso deal both. Every fusion pair must use deck nouns with a natural plural (the suite checks both articles). English prompts must be unique within the section — mark gender with (m.)/(f.) where the English fits both. An apostrophe Italian doesn't have (*del'pane*) is wrong; a missing one is forgiven. The `prepositions` suite checks every drill's article against the deck noun's own article, so new drills must use deck nouns.
- The comparison picks the accepted version with the fewest words swapped, added or dropped (`sentenceCandidates`); a version that only adds an optional word (Io …) must not win.
- A card with a `person` field is a verb card everywhere (the missed list, the pronoun hint, answer checking). Never put `person` on other cards — a sentence's subject is `sentPerson` (putting `person` on sentence cards once broke the end of every Scrittura round with a miss).
- `sentenceWhy` explains wrong answers from the deck data (adjective forms and slots, verb conjugations, noun gender `g`, articles, joined prepositions). New explanation rules need a case in the `sentences` tests; keep them accurate — a wrong rule is worse than none.

## Story chapters (*La casa di pietra*)

- Present tense only, until the user says they're ready for other tenses. First person: the narrator is the reader. Invented characters only.
- Build each chapter mostly from deck words (check how many resolve to deck cards before adding it); teach the rest through `STORY_WORDS`, each with a meaning, accepted alternatives where useful, and a history note in the usual style.
- Natural, correct Italian matters more than squeezing in vocabulary. Every sentence needs an accurate English translation.
- Every word must resolve: use `senses` for plurals and two-way words (a verb form that is also a noun), `context` when a card's meaning is wider than this use (*paese*: country, here a village). Read through every word's resolution before committing — a tap that teaches the wrong meaning is worse than none.
- Each chapter gets three multiple-choice questions and one *Trova la parola*, a drawing in `STORY_ART` (SVG drawn in code, in the app's palette, gentle animation that `prefers-reduced-motion` turns off) and a pin in `STORY_PINS`.

## Sync

- The app does all merging (`syncMergeAll` and the per-kind rules); the Worker in `worker/` only stores copies and enforces the version check. Keep it that way — the merge rules are tested in jsdom with the rest of the app.
- The Worker's API and `worker/migrations/` change together with `tests/sync-worker.test.js`. Never edit an applied migration; add a new numbered one.
- Deployment is the `deploy-sync` job; it needs the Cloudflare secrets and the `D1_DATABASE_ID` variable and skips quietly without them. The live API is `SYNC_URL` (https://il-mazzo-sync.il-mazzo.workers.dev); its allowed browser origins are in `worker/src/index.js`.
- While the live server predates sign-in (its `/v1/config` is a 404), the app keeps syncing with `SYNC_LEGACY_KEY` (`syncState.legacy`); the new server's 401 for that key ends this and shows the sign-in screen. `tests/fixtures/worker-v1.mjs` is that old server, kept for this test.
- Sign-in is Google only: the app gets an ID token from Google Identity Services and swaps it at `POST /v1/session` for a year-long session; the Worker verifies the RS256 signature against Google's keys, `aud` = `GOOGLE_CLIENT_ID`, issuer, expiry, `email_verified`, and the `ALLOWED_EMAILS` secret (empty = nobody). Never weaken these checks; `sync-worker` tries each way a token can be wrong. `SYNC_LEGACY_KEY` exists only so a first sign-in can move the old built-in key's server copy across (then it's deleted).
- Syncing is invisible by the user's choice: no status line, panel, settings or wording about it in the UI. Keep it that way (the `sync-client` tests check).
- Any new code that saves progress must call `syncTouched()` after writing. Syncing never runs while `container.dataset.view === 'game'`; keep it that way.
- `tests/d1-fixture.js` is the shared D1 stand-in (Node's built-in SQLite with the real migrations).

## Code landmarks (search for these in `index.html`)

- `SUBJECTS` — the five sections (items, themes, frequency order, stats/association keys, panel).
- `cardsForItem`, `render`, `handleSubmit` — card building, display and checking; checkers are `checkAnswer` (nouns), `checkVerbAnswer`, `checkAdjAnswer`, `checkPhraseAnswer`.
- `activePersons(subj)`, `saveVerbPersons` — which persons each verb section drills (`mazzo-verb-persons-v1`, synced); `cardsForItem` builds conjugation cards only for them.
- `refreshDeckSliders`, `handleGameResize` (one slider, id `game-trim-input`), `resizeDeckParts` (two: `game-trim-focus` for the missed/Focus cards, `game-trim-rest`) — the in-round deck size.
- `startGame`, `sessionPool` / `sessionMaxDeck` — sessions; Deck size, Focus and "practise the ones I missed" filter the session pool.
- `srsAnswer`, `dueList`, `startRipasso`, `setCardContext` — spaced repetition and the mixed Ripasso del giorno review.
- `speak`, `chosenVoice`, `renderAudioRow` — Italian text-to-speech and Listening mode.
- `STORY_CHAPTERS`, `STORY_WORDS`, `storySegments` / `storyResolveWord` — the story and how each word finds its card; `renderStoryHome`, `renderStoryReader`, `storyShowWord` — the map, the reader and word cards; `STORY_ART`, `storyMapSVG` — the drawings; `startMixedSession` — the mixed round behind both Ripasso and chapter practice.
- `buildBackup`, `restoreFromText`, `storageKeys` — backup and restore.
- `validateSubjects` (runs at start-up) warns in the console about data problems; the tests fail on any such warning.
