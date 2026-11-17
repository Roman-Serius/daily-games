// node tools/export.js > tools/data/current.json
// Dumps the hand-made parts and words as JSON for tools/wiktionary.py.
// Only words.js is read: Wiktionary words are rebuilt from scratch each run.
global.window = {};
require("../words.js");
const C = require("../core.js");
const d = C.build(window.ROOTED_PARTS, window.ROOTED_WORDS);
const parts = {};
for (const [id, p] of Object.entries(d.parts)) parts[id] = { kind: p.kind, label: p.label, meaning: p.meaning, origin: p.origin, rel: p.rel };
const words = {};
for (const [w, segs] of d.words) words[w] = segs.map((s) => [s.text, s.id]);
process.stdout.write(JSON.stringify({ parts, words }));
