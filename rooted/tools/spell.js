// node tools/spell.js /usr/share/hunspell/en_US.dic  -> words not in Hunspell (base forms + common endings)
const fs = require("fs");
global.window = {}; require("../words.js");
try { require("../words_wiki.js"); window.ROOTED_WORDS += window.ROOTED_WORDS_WIKI || ""; } catch (e) {}
const C = require("../core.js");
const d = C.build(window.ROOTED_PARTS, window.ROOTED_WORDS);
const dic = new Set();
for (const line of fs.readFileSync(process.argv[2], "utf8").split("\n").slice(1)) {
  const [w, flags = ""] = line.split("/");
  const lw = w.toLowerCase(); dic.add(lw);
  if (flags.includes("S")) dic.add(lw + "s"), dic.add(lw.replace(/y$/, "ies"));
  if (flags.includes("Y")) dic.add(lw + "ly");
  if (flags.includes("N")) dic.add(lw.replace(/e$/, "") + "ion");
  if (flags.includes("X")) dic.add(lw.replace(/e$/, "") + "ions");
  if (flags.includes("V")) dic.add(lw.replace(/e$/, "") + "ive");
  if (flags.includes("R")) dic.add(lw.replace(/e$/, "") + "er");
  if (flags.includes("G")) dic.add(lw.replace(/e$/, "") + "ing");
  if (flags.includes("D")) dic.add(lw.replace(/e$/, "") + "ed");
  if (flags.includes("U")) dic.add("un" + lw);
  if (flags.includes("I")) dic.add("in" + lw);
  if (flags.includes("A")) dic.add("re" + lw);
  if (flags.includes("B")) dic.add(lw.replace(/e$/, "") + "able");
  if (flags.includes("M")) dic.add(lw);
}
console.log([...d.words.keys()].filter((w) => !dic.has(w)).join(" "));
