// Prints candidate puzzles: no shared parts, par 3+.
global.window = {}; require("../words.js");
try { require("../words_wiki.js"); window.ROOTED_WORDS += window.ROOTED_WORDS_WIKI || ""; } catch (e) {}
const C = require("../core.js");
const d = C.build(window.ROOTED_PARTS, window.ROOTED_WORDS);
const good = [...d.words].filter(([w, s]) => w.length >= 6 && s.filter((x) => x.id).length >= 2).map(([w]) => w);
let r = Number(process.argv[2] || 7); const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
let out = 0;
for (let i = 0; i < 4000 && out < 40; i++) {
  const s = good[Math.floor(rnd() * good.length)], t = good[Math.floor(rnd() * good.length)];
  const sol = C.solve(d, s, t, 5); if (!sol || sol.par < 3) continue;
  const ro = C.solve(d, s, t, 6, { noHubs: true });
  console.log(`${s} -> ${t}  par ${sol.par}  roots-only ${ro ? ro.par : "-"}  e.g. ${sol.path.map((p) => `[${p.pid}] ${p.to}`).join(" ")}`);
  out++;
}
