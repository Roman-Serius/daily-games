(function () {
  const GAME = "rooted";
  const track = window.track || (() => {});
  const $ = (id) => document.getElementById(id);
  const C = window.RootedCore;
  // Every word (hand-checked + Wiktionary) is playable; par uses only the
  // hand-checked list, so the par route is always one a person could find.
  const data = C.build(window.ROOTED_PARTS, window.ROOTED_WORDS + (window.ROOTED_WORDS_WIKI || ""));
  if (data.errors.length) console.warn("Rooted data problems:\n" + data.errors.join("\n"));
  const handData = C.build(window.ROOTED_PARTS, window.ROOTED_WORDS);

  // ---------- today's puzzle ----------
  // `day` is the site-wide day (saves, streaks, the hub's "played today");
  // `num` is Rooted's own puzzle number, counted from ROOTED_LAUNCH in puzzles.js.
  const day = Daily.currentDay();
  const num = Math.max(1, day - Daily.dateToDay(window.ROOTED_LAUNCH || Daily.dayToDate(1)) + 1);
  const params = new URLSearchParams(location.search);
  let [START, TARGET] = Daily.pick(window.ROOTED_PUZZLES, num);
  // Endless testing mode (?endless=1): random puzzles one after another,
  // nothing touches the daily stats. Test mode: ?from=normal&to=convene plays any pair.
  const ENDLESS = params.has("endless");
  const forced = (Daily.TEST || ENDLESS) && data.words.has(params.get("from")) && data.words.has(params.get("to"));
  if (forced) [START, TARGET] = [params.get("from"), params.get("to")];
  if (ENDLESS && !forced) {
    const [a, b] = randomPair();
    location.replace(`?endless=1&from=${a}&to=${b}`);
    return;
  }
  const STORE = ENDLESS ? `${GAME}-endless:${START}:${TARGET}`
    : Daily.TEST ? (forced ? `${GAME}-test:${START}:${TARGET}` : `${GAME}-test`) : GAME;

  // A random pair with a roots-only par of 3 or 4 of familiar (hand-checked) words with at least two roots each.
  function randomPair() {
    const pool = [...handData.words].filter(([w, segs]) => w.length >= 6 &&
      segs.filter((x) => x.id && handData.parts[x.id].kind === "r").length >= 2).map(([w]) => w);
    let fallback = null;
    for (let i = 0; i < 300; i++) {
      const a = pool[Math.floor(Math.random() * pool.length)], b = pool[Math.floor(Math.random() * pool.length)];
      if (a === b) continue;
      const sol = C.solve(handData, a, b, 4, { noHubs: true });
      if (!sol) continue;
      if (sol.par >= 3) return [a, b];
      fallback = fallback || [a, b];
    }
    return fallback || ["normal", "convene"];
  }
  // Par: the fewest moves through roots alone (no prefix or suffix links), using
  // familiar hand-checked words. Prefixes and suffixes are still allowed in play,
  // so they can get a player under par.
  const best = C.solve(handData, START, TARGET, 6, { noHubs: true }) ||
    C.solve(handData, START, TARGET, 6) || C.solve(data, START, TARGET, 6);
  const PAR = best ? best.par : 0;

  // moves: { from, pid, to, kind, via }. A move whose `to` is already on the
  // OTHER tree is the meeting move and ends the game.
  // A save only counts for the puzzle it was made on (the puzzle list can change
  // during testing, and an old save would show "won" with nothing on the board).
  const PUZZLE = `${START}>${TARGET}`;
  const saved = Daily.loadDay(STORE, day);
  const state = saved && saved.puzzle === PUZZLE ? saved : { moves: [], status: "playing", puzzle: PUZZLE };
  let cur = null; // selected word (either tree)
  let sel = null; // selected part id in `cur`

  // ---------- helpers ----------
  const part = (id) => data.parts[id];
  function spent() {
    const s = new Set();
    for (const m of state.moves) for (const id of [m.pid, m.via]) if (C.isHub(data, id)) s.add(id);
    return s;
  }
  const kindName = { r: "root", p: "prefix", s: "suffix" };
  function emoji(kind) {
    const cb = Daily.colorBlind();
    return kind === "root" ? (cb ? "🟧" : "🟩") : kind === "relative" ? (cb ? "🟦" : "🟨") : "⬜";
  }
  const sqClass = { root: "root", relative: "rel", hub: "hub" };
  const segText = (word, id) => (data.words.get(word).find((s) => s.id === id) || {}).text;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function toast(msg, ms = 2600) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), ms);
  }
  function shake(el) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  }

  // ---------- the two trees ----------
  // Rebuilt from the move list every render, so saves stay a plain list.
  function grow() {
    const nodes = new Map();
    nodes.set(START, { word: START, side: "L", parent: null, move: null, kids: [] });
    nodes.set(TARGET, { word: TARGET, side: "R", parent: null, move: null, kids: [] });
    const sides = [];
    let meet = null;
    for (const m of state.moves) {
      const from = nodes.get(m.from);
      if (!from) { sides.push("L"); continue; }
      sides.push(from.side);
      const there = nodes.get(m.to);
      if (there) {
        if (there.side !== from.side) meet = m;
        continue;
      }
      const n = { word: m.to, side: from.side, parent: m.from, move: m, kids: [] };
      nodes.set(m.to, n);
      from.kids.push(n);
    }
    return { nodes, meet, sides };
  }
  function pathSet(nodes, meet) {
    const s = new Set();
    for (let w of [meet.from, meet.to]) while (w) { s.add(w); w = nodes.get(w).parent; }
    return s;
  }

  // ---------- rendering ----------
  function wordHTML(word, playing) {
    const used = spent();
    return data.words.get(word).map((s) => {
      if (!s.id) return `<span class="glue">${esc(s.text)}</span>`;
      const p = part(s.id);
      const cls = ["chip"];
      if (p.kind !== "r") cls.push("hubpart");
      if (p.kind !== "r" && used.has(s.id)) cls.push("spent");
      if (playing && word === cur && s.id === sel) cls.push("sel");
      const attrs = playing ? `data-word="${word}" data-pid="${s.id}" tabindex="0" role="button" aria-label="${esc(s.text)}: ${esc(p.meaning)}"` : "";
      return `<span class="${cls.join(" ")}" ${attrs}>${esc(s.text)}</span>`;
    }).join("");
  }

  function linkTexts(m) {
    const a = segText(m.from, m.pid), b = segText(m.to, m.via);
    return a === b ? [a] : [a, b];
  }
  function linkHTML(m) {
    const [a, b] = linkTexts(m);
    const via = b ? ` ~ <b>${esc(b)}</b>` : "";
    return `<div class="link ${m.kind}" title="${esc(part(m.pid).meaning)}"><span class="sq ${sqClass[m.kind]}"></span><b>${esc(a)}</b>${via}<span class="mean">“${esc(part(m.pid).meaning)}”</span></div>`;
  }

  function nodeHTML(n, onPath, playing) {
    const cls = ["word"];
    if (playing && n.word === cur) cls.push("current");
    if (onPath.has(n.word)) cls.push("onpath");
    if (!n.parent) cls.push("seed");
    const kids = n.kids.length ? `<div class="kids">${n.kids.map((k) => nodeHTML(k, onPath, playing)).join("")}</div>` : "";
    return `<div class="node" data-node="${n.word}">${n.move ? linkHTML(n.move) : ""}<div class="${cls.join(" ")}">${wordHTML(n.word, playing)}</div>${kids}</div>`;
  }

  function render() {
    const playing = state.status === "playing";
    const { nodes, meet } = grow();
    const onPath = meet ? pathSet(nodes, meet) : new Set();
    $("score").innerHTML = state.status === "won"
      ? `Chain <b>${chain().len}</b> · Par <b>${PAR}</b> · <b>${score().total}</b>/${MAX} pts`
      : `Words <b>${state.moves.length}</b> · Par <b>${PAR}</b> · Max <b>${MAX}</b> pts`;
    $("treeL").innerHTML = `<div class="tree-head">From</div>${nodeHTML(nodes.get(START), onPath, playing)}`;
    $("treeR").innerHTML = `<div class="tree-head">To</div>${nodeHTML(nodes.get(TARGET), onPath, playing)}`;
    $("bridge").innerHTML = meet
      ? `<div class="meet ${meet.kind}"><span class="sq ${sqClass[meet.kind]}"></span><b>${esc(meet.from)}</b>
          <span class="joint">⟷ ${linkTexts(meet).map(esc).join(" ~ ")} ⟷</span>
          <b>${esc(meet.to)}</b></div><div class="meet-note">“${esc(part(meet.pid).meaning)}”: the roots meet</div>`
      : "";
    $("trees").classList.toggle("done", !playing);
    $("dock").classList.toggle("over", !playing);
    $("giveUpBtn").textContent = ENDLESS ? (playing ? "Skip" : "Next") : playing ? "Give up" : "See results";
    renderDock();
    drawRoots();
  }

  // ---------- root art ----------
  // An SVG layer behind the words. Every word hangs from its parent by a hand-drawn
  // looking root: it drops down the gutter beside the branch, wobbles a little, hooks
  // into the link's square, and sprouts a couple of rootlets. Roots thin out with depth.
  // The newest root grows in; when the sides meet, a gold root joins them.
  let lastDrawnMoves = state.moves.length;
  function hashRand(str) {
    let h = 2166136261;
    for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  }
  // ---------- pixel-art roots from Soren's sprite sheet ----------
  // Art/Aseprite/PNG/Roots-Sheet.png: 16x16 frames stacked vertically.
  //   0,2 trunk · 1,3 bend · 4/5 narrowing · 6/7 tip · 8 leaf · 9 wilted leaf
  //   10-18: the same pieces in the light colorway, used for the winning path.
  // Until the sheet loads (or if it's missing) the vector roots below are drawn instead.
  const SHEET = new Image();
  let sheetOK = false;
  SHEET.onload = () => { sheetOK = true; drawRoots(); };
  SHEET.src = "Art/Aseprite/PNG/Roots-Sheet.png";
  const FR = { trunk: [0, 2], bend: [1, 3], tip: 6, rootlet: 7, leaf: 8, wilted: 9, gold: 10 };
  const GROW_MS = 1700, MEET_MS = 2400;   // how long a new root takes to reach its word / the other side

  function drawRoots(t) {
    if (sheetOK) return drawPixelRoots(t);
    return drawVectorRoots();
  }

  // ---------- backdrop: a fractal root system in the sprite sheet's style ----------
  // Drawn pixel by pixel at 1 art pixel = 1 CSS pixel, like the sprites, with the same
  // palette: dark bark, red streaks running along each root, a darker edge on thick
  // roots. A taproot keeps going down; side roots split off, thin out and wander.
  // Seeded by the puzzle, so it stays put while you play.
  const BG = { base: [102, 57, 49], streak: [172, 50, 50], edge: [69, 38, 33] };
  const MEET_PAL = { base: [143, 86, 59], streak: [217, 160, 102], edge: [102, 57, 49] };
  const bgCache = { key: "", cv: null };
  function hash2(a, b) {
    let h = Math.imul(a, 374761393) + Math.imul(b, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // The backdrop is generated once per puzzle as a list of "stamps" (one per pixel of
  // root length), each tagged with how far along its root it sits. Revealing the stamps
  // in that order is what makes it grow: each side reaches down to its deepest word,
  // and on a win it fills in and a root grows across to join the two systems.
  const BD = { key: "", groups: [], img: null, prio: null, W: 0, H: 0, raf: 0, done: false, joined: false };
  function bdStampPixels(st) {
    const { x: cx, y: cy, dx, dy, w, s, phase, pal } = st;
    const W = BD.W, H = BD.H, px = BD.img.data, prio = BD.prio;
    const r = w / 2, R = Math.ceil(r);
    const a = Math.round(255 * Math.min(1, 0.35 + w / 14));
    const p = Math.min(255, Math.round(w * 16)) + (pal === MEET_PAL ? 1 : 0);
    for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++) {
      if (ox * ox + oy * oy > r * r + 0.3) continue;
      const x = Math.round(cx + ox), y = Math.round(cy + oy);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x;
      if (prio[i] > p) continue;
      prio[i] = p;
      const perp = ox * -dy + oy * dx;           // distance across the root: streaks run along it
      const lane = Math.round(perp + 64 + phase);
      const edge = w >= 5 && Math.abs(perp) > r - 1.2;
      const streak = w >= 3 && !edge && lane % 3 === 0 && hash2(lane, s >> 2) > 0.3;
      const col = edge ? pal.edge : streak ? pal.streak : pal.base;
      px[i * 4] = col[0]; px[i * 4 + 1] = col[1]; px[i * 4 + 2] = col[2]; px[i * 4 + 3] = a;
    }
  }
  function bdGenerate(W, H, anchors) {
    const rnd = hashRand(PUZZLE + "|backdrop");
    const groups = anchors.map((a) => ({ stamps: [], idx: 0, R: 0, target: 0, cap: -1e9, anchor: a }));
    const branch = (grp, x, y, ang, len, w, depth, tap, phase, dist) => {
      const steps = Math.round(len);
      for (let i = 0; i < steps; i++) {
        ang += (rnd() - 0.5) * 0.14;               // wander
        ang += (0 - ang) * (tap ? 0.02 : 0.004);   // and sink back toward straight down
        const dx = Math.sin(ang), dy = Math.cos(ang);
        x += dx; y += dy; dist++;
        grp.stamps.push({ x, y, dx, dy, w: w * (1 - 0.22 * (i / steps)), s: i, phase, dist, pal: BG });
        if (y > H + 8 || x < -24 || x > W + 24) return;
      }
      const wEnd = w * 0.8;
      if (wEnd < 1.2 || depth > 12) return;
      const kids = tap ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.7 ? 2 : 1;
      for (let k = 0; k < kids; k++) {
        const main = tap && k === 0;
        const side = rnd() < 0.5 ? -1 : 1;
        branch(grp, x, y,
          main ? ang + (rnd() - 0.5) * 0.3 : ang + side * (0.4 + rnd() * 0.6),
          main ? len * (0.92 + rnd() * 0.14) : len * (0.6 + rnd() * 0.35),
          main ? wEnd * 0.97 : wEnd * (0.6 + rnd() * 0.12),
          depth + 1, main, phase + 5 * k + 1, dist);
      }
    };
    for (const grp of groups) {
      // each starting word sends down a fat taproot, a root reaching across toward the
      // other side (so the two systems tangle in the middle) and one reaching outward
      const a = grp.anchor;
      const reach = Math.min(1.25, 0.6 + Math.abs(W / 2 - a.x) / W);
      branch(grp, a.x, a.y, a.lean * 0.12, 80, 15, 0, true, 0, 0);
      branch(grp, a.x + a.lean * 8, a.y, a.lean * reach, 110, 10, 1, false, 3, 0);
      branch(grp, a.x - a.lean * 8, a.y, -a.lean * 0.75, 60, 8, 1, false, 7, 0);
      grp.stamps.sort((p, q) => p.dist - q.dist);
      grp.max = grp.stamps.length ? grp.stamps[grp.stamps.length - 1].dist : 0;
      grp.shown = new Uint8Array(grp.stamps.length);
    }
    return groups;
  }
  // The join on a win: a tangle that grows out of the roots already there. Each side
  // sprouts gold branches from points all along its roots, from just under the starting
  // word down to where the sides met; they reach across, split, wander, and criss-cross
  // the other side's branches until the two systems are knotted together.
  function bdTangleGroups(y) {
    const [L, R] = BD.groups;
    const rnd = hashRand(PUZZLE + "|tangle");
    const make = (side, other, dir) => {
      const grp = { stamps: [], idx: 0, R: 0, cap: 1e9 };
      const branch = (x, yy, ang, home, len, w, depth, phase, dist) => {
        const steps = Math.round(len);
        for (let i = 0; i < steps; i++) {
          ang += (rnd() - 0.5) * 0.24;            // plenty of wander: it's a mess
          ang += (home - ang) * 0.025;             // but it keeps heading for the other side
          const dx = Math.sin(ang), dy = Math.cos(ang);
          x += dx; yy += dy; dist++;
          grp.stamps.push({ x, y: yy, dx, dy, w: w * (1 - 0.25 * (i / steps)), s: i, phase, dist, pal: MEET_PAL });
          if (yy > BD.H - 4 || yy < 4) return;
        }
        const wEnd = w * 0.78;
        if (wEnd < 1.1 || depth > 7) return;
        const kids = rnd() < 0.55 ? 2 : 3;
        for (let k = 0; k < kids; k++) {
          const main = k === 0;
          branch(x, yy,
            ang + (main ? (rnd() - 0.5) * 0.4 : (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.8)),
            home,
            main ? len * 0.85 : len * (0.45 + rnd() * 0.35),
            main ? wEnd * 0.95 : wEnd * (0.55 + rnd() * 0.2),
            depth + 1, phase + 3 * k + 1, dist);
        }
      };
      // sprout points: thick enough roots on this side, spread from top to the meeting height
      const cands = side.stamps.filter((st, i) => side.shown[i] && st.w >= 2.5 && st.y > side.anchor.y + 16 && st.y <= y + 10);
      cands.sort((p, q) => p.y - q.y);
      const n = Math.min(6, cands.length);
      const picks = [];
      for (let k = 0; k < n; k++) picks.push(cands[Math.min(cands.length - 1, Math.floor(((k + rnd()) / n) * cands.length))]);
      if (!picks.length) picks.push({ x: side.anchor.x, y, w: 7 });
      picks.forEach((st, r) => {
        const reach = Math.max(60, Math.abs(other.anchor.x - st.x));
        // mostly sideways; higher sprouts dip down, lower ones may climb a little, so they cross
        const t = n > 1 ? r / (n - 1) : 0.5;
        const home = dir * (Math.PI / 2) * (0.7 + 0.45 * t);
        branch(st.x, st.y, home + (rnd() - 0.5) * 0.5, home, reach * (0.16 + rnd() * 0.07), Math.min(8, Math.max(4, st.w * 0.85)), 0, 2 * r, 0);
      });
      grp.stamps.sort((p, q) => p.dist - q.dist);
      grp.max = grp.stamps.length ? grp.stamps[grp.stamps.length - 1].dist : 0;
      grp.target = grp.max;
      grp.shown = new Uint8Array(grp.stamps.length);
      return grp;
    };
    return [make(L, R, 1), make(R, L, -1)];
  }
  // Called on every redraw: (re)build if needed, set how far each side should reach, animate.
  function bdUpdate(box, B, HEAD, BGH, nodes, meet) {
    const cv = $("rootsBg");
    if (!cv) return;
    const W = box.offsetWidth;
    const anchors = [[START, 1], [TARGET, -1]].map(([w, lean]) => {
      const e = box.querySelector(`.node[data-node="${CSS.escape(w)}"] > .word`);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: Math.round((r.left + r.right) / 2 - B.left), y: Math.round(r.bottom - B.top + HEAD - 6), lean };
    });
    if (anchors.includes(null)) return;
    const key = `${PUZZLE}|${W}|${BGH}|${anchors.map((a) => `${a.x},${a.y}`).join(";")}`;
    const fresh = BD.key !== key;
    if (fresh) {
      const first = !BD.key;
      BD.key = key; BD.W = W; BD.H = BGH;
      BD.groups = bdGenerate(W, BGH, anchors);
      BD.img = new ImageData(W, BGH);
      BD.prio = new Uint8Array(W * BGH);
      BD.joined = false;
      BD.gold = false;
      cv.width = W; cv.height = BGH;
      cv.style.width = W + "px"; cv.style.height = BGH + "px"; cv.style.top = -HEAD + "px";
      BD.instant = !first;   // a resize redraws at once; the first load grows in
    }
    // how far down each side reaches: to just below its deepest word, and no further.
    // Before the first word on a side, nothing grows at all.
    const done = state.status !== "playing";
    BD.groups.slice(0, 2).forEach((grp, side) => {
      let deepest = null;
      for (const n of nodes.values()) {
        if (!n.parent || n.side !== (side === 0 ? "L" : "R")) continue;
        const e = box.querySelector(`.node[data-node="${CSS.escape(n.word)}"] > .word`);
        if (e) deepest = Math.max(deepest ?? -1e9, e.getBoundingClientRect().bottom - B.top + HEAD + 6);
      }
      const cap = deepest ?? -1e9;
      if (cap > grp.cap) {
        grp.cap = cap;
        // restart the sweep from the nearest root that can now grow, so it grows out from
        // the roots already there instead of appearing all at once
        let i = 0;
        while (i < grp.stamps.length && (grp.shown[i] || grp.stamps[i].y > cap)) i++;
        grp.idx = i;
        grp.R = i < grp.stamps.length ? grp.stamps[i].dist : grp.max;
      }
      grp.target = grp.max;
    });
    if (state.status === "won" && !BD.gold) {
      BD.gold = true;                       // every background root turns light gold, top down
      for (const g of BD.groups.slice(0, 2)) { g.goldR = 0; g.goldIdx = 0; }
    }
    if (state.status === "won" && meet && !BD.joined) {
      BD.joined = true;
      const a = box.querySelector(`.node[data-node="${CSS.escape(meet.from)}"] > .word`);
      const b = box.querySelector(`.node[data-node="${CSS.escape(meet.to)}"] > .word`);
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      // right under the two words that met
      const y = Math.min(BD.H - 60, Math.round(Math.max(ra.bottom, rb.bottom) - B.top + HEAD + 4));
      BD.tangleY = y;
      for (const g of BD.groups.slice(0, 2)) {
        const st = g.stamps.find((q) => q.y >= y - 4);
        g.reachTangle = st ? st.dist : g.max;
      }
      const [tl, tr] = bdTangleGroups(y);
      BD.groups[2] = tl; BD.groups[3] = tr;
      // both sides grow down at least to the join, even a side with no words of its own
      for (const grp of BD.groups.slice(0, 2)) {
        if (grp.cap >= y + 12) continue;
        grp.cap = y + 12;
        let i = 0;
        while (i < grp.stamps.length && (grp.shown[i] || grp.stamps[i].y > grp.cap)) i++;
        grp.idx = i;
        grp.R = i < grp.stamps.length ? grp.stamps[i].dist : grp.max;
      }
    }
    cv.style.opacity = state.status === "lost" ? 0.4 : state.status === "won" ? 0.85 : 0.6;
    if (BD.instant || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      BD.instant = false;
      for (const g of BD.groups) { g.R = g.target; g.idx = 0; if (BD.gold) g.goldR = 1e9; }
      bdReveal(cv);
      return;
    }
    if (!BD.raf) BD.raf = requestAnimationFrame(bdStep);
  }
  function bdReveal(cv) {
    let changed = false;
    BD.groups.forEach((g, gi) => {
      const goldNow = BD.gold && gi < 2;
      while (g.idx < g.stamps.length && g.stamps[g.idx].dist <= g.R) {
        const st = g.stamps[g.idx];
        if (!g.shown[g.idx] && st.y <= g.cap) {
          bdStampPixels(goldNow && st.dist <= (g.goldR ?? 0) ? { ...st, pal: MEET_PAL } : st);
          g.shown[g.idx] = 1; changed = true;
        }
        g.idx++;
      }
      // the gold wave: recolor roots already grown, in growth order
      if (goldNow) {
        while (g.goldIdx < g.stamps.length && g.stamps[g.goldIdx].dist <= g.goldR) {
          if (g.shown[g.goldIdx]) { bdStampPixels({ ...g.stamps[g.goldIdx], pal: MEET_PAL }); changed = true; }
          g.goldIdx++;
        }
      }
    });
    if (changed || BD.fresh !== BD.key) { cv.getContext("2d").putImageData(BD.img, 0, 0); BD.fresh = BD.key; }
  }
  function bdStep() {
    BD.raf = 0;
    const cv = $("rootsBg");
    if (!cv || !BD.img) return;
    let moving = false;
    if (BD.gold) for (const g of BD.groups.slice(0, 2)) {
      if (g.goldIdx < g.stamps.length) { g.goldR += 10; moving = true; }
    }
    for (const g of BD.groups) {
      if (g.R < g.target) {
        // ease out: fast while far behind, settling as it reaches the word
        g.R = Math.min(g.target, g.R + (g.cap === 1e9 ? 2.2 : 4));   // steady growth along the roots; the tangle slower still
        moving = true;
      }
    }
    // the join waits until the sides have finished filling in... mostly
    // the join waits until both sides have reached the words that met
    if (BD.groups.length > 2) {
      // wait until each side's roots have grown down to the height where the tangle starts
      const waiting = BD.groups.slice(0, 2).some((g) => g.R < (g.reachTangle ?? 0));
      if (waiting) for (const g of BD.groups.slice(2)) g.R = 0;
    }
    bdReveal(cv);
    if (moving) BD.raf = requestAnimationFrame(bdStep);
  }

  let growAnim = null;
  function drawPixelRoots(t) {
    const box = $("trees"), cv = $("rootsPx"), svg = $("roots");
    if (!box || !cv) return;
    const B = box.getBoundingClientRect();
    const W = box.offsetWidth, H = box.offsetHeight, dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    // not laid out yet (a background tab, a hidden pane): draw later instead of crashing,
    // and remember that this move still has to grow in
    if (W < 2 || H < 2) { requestAnimationFrame(() => drawRoots(t)); return; }
    const HEAD = 40; // headroom above the trees, so the leaves on the starting words aren't cut off
    const BGH = Math.max(H + HEAD, 1200); // the backdrop runs on below the board; .game clips it
    cv.width = W * dpr; cv.height = BGH * dpr; cv.style.width = W + "px"; cv.style.height = BGH + "px";
    cv.style.top = -HEAD + "px";
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, HEAD * dpr);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, -HEAD, W, BGH);
    const { nodes, meet } = grow();
    const onPath = meet ? pathSet(nodes, meet) : new Set();
    const done = state.status !== "playing";
    if (t === undefined || t === 1) bdUpdate(box, B, HEAD, BGH, nodes, meet);
    // a new word's root grows in: animate from 0 to 1
    if (t === undefined) {
      const newest = state.moves.length > lastDrawnMoves ? state.moves[state.moves.length - 1] : null;
      lastDrawnMoves = state.moves.length;
      if (newest && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cancelAnimationFrame(growAnim);
        const t0 = performance.now();
        const isMeet = grow().meet === newest;
        const dur = isMeet ? MEET_MS : GROW_MS;
        const step = (now) => {
          const lin = Math.min(1, (now - t0) / dur);
          const p = lin === 1 ? 1 : 1 - Math.pow(1 - lin, 2);   // ease out: quick start, settles in
          drawPixelRoots(p);
          if (p < 1) growAnim = requestAnimationFrame(step);
        };
        drawRoots.newest = newest;
        growAnim = requestAnimationFrame(step);
        return;
      }
      drawRoots.newest = null;
      t = 1;
    }
    const newest = drawRoots.newest;

    const el = (w) => box.querySelector(`.node[data-node="${CSS.escape(w)}"]`);
    const rect = (e) => { const r = e.getBoundingClientRect(); return { l: r.left - B.left, r: r.right - B.left, t: r.top - B.top, b: r.bottom - B.top }; };
    const spr = (f, x, y, flipX, alpha = 1, flipY = false) => {
      g.save();
      g.globalAlpha = alpha;
      g.translate(Math.round(x) + (flipX ? 16 : 0), Math.round(y) + (flipY ? 16 : 0));
      g.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      g.drawImage(SHEET, 0, f * 16, 16, 16, 0, 0, 16, 16);
      g.restore();
    };
    const pick = (key, arr) => arr[hashRand(key)() < 0.5 ? 0 : 1];

    // one root per word, hanging from its parent: trunks first, then the bends on
    // top, so a branch partway down a trunk still shows where it sprouts
    const runs = new Map(); // parent word -> longest trunk, for rootlets
    const bends = [];
    for (const n of nodes.values()) {
      if (!n.parent) continue;
      const pe = el(n.parent), ce = el(n.word);
      if (!pe || !ce) continue;
      const pw = rect(pe.querySelector(":scope > .word"));
      const cn = rect(ce);
      const sqEl = ce.querySelector(":scope > .link .sq");
      const sq = sqEl ? rect(sqEl) : { t: cn.t + 6, b: cn.t + 16 };
      const left = n.side === "L";
      const X = left ? Math.round(cn.l + 1) : Math.round(cn.r - 17);
      const Y0 = Math.round(pw.b - 3);
      const yB = Math.round((sq.t + sq.b) / 2 - 13);
      const gold = done && onPath.has(n.word) && onPath.has(n.parent);
      const base = gold ? FR.gold : 0;
      const alpha = done && !gold ? 0.45 : 1;
      const prog = n.move === newest ? t : 1;
      const reach = Y0 + (yB + 16 - Y0) * prog;          // how far down this root has grown
      const kids = nodes.get(n.parent).kids;
      const last = kids[kids.length - 1] === n;          // the trunk ends here and turns
      const growing = prog < 1;
      if (yB > Y0) {
        g.save();
        g.beginPath();
        // while growing, the trunk stops short and the tip piece leads the way down
        g.rect(X - 2, Y0, 20, Math.max(0, Math.min(yB + (last ? 0 : 2), reach - (growing ? 12 : 0)) - Y0));
        g.clip();
        for (let k = 0, y = Y0; y < yB + 2; k++, y += 16) spr(base + pick(n.parent + "#" + k, FR.trunk), X, y, !left, alpha);
        g.restore();
      }
      if (growing && reach < yB + 12) spr(base + FR.tip, X, Math.max(Y0 - 4, reach - 16), !left, alpha);
      if (reach >= yB + 12) bends.push([base + pick(n.word, FR.bend), last ? X : X + (left ? 8 : -8), yB, !left, alpha]);
      const prev = runs.get(n.parent);
      if (!prev || yB - Y0 > prev.len) runs.set(n.parent, { len: yB - Y0, X, Y0, left, base, alpha, grown: reach >= yB });
    }
    for (const b of bends) spr(...b);
    // rootlets: a thin tip sprouting outward from longer trunks
    for (const [w, r] of runs) {
      if (r.len < 56 || !r.grown || hashRand("rootlet" + w)() < 0.35) continue;
      const k = 1 + Math.floor(hashRand("at" + w)() * Math.max(1, Math.floor(r.len / 16) - 2));
      spr(r.base + FR.rootlet, r.left ? r.X - 12 : r.X + 12, r.Y0 + 16 * k + 2, r.left, r.alpha);
    }
    // a leaf on each starting word: green while growing, gold on a win, wilted on a give-up
    const leaf = state.status === "won" ? FR.gold + FR.leaf : state.status === "lost" ? FR.wilted : FR.leaf;
    for (const [w, left] of [[START, true], [TARGET, false]]) {
      const e = el(w);
      if (!e) continue;
      const sw = rect(e.querySelector(":scope > .word"));
      const lx = Math.round(left ? sw.r - 40 : sw.l + 8), ly = Math.round(sw.t - 24);
      g.save();
      g.translate(lx + (left ? 0 : 32), ly + 32);
      g.scale(left ? 2 : -2, -2);
      g.drawImage(SHEET, 0, leaf * 16, 16, 16, 0, 0, 16, 16);
      g.restore();
    }
    // the meeting root: grows across from the word you typed from to the other side
    if (svg) svg.innerHTML = "";
    if (meet) {
      const a = el(meet.from), b = el(meet.to);
      if (a && b) {
        const A = rect(a.querySelector(":scope > .word")), Bw = rect(b.querySelector(":scope > .word"));
        const p = newest === meet ? t : 1;
        drawMeetRoot(g, A, Bw, p);
      }
    }
  }

  // A root drawn pixel by pixel like the backdrop, in the sheet's light colorway, along
  // an S-curve from the word you typed from to the word it met. p = how far it has grown.
  function drawMeetRoot(g, A, Bw, p) {
    const fromLeft = A.l < Bw.l;
    const [L, R] = fromLeft ? [A, Bw] : [Bw, A];
    const x1 = Math.round(L.r - 2), y1 = Math.round((L.t + L.b) / 2), x2 = Math.round(R.l + 2), y2 = Math.round((R.t + R.b) / 2);
    const dx = Math.max(24, Math.abs(x2 - x1) / 2);
    const pt = (u) => {
      const v = 1 - u;
      return [v * v * v * x1 + 3 * v * v * u * (x1 + dx) + 3 * v * u * u * (x2 - dx) + u * u * u * x2,
              v * v * v * y1 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y2];
    };
    // walk the curve in ~1px steps
    const pts = [];
    let [px, py] = pt(0);
    pts.push([px, py, 1, 0]);
    for (let u = 0; u <= 1; u += 0.002) {
      const [x, y] = pt(u);
      const d = Math.hypot(x - px, y - py);
      if (d >= 1) { pts.push([x, y, (x - px) / d, (y - py) / d]); px = x; py = y; }
    }
    // grow from the side of the word you typed from
    const n = Math.max(1, Math.round(pts.length * p));
    const shown = fromLeft ? pts.slice(0, n) : pts.slice(pts.length - n);
    const minX = Math.floor(Math.min(x1, x2) - 8), minY = Math.floor(Math.min(...pts.map((q) => q[1])) - 8);
    const w = Math.ceil(Math.abs(x2 - x1) + 16), h = Math.ceil(Math.max(...pts.map((q) => q[1])) - minY + 8);
    const img = g.createImageData(w, h), px4 = img.data;
    const width = 7;
    shown.forEach(([cx, cy, ux, uy], i) => {
      const r = width / 2, Rr = Math.ceil(r);
      for (let oy = -Rr; oy <= Rr; oy++) for (let ox = -Rr; ox <= Rr; ox++) {
        if (ox * ox + oy * oy > r * r + 0.3) continue;
        const x = Math.round(cx + ox) - minX, y = Math.round(cy + oy) - minY;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const perp = ox * -uy + oy * ux;
        const lane = Math.round(perp + 64);
        const col = Math.abs(perp) > r - 1.2 ? MEET_PAL.edge
          : lane % 3 === 0 && hash2(lane, i >> 2) > 0.3 ? MEET_PAL.streak : MEET_PAL.base;
        const k = (y * w + x) * 4;
        px4[k] = col[0]; px4[k + 1] = col[1]; px4[k + 2] = col[2]; px4[k + 3] = 255;
      }
    });
    // putImageData ignores transforms: draw through a scratch canvas so it scales with the page
    const sc = drawMeetRoot.sc || (drawMeetRoot.sc = document.createElement("canvas"));
    sc.width = w; sc.height = h;
    sc.getContext("2d").putImageData(img, 0, 0);
    g.drawImage(sc, minX, minY);
    // the growing end: your tip piece, pointing the way it's heading
    if (p < 1 && shown.length > 4) {
      const [tx, ty, ux, uy] = fromLeft ? shown[shown.length - 1] : shown[0];
      const ang = Math.atan2(fromLeft ? uy : -uy, fromLeft ? ux : -ux) - Math.PI / 2;
      g.save();
      g.translate(Math.round(tx), Math.round(ty));
      g.rotate(ang);
      g.drawImage(SHEET, 0, (FR.gold + FR.tip) * 16, 16, 16, -8, -6, 16, 16);
      g.restore();
    }
  }

  function meetPath(el, rect, meet, newest) {
    const a = el(meet.from), b = el(meet.to);
    if (!a || !b) return "";
    const A = rect(a.querySelector(":scope > .word")), Bw = rect(b.querySelector(":scope > .word"));
    const [L, R] = A.l < Bw.l ? [A, Bw] : [Bw, A];
    const x1 = L.r - 4, y1 = (L.t + L.b) / 2, x2 = R.l + 4, y2 = (R.t + R.b) / 2;
    const dx = Math.max(24, Math.abs(x2 - x1) / 2);
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    const grow = newest === meet ? " grow" : "";
    return `<path class="root-shade on px${grow}" pathLength="1" d="${d}" stroke-width="7"/>` +
      `<path class="root on meet px${grow}" pathLength="1" d="${d}" stroke-width="4"/>`;
  }

  function drawVectorRoots() {
    const box = $("trees");
    const svg = $("roots");
    if (!box || !svg) return;
    const B = box.getBoundingClientRect();
    svg.setAttribute("width", box.offsetWidth);
    svg.setAttribute("height", box.offsetHeight);
    svg.setAttribute("viewBox", `0 0 ${box.offsetWidth} ${box.offsetHeight}`);
    const { nodes, meet } = grow();
    const onPath = meet ? pathSet(nodes, meet) : new Set();
    const newest = state.moves.length > lastDrawnMoves ? state.moves[state.moves.length - 1] : null;
    lastDrawnMoves = state.moves.length;
    const el = (w) => box.querySelector(`.node[data-node="${CSS.escape(w)}"]`);
    const rect = (e) => { const r = e.getBoundingClientRect(); return { l: r.left - B.left, r: r.right - B.left, t: r.top - B.top, b: r.bottom - B.top }; };
    const depth = (n) => { let d = 0; while (n.parent) { d++; n = nodes.get(n.parent); } return d; };
    const out = [];
    for (const n of nodes.values()) {
      if (!n.parent) continue;
      const pe = el(n.parent), ce = el(n.word);
      if (!pe || !ce) continue;
      const pw = rect(pe.querySelector(":scope > .word"));
      const cn = rect(ce);
      const sqEl = ce.querySelector(":scope > .link .sq");
      const sq = sqEl ? rect(sqEl) : { l: cn.l, r: cn.l, t: cn.t + 8, b: cn.t + 8 };
      const left = n.side === "L";
      const dir = left ? 1 : -1;
      const gx = left ? cn.l + 1 : cn.r - 1;              // the gutter beside this branch
      const py = pw.b - 3, sx = (sq.l + sq.r) / 2, sy = (sq.t + sq.b) / 2;
      const rnd = hashRand(n.parent + ">" + n.word);
      const w1 = (rnd() - 0.5) * 6, w2 = (rnd() - 0.5) * 6;
      const h = sy - py;
      const d = `M ${gx} ${py} C ${gx + w1} ${py + h * 0.35}, ${gx + w2} ${sy - 10 - h * 0.25}, ${gx} ${sy - 8} Q ${gx} ${sy}, ${sx - dir * 3} ${sy}`;
      const width = Math.max(1.6, 4.4 - depth(n) * 0.7);
      const path = onPath.has(n.word) && onPath.has(n.parent);
      const grow = newest && n.move === newest ? " grow" : "";
      out.push(`<path class="root-shade${path ? " on" : ""}${grow}" pathLength="1" d="${d}" stroke-width="${width + 1.6}"/>`);
      out.push(`<path class="root${path ? " on" : ""}${grow}" pathLength="1" d="${d}" stroke-width="${width}"/>`);
      // rootlets: little side shoots off the vertical run, pointing out of the tree
      const lets = h > 26 ? 1 + Math.floor(rnd() * 2) : 0;
      for (let i = 0; i < lets; i++) {
        const y0 = py + h * (0.25 + 0.4 * rnd());
        const len = 5 + rnd() * 7, drop = 3 + rnd() * 6;
        const x0 = gx + (rnd() - 0.5) * 2;
        out.push(`<path class="rootlet${grow}" d="M ${x0} ${y0} q ${-dir * len * 0.6} ${drop * 0.2}, ${-dir * len} ${drop}" stroke-width="${Math.max(0.8, width * 0.35)}"/>`);
      }
    }
    if (meet) out.push(meetPath(el, rect, meet, newest)); // the two sides join
    svg.innerHTML = out.join("");
  }
  addEventListener("resize", () => drawRoots(1));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawRoots());

  function renderDock() {
    const input = $("moveInput");
    if (!sel) {
      $("partInfo").innerHTML = state.moves.length
        ? "Tap a part of any word, on either side."
        : `Tap a part of <b>${esc(START)}</b> or <b>${esc(TARGET)}</b>. They grow toward each other.`;
      input.disabled = true;
      $("goBtn").disabled = true;
      input.placeholder = "Tap a part first";
      return;
    }
    const p = part(sel);
    const text = segText(cur, sel);
    $("partInfo").innerHTML = `<b>${esc(text)}</b> “${esc(p.meaning)}” · ${esc(p.origin)}<span class="kind">${kindName[p.kind]}</span>`;
    input.disabled = false;
    $("goBtn").disabled = false;
    input.placeholder = `A word with ${text}…`;
  }

  // ---------- rejected guesses ----------
  // Every rejected guess is kept in this browser (see misses.html). On the live
  // site it's also sent to the Google Sheet behind MISS_URL (tools/misses-sheet.gs);
  // locally, tools/serve.py appends it to tools/data/misses.jsonl.
  const MISS_URL = "https://script.google.com/macros/s/AKfycbzz5nRG2DjGEW44yIDVrtBX43QwasXBrB7YdbERgVaLcGY66Qh6roOQOMobs3Q3fI0o/exec"; // paste the Apps Script web app URL (ends in /exec)
  const MISS_KEY = "dg:rooted:misses";
  const MISS_CAP = 60; // most misses one browser sends per day
  function missPlayer() {
    let id = Daily.load("dg:rooted:player", "");
    if (!id) { id = Math.random().toString(36).slice(2, 10); Daily.save("dg:rooted:player", id); }
    return id;
  }
  function logMiss(typed, word, reason) {
    const entry = {
      t: new Date().toISOString(), day: num, puzzle: `${START}>${TARGET}`,
      from: cur, part: segText(cur, sel), pid: sel, typed, word, reason, test: !!Daily.TEST,
      mode: ENDLESS ? "endless" : Daily.TEST ? "test" : "daily",
    };
    const local = /^(localhost|127\.|\[::1\])/.test(location.hostname);
    if (local)
      fetch("/__rooted/miss", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry), keepalive: true }).catch(() => {});
    const list = Daily.load(MISS_KEY, []);
    // Send to the sheet: skip exact repeats today, and cap how many per day.
    const today = entry.t.slice(0, 10);
    const sentToday = list.filter((m) => m.sent && m.t.slice(0, 10) === today);
    const repeat = sentToday.some((m) => m.from === entry.from && m.pid === entry.pid && m.word === entry.word);
    if (MISS_URL && !local && !repeat && sentToday.length < MISS_CAP) {
      entry.sent = true;
      fetch(MISS_URL, {
        method: "POST", mode: "no-cors", keepalive: true,
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...entry, player: missPlayer() }),
      }).catch(() => {});
    }
    list.push(entry);
    Daily.save(MISS_KEY, list.slice(-3000));
  }

  // ---------- play ----------
  $("trees").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip[data-pid]");
    if (!chip || state.status !== "playing") return;
    const pid = chip.dataset.pid;
    if (chip.classList.contains("spent")) {
      toast(`You've already traveled through ${segText(chip.dataset.word, pid)}. Each prefix and suffix works once.`);
      return;
    }
    const same = cur === chip.dataset.word && sel === pid;
    cur = same ? null : chip.dataset.word;
    sel = same ? null : pid;
    render();
    if (sel) $("moveInput").focus();
  });
  $("trees").addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".chip[data-pid]")) {
      e.preventDefault();
      e.target.click();
    }
  });

  $("moveForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!sel || state.status !== "playing") return;
    const input = $("moveInput");
    const typed = input.value.toLowerCase().replace(/[^a-z]/g, "");
    if (!typed) return;
    const to = C.baseForm(data, typed) || typed;
    const here = segText(cur, sel);
    const fail = (msg, reason) => { logMiss(typed, to, reason); toast(msg, 3400); shake(input); };

    const { nodes } = grow();
    const mySide = nodes.get(cur).side;
    const there = nodes.get(to);
    if (there && there.side === mySide) return fail(`${to} is already on this side.`, "same-side");
    const m = C.tryMove(data, cur, sel, to, spent());
    if (!m.ok) {
      if (m.reason === "unknown") return fail(`“${to}” isn't in Rooted's word list yet.`, "unknown");
      if (m.reason === "hub-used") return fail("That word's link is a prefix or suffix you've already used.", "hub-used");
      if (m.reason === "false-friend") {
        if (!m.twin.id) return fail(`Different ${here}! The ${m.twin.text} in ${to} has a different story.`, "false-friend");
        const t = part(m.twin.id);
        return fail(`Different ${here}! In ${to}, ${m.twin.text} means “${t.meaning}” (${t.origin}), not “${part(sel).meaning}.”`, "false-friend");
      }
      return fail(`${to} doesn't share ${here} (or a relative of it).`, "no-share");
    }
    $("toast").classList.remove("show");
    state.moves.push({ from: cur, pid: sel, to, kind: m.kind, via: m.via });
    cur = null;
    sel = null;
    input.value = "";
    if (to !== typed) setTimeout(() => toast(`Counted as ${to}`, 1800), 50);
    if (there) finish(true); // reached the other tree
    Daily.saveDay(STORE, state, day);
    render();
    if (state.status !== "playing") afterRoots(ENDLESS ? endlessDone : openStats);
    else {
      const el = document.querySelector(`.word .chip[data-word="${to}"]`);
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });

  // ---------- the chain and the points ----------
  // The chain is the words that actually connect start to target. Words that
  // ended up on dead-end branches are "extra": they cost a little, so exploring
  // is cheap and a short chain is what counts.
  //   connect +100 · each chain link -10 · each prefix/suffix link in the chain -15 more
  //   each extra word -5 · pure roots (chain has no prefix/suffix link) +60
  // The most a puzzle can give is a pure chain exactly at par with no extra words.
  // A pure chain beats any chain with a prefix or suffix link, even a few links
  // over par (par 4: pure, 3 over = 90; best shortcut, 2 links with a suffix = 65).
  const PTS = { solve: 100, link: -10, hub: -15, extra: -5, pure: 60, floor: 10 };
  const MAX = PTS.solve + PTS.link * PAR + PTS.pure;
  function chain() {
    const { nodes, meet } = grow();
    if (!meet) return { links: [], len: 0, extra: state.moves.length };
    const links = [meet];
    for (let w of [meet.from, meet.to]) {
      for (let n = nodes.get(w); n && n.move; n = nodes.get(n.parent)) links.push(n.move);
    }
    return { links, len: links.length, extra: state.moves.length - links.length };
  }
  function score() {
    const c = chain();
    if (state.status !== "won") return { total: 0, pure: false, hubs: 0, len: 0, extra: c.extra, items: [["🪓 Uprooted (gave up)", 0]] };
    const hubs = c.links.filter((m) => m.kind === "hub").length;
    const pure = hubs === 0;
    const items = [
      ["🌱 Roots connected", PTS.solve],
      [`🔗 Chain of ${c.len} link${c.len === 1 ? "" : "s"}`, PTS.link * c.len],
    ];
    if (pure) items.push(["🌳 Pure roots", PTS.pure]);
    if (hubs) items.push([`⬜ Prefix/suffix link${hubs === 1 ? "" : "s"} × ${hubs}`, PTS.hub * hubs]);
    if (c.extra) items.push([`🍂 Dead end${c.extra === 1 ? "" : "s"} × ${c.extra}`, PTS.extra * c.extra]);
    const raw = items.reduce((t, [, v]) => t + v, 0);
    if (raw < PTS.floor) items.push(["Minimum for connecting", PTS.floor - raw]);
    const total = Math.max(PTS.floor, raw);
    return { total, pure, hubs, len: c.len, extra: c.extra, items };
  }
  function scoreHTML() {
    const { total, items } = score();
    return `<div class="score">${total} <small>/ ${MAX} points${total >= MAX ? " · perfect!" : ""}</small></div>
      <table class="points">${items.map(([l, v]) => `<tr><td>${l}</td><td>${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}</td></tr>`).join("")}</table>`;
  }

  // Open the results once the roots have finished connecting (or straight away without them).
  function afterRoots(cb) {
    const t0 = performance.now();
    const check = () => {
      const tangle = BD.groups.slice(2);
      const ready = !sheetOK || state.status !== "won" || (tangle.length && tangle.every((g) => g.R >= g.max) &&
        BD.groups.slice(0, 2).every((g) => g.goldIdx >= g.stamps.length));
      if (ready || performance.now() - t0 > 12000) setTimeout(cb, ready && sheetOK && state.status === "won" ? 600 : 900);
      else requestAnimationFrame(check);
    };
    setTimeout(check, 300);
  }

  function finish(won) {
    state.status = won ? "won" : "lost";
    if (ENDLESS) {
      Daily.save("dg:rooted:endlessCount", Daily.load("dg:rooted:endlessCount", 0) + 1);
      return;
    }
    Daily.recordResult(STORE, won, distKey(chain().len - PAR));
    if (!Daily.isArchiveDay()) {
      const p = Daily.load(`dg:${STORE}:points`, { games: 0, total: 0, best: 0, pure: 0 });
      if (p.lastDay !== day) {
        const sc = score();
        p.games++; p.total += sc.total; p.best = Math.max(p.best, sc.total); p.pure += sc.pure ? 1 : 0; p.lastDay = day;
        Daily.save(`dg:${STORE}:points`, p);
      }
    }
    track(`rooted/${won ? "win" : "giveup"}`, `Rooted: ${won ? "win" : "gave up"}`);
  }
  const distKey = (over) => (over < 0 ? "Under" : over === 0 ? "Par" : over >= 4 ? "+4" : `+${over}`);

  // ---------- give up ----------
  $("giveUpBtn").addEventListener("click", () => {
    if (ENDLESS) {
      if (state.status !== "playing") return nextPuzzle();
      finish(false); // no confirmation while testing
      cur = sel = null;
      Daily.saveDay(STORE, state, day);
      render();
      return endlessDone();
    }
    if (state.status !== "playing") return openStats();
    $("confirmModal").classList.add("open");
  });

  // ---------- endless mode: show the result, then move on ----------
  function nextPuzzle() { location.href = "?endless=1"; }
  function endlessDone() {
    const won = state.status === "won", n = chain().len;
    const sc = score();
    const verdict = !won ? "Gave up" : `${sc.total}/${MAX} pts${sc.pure ? " 🌳" : ""} · chain ${n}` + (n < PAR ? ", under par" : n === PAR ? ", on par" : `, ${n - PAR} over par`);
    let secs = won ? 4 : 8;
    const bar = $("endlessBar");
    $("toast").classList.remove("show");
    bar.hidden = false;
    bar.innerHTML = `<div class="eb-row"><span><b>${verdict}</b>${won ? ` (par ${PAR})` : ""}
        <span class="eb-count"> · next in <b id="ebSecs">${secs}</b>s</span></span>
        <span class="eb-btns"><button class="btn" id="ebNext">Next</button><button class="btn secondary" id="ebStay">Stay</button></span></div>
      ${!won || n > PAR || !sc.pure ? solutionHTML() : ""}`;
    clearInterval(endlessDone.t);
    endlessDone.t = setInterval(() => {
      secs--;
      const el = $("ebSecs");
      if (el) el.textContent = secs;
      if (secs <= 0) { clearInterval(endlessDone.t); nextPuzzle(); }
    }, 1000);
    $("ebNext").addEventListener("click", nextPuzzle);
    $("ebStay").addEventListener("click", () => {
      clearInterval(endlessDone.t);
      bar.querySelector(".eb-count").textContent = " · paused";
      $("ebStay").remove();
    });
  }
  $("confirmYes").addEventListener("click", () => {
    closeModals();
    finish(false);
    cur = sel = null;
    Daily.saveDay(STORE, state, day);
    render();
    openStats();
  });

  // ---------- end + stats ----------
  // Left side's moves, the meeting link, then the right side's moves.
  // The winning chain from the first word to the second, one square per link.
  function grid() {
    const { nodes, meet, sides } = grow();
    if (!meet) {
      const L = [], R = [];
      state.moves.forEach((m, i) => (sides[i] === "L" ? L : R).push(emoji(m.kind)));
      return `🌱${L.join("")} ✕ ${R.join("")}🌱`;
    }
    const up = (w) => { const out = []; for (let n = nodes.get(w); n && n.move; n = nodes.get(n.parent)) out.push(n.move); return out; };
    const [lw, rw] = nodes.get(meet.from).side === "L" ? [meet.from, meet.to] : [meet.to, meet.from];
    const sq = (ms) => ms.map((m) => emoji(m.kind)).join("");
    return `🌱${sq(up(lw).reverse())} ${emoji(meet.kind)} ${sq(up(rw))}🌱`;
  }
  function shareText() {
    const sc = score();
    const line = state.status === "won"
      ? `chain of ${sc.len} (par ${PAR})${sc.extra ? ` +${sc.extra} extra` : ""} · ${sc.total}/${MAX} pts${sc.pure ? " 🌳" : ""}`
      : `gave up (par ${PAR})`;
    return `Rooted #${num}\n${START} ⟷ ${TARGET}\n${grid()}\n${line}\n${(window.SITE && SITE.url) || ""}rooted/`;
  }
  function solutionHTML() {
    if (!best) return "";
    return `<div class="sol"><div class="muted">A par path</div><div><b>${esc(START)}</b></div>${best.path.map((p) =>
      `<div><span class="sq ${sqClass[p.kind]}"></span>via ${linkTexts(p).map((x) => `<b>${esc(x)}</b>`).join(" ~ ")} (“${esc(part(p.pid).meaning)}”) → <b>${esc(p.to)}</b></div>`).join("")}</div>`;
  }
  function openStats() {
    const end = $("endBlock");
    if (state.status !== "playing") {
      const n = chain().len;
      const over = n - PAR;
      const pure = score().pure;
      const title = state.status === "lost" ? "Uprooted"
        : pure && over <= 0 ? "Pure roots, on par!" : pure ? "Pure roots"
        : over < 0 ? "Under par!" : over === 0 ? "Right on par" : over === 1 ? "One over par" : `${over} over par`;
      end.innerHTML = `<h2>${title}</h2>
        <p class="verdict">${esc(START)} ⟷ ${esc(TARGET)} · ${state.status === "won" ? `chain of ${n}, par ${PAR}` : `par ${PAR}`}</p>
        <div class="grid">${grid()}</div>
        ${scoreHTML()}
        ${state.status === "lost" || over > 0 || !pure ? solutionHTML() : ""}
        <div class="actions"><button class="btn" id="shareBtn">Share</button></div>
        <p class="next">Next Rooted in <span id="countdown">${Daily.countdown()}</span></p>`;
      $("shareBtn").addEventListener("click", async () => {
        const r = await Daily.share(shareText());
        track("rooted/shared", "Rooted: shared a result");
        toast(r === "copied" ? "Copied to clipboard" : r === "shared" ? "Shared" : "Couldn't copy");
      });
      clearInterval(openStats.tick);
      openStats.tick = setInterval(() => { const c = $("countdown"); if (c) c.textContent = Daily.countdown(); }, 1000);
    } else end.innerHTML = "";

    const s = Daily.stats(STORE);
    const keys = ["Under", "Par", "+1", "+2", "+3", "+4"];
    const pts = Daily.load(`dg:${STORE}:points`, { games: 0, total: 0, best: 0, pure: 0 });
    const max = Math.max(1, ...keys.map((k) => s.dist[k] || 0));
    const today = state.status === "won" ? distKey(chain().len - PAR) : null;
    $("statsBody").innerHTML = `
      <div class="stat-row">
        <div><b>${s.played}</b><small>Played</small></div>
        <div><b>${s.played ? Math.round((100 * s.wins) / s.played) : 0}</b><small>Win %</small></div>
        <div><b>${s.streak}</b><small>Streak</small></div>
        <div><b>${pts.games ? Math.round(pts.total / pts.games) : 0}</b><small>Avg pts</small></div>
        <div><b>${pts.games ? pts.best : "–"}</b><small>Best pts</small></div>
      </div>
      <div class="dist">${keys.map((k) => {
        const v = s.dist[k] || 0;
        return `<div class="bar"><span style="width:3.2em">${k === "+4" ? "+4↑" : k}</span><span class="fill${k === today ? " today" : ""}" style="width:${8 + (92 * v) / max}%">${v}</span></div>`;
      }).join("")}</div>`;
    $("statsModal").classList.add("open");
  }

  // ---------- modals ----------
  function closeModals() { document.querySelectorAll(".modal.open").forEach((m) => m.classList.remove("open")); }
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModals));
  document.querySelectorAll(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModals(); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });
  $("helpBtn").addEventListener("click", () => $("helpModal").classList.add("open"));
  $("statsBtn").addEventListener("click", openStats);
  $("cbMode").checked = Daily.colorBlind();
  $("cbMode").addEventListener("change", (e) => { Daily.setColorBlind(e.target.checked); render(); });

  // ---------- start ----------
  $("dayLabel").textContent = ENDLESS
    ? `testing · ${Daily.load("dg:rooted:endlessCount", 0) + (state.status === "playing" ? 1 : 0)}`
    : `#${num}${Daily.isArchiveDay() ? " · archive" : ""}${Daily.TEST ? " · test" : ""}`;
  render();
  if (ENDLESS) {
    if (state.status !== "playing") endlessDone();
    else $("giveUpBtn").textContent = "Skip";
  } else if (!Daily.load("dg:rooted:seenHelp2", false)) {
    Daily.save("dg:rooted:seenHelp2", true);
    $("helpModal").classList.add("open");
  } else if (state.status !== "playing") openStats();

  // Console helpers for testing
  window.rootedPar = () => best;
  window.rootedHas = (w) => data.words.get(w);
  window.rootedMisses = () => console.table(Daily.load(MISS_KEY, []));
})();
