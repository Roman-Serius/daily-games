# Rooted (prototype)

Get from one word to another through the roots they share.
Tap a part of a word, type another word with that part, repeat until you reach the target.

- Root link (🟩): same root, e.g. ab·**norm**·al → e·**norm**·ous
- Relative link (🟨): historically related roots (ped ~ pod, ex- ~ extra-), listed in `words.js`
- Prefix/suffix link (⬜): allowed, but each prefix or suffix works once per puzzle
- Par is the fewest moves, worked out by `core.js` at load time

Files
```
words.js      parts (roots, prefixes, suffixes) + the word list, each word split into parts
puzzles.js    [start, target] pairs in play order (item 1 = site day #1); append only
core.js       rules + solver, shared by the game and the tools
rooted.js     the page
tools/check.js        node tools/check.js            validate data, par stats
                      node tools/check.js from to    solve one pair
tools/candidates.js   node tools/candidates.js 7     suggest new puzzles (seed 7)
tools/spell.js        node tools/spell.js /usr/share/hunspell/en_US.dic   flag misspelled words
```
Test any pair in test mode: `?test=1&from=normal&to=convene`.
Not published yet: `rooted/` is in .gitignore. Remove that line and add a card in shared/games.js to launch.

## Rejected guesses

Every guess the game turns down is logged two ways:
- **In the browser:** open `rooted/misses.html` (e.g. localhost:8000/rooted/misses.html) to see this
  browser's misses grouped by word, filter by reason, and copy them as CSV. Reasons:
  `unknown` (not in words.js: the ones to add), `false-friend`, `no-share`, `hub-used`, `same-side`.
  In the console, `rootedMisses()` prints the same list.
- **On the live site:** each miss is sent to GoatCounter as an event `rooted/miss/<reason>/<word>`,
  so the dashboard counts every player's misses. (Not sent from localhost or test mode.)

## Wiktionary import

`words_wiki.js` is generated from Wiktionary data (CC BY-SA 4.0, via kaikki.org); never edit it.
Hand entries in `words.js` always win, and `tools/wiki-skip.txt` (one word per line) blocks bad ones.
```
node tools/export.js > tools/data/current.json
python3 tools/wiktionary.py extract tools/data/<kaikki file>.jsonl   # slow, once per download
python3 tools/wiktionary.py build                                     # fast, rerun after editing words.js
```
`tools/data/report.txt` lists every added word with its source, plus the Latin/Greek roots that
block the most words (the best candidates to add to words.js next). `tools/data/` is git-ignored.

Par is the fewest moves through roots alone (no prefix or suffix links), worked out from words.js,
so the par route always uses familiar words. Wiktionary
words are all playable, so a player who knows a rare shortcut can finish under par.

## Endless testing mode

```
python3 rooted/tools/serve.py      # instead of python3 -m http.server; run from anywhere
```
Then open http://localhost:8000/rooted/?endless=1. It plays random par-3 puzzles one after
another (Skip gives up instantly; a finished puzzle moves on after a few seconds) and never
touches the daily stats. While serve.py is running, every rejected guess from any mode is
appended to `rooted/tools/data/misses.jsonl`, and misses.html reads that file.
