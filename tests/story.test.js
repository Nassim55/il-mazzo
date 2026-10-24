// Racconto: every word in the story explained and read the right way, the map, the
// reader, word cards, + Ripasso, reading aloud, the questions and the stamp, chapter
// practice, the story's own words in the review, and backups.
const { boot, ok, done } = require('./harness');
const spoken = [];
const speech = w => {
  w.speechSynthesis = { getVoices: () => [{ name: 'Alice', lang: 'it-IT', voiceURI: 'alice', localService: true }],
                        cancel() {}, speak(u) { spoken.push(u); }, addEventListener() {} };
  w.SpeechSynthesisUtterance = function (text) { this.text = text; };
  w.confirm = () => true;
};
const history = { 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 6, wrong: 0 }, chiave: { seen: 5, wrong: 0 } }), 'flipcards-subject': 'story' };
const { d, ev, key, errors, warns } = boot(history, speech);
ok(errors.length === 0 && warns.length === 0, 'loads cleanly: every word in the story has a card, a taught meaning or a gloss');

// ---- Reading each word the right way ----
const refOf = (c, word) => ev(`(() => { for (const [it] of STORY_CHAPTERS[${c}].paragraphs.flat()) for (const s of storySegments(STORY_CHAPTERS[${c}], it)) if (s.text === ${JSON.stringify(word)}) return s.ref; return null; })()`);
ok(refOf(0, 'porta') === 'nouns:porta' && refOf(1, 'porta') === 'nouns:porta' && refOf(2, 'porta') === 'nouns:porta', 'porta is the door in every chapter, never "carries"');
ok(refOf(0, 'lavoro') === 'nouns:lavoro' && refOf(1, 'lavoro') === 'nouns:lavoro' && refOf(1, 'cucina') === 'nouns:cucina' && refOf(2, 'legge') === 'verbs:leggere',
   'lavoro is work, cucina the kitchen, and legge "reads" (not the law)');
ok(ev("storyResolveWord({ senses: {}, glossary: {} }, 'porta', 'la', storyIndex()).ref") === 'nouns:porta'
   && ev("storyResolveWord({ senses: {}, glossary: {} }, 'porta', 'lui', storyIndex()).ref") === 'verbs:portare',
   'after an article or preposition a word reads as a noun; otherwise as the verb form');
ok(refOf(0, 'arriva') === 'verbs:arrivare' && refOf(0, 'sale') === 'irregular:salire' && refOf(0, 'È') === 'irregular:essere' && refOf(1, 'voglio') === 'irregular:volere',
   'verb forms find their verb, regular or irregular');
ok(refOf(0, 'luci') === 'nouns:luce' && refOf(2, 'uova') === 'nouns:uovo' && refOf(0, 'grigia') === 'adjectives:grigio', 'plurals find their noun; adjective forms their adjective');
ok(refOf(2, 'Rosa') === 'name:rosa' && refOf(2, 'mi chiamo') === 'phrases:mi-chiamo' && refOf(1, 'Mamma mia') === 'phrases:mamma-mia',
   'names stay names (Rosa is not the colour); phrases from the deck are one tap');
ok(refOf(0, "c'è") === "story:c'è" && refOf(0, 'piano piano') === 'story:piano piano' && refOf(1, 'piano') === 'nouns:piano',
   "the story's own words and phrases; piano alone is still the floor");
ok(ev("STORY_CHAPTERS.every(ch => ch.questions.filter(q => !q.find).every(q => q.answer >= 0 && q.answer < q.options.length))"), 'every question has a valid answer');
const camino = ev("STORY_ITEMS.find(n => n.noun === 'camino').phrase");
ok(camino.itAlts.includes('camino') && camino.enAlts.includes('fireplace'), 'story words accept a noun without its article, and the plain English meaning');

// ---- The map ----
const tabs = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(tabs.length === 9 && tabs[8] === 'Racconto' && d.querySelector('#subject-toggle [data-subject="story"]').classList.contains('active'), 'Racconto is the last section, and reopens where you left off');
ok(d.querySelectorAll('.map-pin').length === 3 && d.querySelectorAll('.story-card').length === 3 && d.querySelectorAll('.story-card svg').length === 3, 'a map pin, a card and a picture for each chapter');
ok(d.querySelector('.map-pin[data-ch="c1"]').getAttribute('class').includes('is-next'), 'the first chapter is marked as next');
const rd = ev('storyReadiness(STORY_CHAPTERS[0], storyStatusReader())');
ok(rd.known === 2 && rd.total > 40 && /Conosci 2 parole su/.test(d.querySelector('.story-card[data-ch="c1"]').textContent), `the readiness meter counts the words you know (2 of ${rd.total})`);

// ---- The reader ----
const nSent = ev('STORY_CHAPTERS[0].paragraphs.flat().length');
d.querySelector('.story-card[data-ch="c1"] .story-read-btn').click();
ok(d.getElementById('container').dataset.view === 'story' && d.querySelectorAll('.rd-sent').length === nSent && d.querySelector('.reader-art svg'), 'Leggi opens the chapter: its picture, and one row per sentence');
ok(d.querySelector('#reader-text .w[data-ref="nouns:casa"]').classList.contains('w-known') && d.querySelector('#reader-text .w[data-ref="nouns:aereo"]').classList.contains('w-new')
   && d.querySelector('#reader-text .w[data-ref="story:buio"]').classList.contains('w-story'), 'known words are plain, new deck words dashed, the story\'s own words wavy');
const pop = () => d.getElementById('word-pop');
d.querySelector('#reader-text .w[data-ref="verbs:arrivare"]').click();
ok(!pop().hidden && /→ arrivare/.test(pop().textContent) && /lui \/ lei/.test(pop().textContent) && /to arrive/.test(pop().textContent) && /Verbi regolari/.test(pop().textContent),
   'tapping a verb form shows its infinitive, person, meaning and section');
ok(/arripare/.test(pop().textContent) && /New to you/.test(pop().textContent), "…its history note, and whether it's new to you");
d.querySelector('#reader-text .w[data-ref="nouns:paese"]').click();
ok(/the country/.test(pop().textContent) && /In questa frase/.test(pop().textContent) && /village/.test(pop().textContent), 'paese: the card\'s meaning, plus what it means here (villages)');
key(d.body, 'Escape');
ok(pop().hidden, 'Escape closes the word card');
d.querySelector('#reader-text .w[data-ref="story:buio"]').click();
pop().querySelector('.word-pop-add').click();
const t0 = ev('today()'), rec = ev("loadSrs('story', 'en-it')['buio']");
ok(rec && rec.b === 0 && rec.d === t0 && rec.l === null, "+ Ripasso puts the word on today's review");
ok(d.querySelector('.rw-chip[data-ref="story:buio"]').classList.contains('is-added') && /In today/.test(pop().querySelector('.word-pop-add').textContent), 'the card and the word list both show it was added');
d.querySelector('.rd-en-btn[data-i="0"]').click();
ok(pop().hidden && !d.querySelector('.rd-sent[data-i="0"] .rd-en').hidden && d.querySelector('.rd-sent[data-i="1"] .rd-en').hidden, "EN shows one sentence's English (and a tap elsewhere closes the word card)");
d.getElementById('rd-en-all').click();
ok([...d.querySelectorAll('.rd-en')].every(p => !p.hidden), 'Traduzione shows every sentence\'s English');

// ---- Reading aloud ----
spoken.length = 0;
d.querySelector('.rd-play[data-i="2"]').click();
ok(spoken.length === 1 && spoken[0].text === ev('STORY_CHAPTERS[0].paragraphs.flat()[2][0]') && spoken[0].lang === 'it-IT', '▶ reads one sentence in the Italian voice');
spoken.length = 0;
d.getElementById('rd-listen').click();
ok(spoken.length === nSent && /Ferma/.test(d.getElementById('rd-listen').textContent), 'Ascolta il capitolo queues every sentence');
spoken[3].onstart();
ok(d.querySelector('.rd-sent[data-i="3"]').classList.contains('is-speaking') && d.querySelectorAll('.rd-sent.is-speaking').length === 1, 'the sentence being read is highlighted');
d.getElementById('rd-listen').click();
ok(!d.querySelector('.rd-sent.is-speaking') && /Ascolta/.test(d.getElementById('rd-listen').textContent), 'Ferma stops it');

// ---- Questions, and the stamp ----
const q = i => d.querySelector(`.quiz-q[data-q="${i}"]`);
d.querySelector('.quiz-opt[data-q="0"][data-k="0"]').click();
d.querySelector('.quiz-opt[data-q="1"][data-k="2"]').click();
ok(q(0).classList.contains('is-right') && q(1).classList.contains('is-wrong') && /verde/.test(q(1).querySelector('.quiz-fb').textContent), 'answers are marked right or wrong, with the right one shown');
ok(!d.querySelector('#reader-end .story-stamp'), 'no stamp until every question is answered');
d.querySelector('.quiz-opt[data-q="2"][data-k="0"]').click();
d.querySelector('.quiz-find-btn[data-q="3"]').click();
ok(!d.getElementById('find-banner').hidden && d.getElementById('reader-text').classList.contains('is-finding'), 'Trova la parola asks you to tap the word in the text');
d.querySelector('#reader-text .w[data-ref="nouns:valigia"]').click();
ok(d.querySelector('#reader-text .w[data-ref="nouns:valigia"]').classList.contains('is-miss') && pop().hidden && d.getElementById('reader-text').classList.contains('is-finding'),
   'a wrong word shakes, opens no card, and the search goes on');
d.querySelector('#reader-text .w[data-ref="nouns:chiave"]').click();
ok(d.querySelector('#reader-text .w.is-found[data-ref="nouns:chiave"]') && d.getElementById('find-banner').hidden && q(3).classList.contains('is-wrong'), 'the right word is highlighted (after a miss it counts as wrong)');
ok(d.querySelector('#reader-end .story-stamp.is-landing') && /2 of 4/.test(d.getElementById('reader-end').textContent), 'all answered: the LETTO stamp lands, with the score');
const prog = JSON.parse(ev("localStorage.getItem('mazzo-story-v1')"));
ok(/^\d{4}-\d{2}-\d{2}$/.test(prog.read.c1) && prog.quiz.c1.score === 2 && prog.quiz.c1.total === 4, 'reading progress is saved');
d.getElementById('reader-back').click();
ok(d.getElementById('container').dataset.view === 'setup' && d.querySelector('.map-pin[data-ch="c1"]').getAttribute('class').includes('is-read')
   && d.querySelector('.map-pin[data-ch="c2"]').getAttribute('class').includes('is-next') && d.querySelector('.story-card[data-ch="c1"] .story-stamp'), 'on the map: chapter 1 stamped, chapter 2 next');

// ---- The story's words in Ripasso del giorno ----
ok(/1 story word/.test(d.getElementById('ripasso').textContent), 'the added word is in Ripasso del giorno');
d.getElementById('ripasso-start').click();
ok(ev('reviewMode') && ev('deck.length') === 1 && ev('deck[0].subject') === 'story', 'Start: it comes up in the review');
d.getElementById('answer').value = 'buio';
d.getElementById('submit').click();
ok(ev("loadSrs('story', 'en-it')['buio'].b") === 1 && JSON.parse(ev("localStorage.getItem('racconto-stats-v1')")).buio.seen === 1, "answered like a phrase; progress kept under the story's own keys");
d.getElementById('change-btn').click();
ok(ev('subject') === 'story' && d.querySelector('.story-map'), 'and the review returns to the map');

// ---- Practising a chapter's words ----
d.querySelector('.story-card[data-ch="c2"] .story-read-btn').click();
const nRefs = ev('storyChapterRefs(STORY_CHAPTERS[1]).size');
d.getElementById('rw-practise').click();
const subs = new Set(ev('sessionPool.map(c => c.subject)'));
ok(ev('reviewMode') && ev('sessionPool.length') === nRefs && d.getElementById('app-title').textContent === 'La casa', `Esercitati: one mixed session of the chapter's ${nRefs} words`);
ok(['nouns', 'verbs', 'irregular', 'adjectives', 'phrases', 'story'].every(s => subs.has(s)), 'with cards from every section the chapter draws on');
d.getElementById('change-btn').click();
ok(d.getElementById('container').dataset.view === 'story' && d.querySelector('.reader-title').textContent === 'La casa', 'afterwards, straight back to the chapter');
d.getElementById('reader-back').click();
d.querySelector('#subject-toggle [data-subject="nouns"]').click();
ok(ev('subject') === 'nouns' && d.querySelector('.setup-title') && !d.querySelector('.story-home'), 'switching section leaves the story for the usual setup');

// ---- Backups ----
const backup = JSON.stringify(ev('buildBackup()'));   // as the Back up button saves it
ok(/mazzo-story-v1/.test(backup) && /racconto-stats-v1:srs/.test(backup), "backups include reading progress and the story words' schedule");
const B = boot({}, speech);
B.ev(`restoreFromText(${JSON.stringify(backup)})`);
B.d.querySelector('#subject-toggle [data-subject="story"]').click();
ok(B.d.querySelector('.map-pin[data-ch="c1"]').getAttribute('class').includes('is-read') && B.d.querySelector('.story-card[data-ch="c1"] .story-stamp'), 'restoring a backup brings the stamps back');
done();
