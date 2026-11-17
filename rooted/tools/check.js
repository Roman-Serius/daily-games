// node tools/check.js            validate data + par stats
// node tools/check.js a b        solve one pair
global.window = {};
require("../words.js");
try { require("../words_wiki.js"); window.ROOTED_WORDS += window.ROOTED_WORDS_WIKI || ""; } catch (e) {}
const C = require("../core.js");
const d = C.build(window.ROOTED_PARTS, window.ROOTED_WORDS);
if (d.errors.length) { console.log(d.errors.join("\n")); process.exit(1); }
const [a, b] = process.argv.slice(2);
if (a) { console.log(JSON.stringify(C.solve(d, a, b), null, 1)); process.exit(0); }
console.log("words", d.words.size, "parts", Object.keys(d.parts).length);
const unused = Object.keys(d.parts).filter((id) => !d.byPart.has(id));
console.log("parts with no words:", unused.join(" "));
const lonely = [...d.byPart].filter(([id, s]) => s.size < 2 && d.parts[id].kind === "r").map(([id]) => id);
console.log("roots in only 1 word:", lonely.join(" "));
// par distribution on random pairs
const W = [...d.words.keys()]; let dist = {}; let r = 1;
const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 300; i++) {
  const s = W[Math.floor(rnd() * W.length)], t = W[Math.floor(rnd() * W.length)];
  if (s === t) continue;
  const sol = C.solve(d, s, t, 4);
  const k = sol ? sol.par : "none"; dist[k] = (dist[k] || 0) + 1;
}
console.log("par distribution (random pairs):", dist);
