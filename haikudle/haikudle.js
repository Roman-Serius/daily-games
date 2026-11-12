// Haikudle: build a 5-7-5 haiku from today's word magnets, then like everyone else's.
// All rules are checked again on the server (supabase/schema.sql); the checks
// here are only for instant feedback.
(function () {
  const $ = (id) => document.getElementById(id);
  const TARGETS = [5, 7, 5];
  const PAGE = 50;
  const MEDALS = ["🥇", "🥈", "🥉"];

  const cfg = window.HAIKUDLE_CONFIG || {};
  if (!window.supabase || !cfg.url || !cfg.key) {
    return fatal("The haiku server isn't connected (missing config.js or the Supabase library).");
  }
  const sb = window.supabase.createClient(cfg.url, cfg.key);
  const db = sb.schema("haikudle");

  let T = null;                    // today(): day, ends_at, words, fillers, max_fillers, submitted, mine…
  let lines = [[], [], []];        // tiles per line: { w: word }
  let active = 0;
  const byId = new Map();
  let glueTexts = new Set();
  let sort = Daily.load("dg:haikudle:sort", { key: "time", dir: "desc" });
  let feedOffset = 0;
  let timer = null;
  let reportTarget = null;

  // ---------- helpers ----------
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  let toastTimer;
  function toast(msg, ms = 2400) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }
  function setStatus(msg, isError) {
    const s = $("status");
    s.textContent = msg || "";
    s.classList.toggle("error", !!isError);
  }
  function fatal(msg) {
    setStatus(msg, true);
    console.error("[Haikudle]", msg);
  }
  async function rpc(name, args) {
    const { data, error } = await db.rpc(name, args || {});
    if (error) throw error;
    return data;
  }
  const maxGlue = () => (T && T.max_fillers) || 7;
  const syl = (line) => line.reduce((n, t) => n + t.w.syllables, 0);
  const dots = (n) => "•".repeat(n);
  const draftKey = () => `dg:haikudle:draft:${T.day}`;

  // Each magnet sits slightly crooked; the same word always tilts the same way.
  function tilt(seed) {
    let h = 2166136261;
    for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return (((h >>> 0) % 41) / 10 - 2).toFixed(1) + "deg";   // -2.0 to +2.0
  }

  function friendly(err) {
    const m = (err && err.message) || String(err);
    if (/anonymous sign-ins are disabled/i.test(m)) return "Setup needed: turn on anonymous sign-ins in Supabase (Authentication → Sign In / Providers).";
    if (/schema must be one of|Invalid schema/i.test(m)) return "Setup needed: add \"haikudle\" to Exposed schemas in Supabase (Project Settings → Data API).";
    if (/Could not find the function|does not exist/i.test(m)) return "Setup needed: run supabase/schema.sql in the Supabase SQL Editor.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Couldn't reach the haiku server. Check your connection and refresh.";
    return m;
  }

  // ---------- start ----------
  async function start() {
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        const { error } = await sb.auth.signInAnonymously();
        if (error) throw error;
      }
      await loadToday();
    } catch (e) {
      fatal(friendly(e));
    }
  }

  async function loadToday() {
    T = await rpc("today");
    byId.clear();
    T.words.forEach((w) => byId.set(w.id, { ...w, filler: false }));
    T.fillers.forEach((w) => byId.set(w.id, { ...w, filler: true }));
    glueTexts = new Set(T.fillers.map((w) => w.text.toLowerCase()));
    $("dayLabel").textContent = `#${T.day}`;
    document.title = `Haikudle #${T.day}`;
    startCountdown();
    loadBest();

    if (!T.words.length) {
      setStatus("There's no puzzle for today yet. Check back soon.");
      return;
    }
    setStatus("");
    if (T.submitted) {
      showPosted();
    } else {
      restoreDraft();
      $("compose").hidden = false;
      $("mine").hidden = true;
      $("feedWrap").hidden = true;
      renderCompose();
    }
  }

  // ---------- drawing magnets ----------
  // A tile: { w: word object }. Returns a magnet element for it.
  function magnet(t, opts = {}) {
    const w = t.w;
    const b = el(opts.static ? "span" : "button", "tile" + (w.filler ? " glue" : ""));
    if (!opts.static) b.type = "button";
    b.append(el("span", "", w.text));
    if (!opts.noPips) b.append(el("span", "pips", dots(w.syllables)));
    b.style.setProperty("--tilt", tilt(`${w.text}:${opts.seed || ""}`));
    b.setAttribute("aria-label", `${w.text}, ${w.syllables} syllable${w.syllables > 1 ? "s" : ""}`);
    return b;
  }

  // A finished poem from its tiles (today's) or from plain text (other days).
  function poemFromLines(lineIds, body, small) {
    const box = el("div", "poem" + (small ? " small" : ""));
    let rows = null;
    if (Array.isArray(lineIds)) {
      rows = lineIds.map((line) => line.map((id) => {
        const w = byId.get(id);
        if (!w) throw new Error("unknown tile");
        return { w };
      }));
    }
    const textRows = (body || "").split("\n");
    (rows || textRows).forEach((row, r) => {
      const div = el("div", "row");
      if (rows) row.forEach((t, k) => div.append(magnet(t, { static: true, noPips: true, seed: `${r}.${k}` })));
      else row.split(/\s+/).filter(Boolean).forEach((word, k) => {
        const fake = { w: { id: 0, text: word, syllables: 1, filler: glueTexts.has(word.toLowerCase()) } };
        div.append(magnet(fake, { static: true, noPips: true, seed: `${r}.${k}` }));
      });
      box.append(div);
    });
    return box;
  }
  function poem(lineIds, body, small) {
    try { return poemFromLines(lineIds, body, small); } catch (e) { return poemFromLines(null, body, small); }
  }

  // ---------- yesterday's best ----------
  async function loadBest() {
    try {
      const rows = await rpc("day_top");
      if (!rows || !rows.length) { $("best").hidden = true; return; }
      $("bestDay").textContent = `#${rows[0].day}`;
      const list = $("bestList");
      list.replaceChildren();
      rows.forEach((r) => {
        const li = el("li");
        li.append(el("span", "medal", MEDALS[r.rank - 1] || r.rank), poem(null, r.body, true),
                  el("span", "likes", `♥ ${r.like_count}`));
        list.append(li);
      });
      $("best").hidden = false;
    } catch (e) {
      console.warn("[Haikudle] top 3:", e);
    }
  }

  // ---------- composing ----------
  function restoreDraft() {
    const saved = Daily.load(draftKey(), null);
    lines = [[], [], []];
    if (Array.isArray(saved)) {
      const used = new Set();
      saved.slice(0, 3).forEach((line, i) => (line || []).forEach((item) => {
        const id = typeof item === "number" ? item : item && item.id;
        const w = byId.get(id);
        if (!w || (!w.filler && used.has(id))) return;
        if (syl(lines[i]) + w.syllables > TARGETS[i]) return;
        if (w.filler && glueCount() >= maxGlue()) return;
        if (!w.filler) used.add(id);
        lines[i].push({ w });
      }));
    }
    active = Math.max(0, lines.findIndex((l, i) => syl(l) < TARGETS[i]));
  }
  function saveDraft() {
    Daily.save(draftKey(), lines.map((l) => l.map((t) => t.w.id)));
  }
  const usedIds = () => new Set(lines.flat().filter((t) => !t.w.filler).map((t) => t.w.id));
  const glueCount = () => lines.flat().filter((t) => t.w.filler).length;
  const ready = () => lines.every((l, i) => syl(l) === TARGETS[i]) && glueCount() <= maxGlue();

  function renderCompose() {
    // the three lines
    const wrap = $("lines");
    wrap.replaceChildren();
    lines.forEach((line, i) => {
      const s = syl(line);
      const row = el("div", "line" + (i === active ? " active" : "") + (s === TARGETS[i] ? " full" : ""));
      row.dataset.n = i + 1;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `Line ${i + 1}, ${s} of ${TARGETS[i]} syllables`);
      row.addEventListener("click", () => { active = i; renderCompose(); });
      const slots = el("div", "slots");
      if (!line.length) slots.append(el("span", "placeholder", i === active ? "tap magnets below" : ""));
      line.forEach((t, j) => {
        const m = magnet(t, { seed: `line${i}.${j}` });
        m.addEventListener("click", (e) => { e.stopPropagation(); removeAt(i, j); });
        slots.append(m);
      });
      row.append(slots, el("span", "count", `${s}/${TARGETS[i]}`));
      wrap.append(row);
    });

    // today's words
    const used = usedIds();
    const bank = $("bank");
    bank.replaceChildren();
    Daily.shuffle(T.words, `haikudle:${T.day}`).forEach((w0) => {
      const w = byId.get(w0.id);
      const m = magnet({ w }, { seed: "bank" });
      if (used.has(w.id)) { m.classList.add("used"); m.disabled = true; }
      m.addEventListener("click", () => place(w));
      bank.append(m);
    });

    // glue words
    const glueFull = glueCount() >= maxGlue();
    const fillers = $("fillers");
    fillers.replaceChildren();
    T.fillers.forEach((w0) => {
      const w = byId.get(w0.id);
      const m = magnet({ w }, { seed: "bank" });
      if (glueFull) m.classList.add("used");
      m.addEventListener("click", () => place(w));
      fillers.append(m);
    });

    // rule line + post button
    const g = glueCount();
    const rule = $("rule");
    rule.classList.toggle("bad", g > maxGlue());
    rule.textContent = lines.flat().length ? `Glue words: ${g} of ${maxGlue()}` : "";
    $("postBtn").disabled = !ready();
  }

  function openLine() {
    if (syl(lines[active]) < TARGETS[active]) return active;
    const next = lines.findIndex((l, k) => syl(l) < TARGETS[k]);
    return next === -1 ? null : next;
  }

  function place(w) {
    if (!w.filler && usedIds().has(w.id)) return;
    if (w.filler && glueCount() >= maxGlue()) return toast(`You can use up to ${maxGlue()} glue words`);
    const i = openLine();
    if (i === null) return toast("All three lines are full");
    active = i;
    const t = { w };
    if (syl(lines[i]) + w.syllables > TARGETS[i]) {
      const left = TARGETS[i] - syl(lines[i]);
      return toast(`"${w.text}" is ${w.syllables} syllable${w.syllables > 1 ? "s" : ""}; line ${i + 1} has room for ${left}`);
    }
    lines[i].push(t);
    advance(i);
    saveDraft();
    renderCompose();
  }

  function advance(i) {
    if (syl(lines[i]) === TARGETS[i]) {
      const next = lines.findIndex((l, k) => k > i && syl(l) < TARGETS[k]);
      if (next !== -1) active = next;
    }
  }

  function removeAt(i, j) {
    lines[i].splice(j, 1);
    active = i;
    saveDraft();
    renderCompose();
  }

  $("clearBtn").addEventListener("click", () => {
    lines = [[], [], []];
    active = 0;
    saveDraft();
    renderCompose();
  });

  $("postBtn").addEventListener("click", post);
  async function post() {
    if (!ready()) return;
    const btn = $("postBtn");
    btn.disabled = true;
    btn.textContent = "Posting…";
    try {
      await rpc("submit_haiku", { p_lines: lines.map((l) => l.map((t) => t.w.id)) });
      try { localStorage.removeItem(draftKey()); } catch (e) {}
      if (window.track) track("haikudle/post", "Haikudle post");
      T = await rpc("today");
      showPosted();
      toast("Posted! Now read everyone else's.");
    } catch (e) {
      toast(friendly(e), 3500);
      if (/already posted/i.test(e.message || "")) loadToday();
    } finally {
      btn.textContent = "Post haiku";
      if (!T.submitted) btn.disabled = !ready();
    }
  }

  // ---------- after posting ----------
  function showPosted() {
    $("compose").hidden = true;
    $("mine").hidden = false;
    $("feedWrap").hidden = false;
    $("minePoem").replaceWith(Object.assign(poem(T.mine && T.mine.lines, T.mine ? T.mine.body : ""), { id: "minePoem" }));
    const meta = [];
    if (T.mine) meta.push(`♥ ${T.mine.like_count} like${T.mine.like_count === 1 ? "" : "s"} so far`);
    if (T.same_as_mine > 0) meta.push(`${T.same_as_mine} other ${T.same_as_mine === 1 ? "person" : "people"} wrote the exact same haiku`);
    $("mineMeta").textContent = meta.join(" · ");
    renderSorts();
    loadFeed(true);
  }

  $("shareBtn").addEventListener("click", async () => {
    if (!T || !T.mine) return;
    const url = (window.SITE && SITE.url ? SITE.url + "haikudle/" : location.href.split("?")[0]);
    const r = await Daily.share(`Haikudle #${T.day}\n\n${T.mine.body}\n\n${url}`);
    if (r === "copied") toast("Copied to clipboard");
    else if (r === "failed") toast("Couldn't copy. Select the text instead.");
  });

  // ---------- feed ----------
  function sortParam() {
    if (sort.key === "likes") return sort.dir === "desc" ? "most_liked" : "least_liked";
    return sort.dir === "desc" ? "newest" : "oldest";
  }
  function renderSorts() {
    $("sortTime").textContent = sort.key === "time" && sort.dir === "asc" ? "Oldest" : "Newest";
    $("sortLikes").textContent = sort.key === "likes" && sort.dir === "asc" ? "Least liked" : "Most liked";
    $("sortTime").classList.toggle("on", sort.key === "time");
    $("sortLikes").classList.toggle("on", sort.key === "likes");
    $("sortTime").title = $("sortLikes").title = "Tap again to flip the order";
  }
  document.querySelectorAll(".sort").forEach((b) => b.addEventListener("click", () => {
    const key = b.dataset.key;
    sort = sort.key === key ? { key, dir: sort.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" };
    Daily.save("dg:haikudle:sort", sort);
    renderSorts();
    loadFeed(true);
  }));
  $("moreBtn").addEventListener("click", () => loadFeed(false));

  async function loadFeed(reset) {
    if (reset) feedOffset = 0;
    const feed = $("feed");
    try {
      const rows = await rpc("get_feed", { p_sort: sortParam(), p_limit: PAGE, p_offset: feedOffset });
      if (reset) feed.replaceChildren();
      rows.forEach((r) => feed.append(entry(r)));
      feedOffset += rows.length;
      $("moreBtn").hidden = rows.length < PAGE;
      if (!feed.children.length) feed.append(el("div", "empty", "No one else has posted yet today. Check back later."));
      else if (feed.children.length === 1 && rows[0] && rows[0].is_mine) {
        feed.append(el("div", "empty", "You're the first today. Check back later to read the others."));
      }
    } catch (e) {
      toast(friendly(e), 3500);
    }
  }

  function timeAgo(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  }

  function entry(r) {
    const card = el("article", "entry board" + (r.is_mine ? " own" : ""));
    card.append(poem(r.lines, r.body, true));
    const foot = el("div", "entry-foot");
    foot.append(el("span", "when", timeAgo(r.created_at)));
    const right = el("div", "right");
    const like = el("button", "like" + (r.liked_by_me ? " on" : ""));
    like.type = "button";
    const draw = () => {
      like.textContent = `${r.liked_by_me ? "♥" : "♡"} ${r.like_count}`;
      like.classList.toggle("on", r.liked_by_me);
      like.setAttribute("aria-pressed", r.liked_by_me);
      like.setAttribute("aria-label", `${r.liked_by_me ? "Unlike" : "Like"} (${r.like_count} likes)`);
    };
    draw();
    if (r.is_mine) {
      like.disabled = true;
      like.setAttribute("aria-label", `${r.like_count} likes`);
      right.append(el("span", "yours", "yours"), like);
    } else {
      like.addEventListener("click", async () => {
        if (like.dataset.busy) return;
        like.dataset.busy = "1";
        const before = { liked: r.liked_by_me, count: r.like_count };
        r.liked_by_me = !r.liked_by_me;                 // instant feedback
        r.like_count += r.liked_by_me ? 1 : -1;
        draw();
        try {
          const liked = await rpc("toggle_like", { p_haiku_id: r.id });
          if (liked !== r.liked_by_me) {                // server disagrees: trust it
            r.liked_by_me = liked;
            r.like_count = before.count + (liked === before.liked ? 0 : liked ? 1 : -1);
            draw();
          }
        } catch (e) {
          r.liked_by_me = before.liked;
          r.like_count = before.count;
          draw();
          toast(friendly(e), 3000);
        } finally {
          delete like.dataset.busy;
        }
      });
      const flag = el("button", "flag", "⚑");
      flag.type = "button";
      flag.title = "Report";
      flag.setAttribute("aria-label", "Report this haiku");
      flag.addEventListener("click", () => { reportTarget = { id: r.id, btn: flag }; openModal("reportModal"); });
      right.append(like, flag);
    }
    foot.append(right);
    card.append(foot);
    return card;
  }

  $("reportYes").addEventListener("click", async () => {
    closeModals();
    if (!reportTarget) return;
    const { id, btn } = reportTarget;
    reportTarget = null;
    try {
      await rpc("report_haiku", { p_haiku_id: id });
      btn.disabled = true;
      btn.title = "Reported";
      toast("Reported. Thanks.");
    } catch (e) {
      toast(friendly(e), 3000);
    }
  });

  // ---------- countdown to changeover ----------
  function startCountdown() {
    clearInterval(timer);
    const end = new Date(T.ends_at).getTime();
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      $("cd").textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
      if (s === 0) {
        clearInterval(timer);
        toast("A new day of words is here!", 3000);
        setTimeout(() => loadToday().catch((e) => fatal(friendly(e))), 3000);
      }
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  // ---------- keyboard ----------
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || !T || T.submitted || $("compose").hidden) return;
    if (document.querySelector(".modal.open")) return;
    if (["1", "2", "3"].includes(e.key)) { active = Number(e.key) - 1; renderCompose(); }
    else if (e.key === "Backspace") {
      const l = lines[active].length ? active : [2, 1, 0].find((i) => lines[i].length);
      if (l != null && lines[l].length) { e.preventDefault(); removeAt(l, lines[l].length - 1); }
    } else if (e.key === "Enter" && ready()) { e.preventDefault(); post(); }
  });

  // ---------- modals ----------
  function openModal(id) { $(id).classList.add("open"); }
  function closeModals() { document.querySelectorAll(".modal.open").forEach((m) => m.classList.remove("open")); }
  document.querySelectorAll(".modal").forEach((m) =>
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) closeModals(); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });
  $("helpBtn").addEventListener("click", () => openModal("helpModal"));
  if (!Daily.load("dg:haikudle:seenHelp", false)) {
    Daily.save("dg:haikudle:seenHelp", true);
    openModal("helpModal");
  }

  start();
})();
