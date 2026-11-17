// Rooted rules, shared by the game (browser) and tools/check.js (node).
(function (root) {
  function build(PARTS, WORDS_TEXT) {
    const parts = {};
    for (const [id, v] of Object.entries(PARTS)) {
      if (!v) continue;
      const [kind, label, meaning, origin, rel] = v;
      parts[id] = { id, kind, label, meaning, origin, rel: rel ? rel.split(/\s+/) : [] };
    }
    // Make relatives symmetric.
    for (const p of Object.values(parts))
      for (const r of p.rel) if (parts[r] && !parts[r].rel.includes(p.id)) parts[r].rel.push(p.id);

    const words = new Map(); // word -> [{ text, id|null }]
    const errors = [];
    for (const spec of WORDS_TEXT.split(/\s+/).filter(Boolean)) {
      const segs = spec.split(".").map((s) => {
        if (s.startsWith("_")) {
          if (s.includes("=")) errors.push(`${spec}: glue "${s}" can't have "="`);
          return { text: s.slice(1), id: null };
        }
        const [text, id] = s.includes("=") ? s.split("=") : [s, s];
        if (!parts[id]) errors.push(`${spec}: unknown part "${id}"`);
        return { text, id };
      });
      const word = segs.map((s) => s.text).join("").toLowerCase();
      if (words.has(word)) errors.push(`duplicate word: ${word}`);
      words.set(word, segs);
    }
    // Index: part id -> words containing it.
    const byPart = new Map();
    for (const [w, segs] of words)
      for (const s of segs) if (s.id) {
        if (!byPart.has(s.id)) byPart.set(s.id, new Set());
        byPart.get(s.id).add(w);
      }
    return { parts, words, byPart, errors };
  }

  const isHub = (data, id) => data.parts[id] && data.parts[id].kind !== "r";

  // Can you go from `from` through its part `pid` to word `to`?
  // used: Set of hub ids already spent this puzzle.
  // Returns { ok, kind: "root"|"relative"|"hub", via } or { ok:false, reason, ... }
  function tryMove(data, from, pid, to, used) {
    to = to.toLowerCase().trim();
    const segs = data.words.get(to);
    if (!segs) return { ok: false, reason: "unknown" };
    if (to === from) return { ok: false, reason: "same" };
    const P = data.parts[pid];
    const inTo = segs.filter((s) => s.id);
    let hit = inTo.find((s) => s.id === pid);
    let kind = "root";
    if (!hit) {
      hit = inTo.find((s) => P.rel.includes(s.id));
      kind = "relative";
    }
    if (!hit) {
      // False friend? Same letters, different root.
      const fromSeg = data.words.get(from).find((s) => s.id === pid);
      if (!fromSeg) return { ok: false, reason: "no-share" };
      const twin = segs.find((s) => s.id && (s.text === fromSeg.text || (s.id && data.parts[s.id].label.split(" / ").includes(fromSeg.text))));
      return { ok: false, reason: twin ? "false-friend" : "no-share", twin };
    }
    const hub = isHub(data, pid) || isHub(data, hit.id);
    if (hub && (used.has(pid) || used.has(hit.id))) return { ok: false, reason: "hub-used" };
    return { ok: true, kind: hub && kind === "root" ? "hub" : kind, via: hit.id };
  }

  // Shortest solutions from start to target.
  // Fast enough for the full dictionary: neighbor lists are memoized per word,
  // and states are pruned by hub-set dominance (a path to the same word that
  // has spent a subset of another's hubs makes the other pointless).
  const EMPTY = new Set();
  function neighbors(data, word) {
    if (!data._nbr) data._nbr = new Map();
    if (data._nbr.has(word)) return data._nbr.get(word);
    const out = [];
    const done = new Set();
    for (const seg of data.words.get(word)) {
      if (!seg.id) continue;
      const pid = seg.id;
      const cand = new Set(data.byPart.get(pid) || []);
      for (const r of data.parts[pid].rel) for (const w of data.byPart.get(r) || []) cand.add(w);
      for (const to of cand) {
        if (to === word || done.has(pid + ":" + to)) continue;
        done.add(pid + ":" + to);
        const m = tryMove(data, word, pid, to, EMPTY);
        if (!m.ok) continue;
        const hubs = [];
        if (isHub(data, pid)) hubs.push(pid);
        if (isHub(data, m.via) && m.via !== pid) hubs.push(m.via);
        out.push({ to, pid, via: m.via, kind: m.kind, hubs });
      }
    }
    data._nbr.set(word, out);
    return out;
  }

  function solve(data, start, target, maxDepth = 7, opts = {}) {
    if (!data.words.has(start) || !data.words.has(target)) return null;
    const best = new Map(); // word -> [Set of spent hubs] (pareto-minimal)
    const dominated = (w, used) => {
      const arr = best.get(w);
      return arr && arr.some((e) => e.size <= used.size && [...e].every((x) => used.has(x)));
    };
    const record = (w, used) => {
      let arr = best.get(w);
      if (!arr) best.set(w, (arr = []));
      arr.push(used);
    };
    let frontier = [{ word: start, used: EMPTY, path: [] }];
    record(start, EMPTY);
    for (let depth = 1; depth <= maxDepth; depth++) {
      const next = [];
      for (const node of frontier) {
        const visited = new Set([start, ...node.path.map((p) => p.to)]);
        for (const n of neighbors(data, node.word)) {
          if (visited.has(n.to)) continue;
          if (opts.noHubs && n.hubs.length) continue; // roots only: no prefix/suffix at either end
          if (n.hubs.some((h) => node.used.has(h))) continue; // hub already spent
          const used = n.hubs.length ? new Set([...node.used, ...n.hubs]) : node.used;
          const path = node.path.concat({ from: node.word, pid: n.pid, to: n.to, kind: n.kind, via: n.via });
          if (n.to === target) return { par: depth, path };
          if (dominated(n.to, used)) continue;
          record(n.to, used);
          next.push({ word: n.to, used, path });
        }
      }
      frontier = next;
      if (!frontier.length) break;
    }
    return null;
  }

  // "transported" -> "transport", "visions" -> "vision", "enormously" -> "enormous"
  function baseForm(data, w) {
    w = w.toLowerCase().replace(/[^a-z]/g, "");
    if (data.words.has(w)) return w;
    const tries = [];
    const add = (stem, ...ends) => ends.forEach((e) => tries.push(stem + e));
    for (const [end, back] of [["ies", ["y"]], ["ied", ["y"]], ["ily", ["y"]], ["es", ["", "e"]], ["s", [""]],
      ["ed", ["", "e"]], ["d", [""]], ["ing", ["", "e"]], ["ly", ["", "le"]], ["ally", ["al", "", "ic"]]]) {
      if (!w.endsWith(end) || w.length - end.length < 3) continue;
      const stem = w.slice(0, -end.length);
      add(stem, ...back);
      if (/([b-df-hj-np-tv-z])\1$/.test(stem)) add(stem.slice(0, -1), ""); // transmitted -> transmit
    }
    return tries.find((t) => data.words.has(t)) || null;
  }

  const api = { build, tryMove, solve, isHub, baseForm };
  if (typeof module !== "undefined") module.exports = api;
  else root.RootedCore = api;
})(this);
