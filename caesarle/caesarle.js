(function () {
  const GAME = "caesarle";
  const track = window.track || (() => {});
  const ROWS = 6;
  const LEN = 5;
  const REJECT_COST = 5; // points lost per rejected probe
  const NO_SHIFT_BONUS = 50; // for winning without entering any shift guess
  const ROW_POINTS = [60, 30, 20, 10, 0, -10, -20]; // by probe rows used (0..6) on a win
  const A = 97; // "a"

  // ---------- today's puzzle ----------
  const day = Daily.currentDay();
  const params = new URLSearchParams(location.search);
  const TEST = Daily.TEST;
  const date = Daily.dayToDate(day);
  const SCHEDULE = window.CAESARLE_SCHEDULE || {};
  const pinned = SCHEDULE[date];
  const pinnedOk = pinned && /^[a-z]{5}$/i.test(pinned.word || "");
  if (pinned && !pinnedOk) console.warn(`Caesarle: schedule entry for ${date} needs a 5-letter word`, pinned);
  // Where today's puzzle came from: "schedule" | "list" | "custom" (test)
  let source = pinnedOk ? "schedule" : "list";
  let answer = pinnedOk ? pinned.word.toLowerCase() : Daily.pick(window.CAESARLE_ANSWERS, day);
  let shift = 1 + Math.floor(Daily.rng(`${GAME}:shift:${day}`)() * 25); // 1..25, same for everyone on this day
  if (pinnedOk && pinned.shift >= 1 && pinned.shift <= 25) shift = pinned.shift;
  // Test mode: ?word=paste&shift=1 forces a custom puzzle
  const forced = TEST && /^[a-z]{5}$/i.test(params.get("word") || "");
  if (forced) {
    answer = params.get("word").toLowerCase();
    const s = parseInt(params.get("shift"), 10);
    if (s >= 1 && s <= 25) shift = s;
    source = "custom";
  }
  const cipher = rot(answer, shift);
  const VALID = new Set(window.CAESARLE_VALID);
  VALID.add(answer);
  // Test mode keeps saves and stats apart from real play
  const STORE = TEST ? (forced ? `${GAME}-test:${answer}:${shift}` : `${GAME}-test`) : GAME;

  function rot(word, k) {
    return [...word].map((c) => String.fromCharCode(((c.charCodeAt(0) - A + k + 26) % 26) + A)).join("");
  }

  // ---------- state ----------
  const state = Daily.loadDay(STORE, day) || {
    probes: [], // { word, shift, kind: "word" | "cipher" }
    final: null,
    rejected: 0, // probes refused as not-a-word (each costs points)
    status: "playing", // playing | won | lost
  };
  state.rejected = state.rejected || 0;
  let mode = state.probes.length >= ROWS ? "final" : "probe";
  let current = "";
  let shiftStr = "";
  let finalStr = "";
  let busy = false;

  // ---------- rules ----------
  // Every probe is scored against the ENCRYPTED word.
  function colors(guess) {
    const res = Array(LEN).fill("miss");
    const counts = {};
    for (let i = 0; i < LEN; i++) {
      if (guess[i] === cipher[i]) res[i] = "hit";
      else counts[cipher[i]] = (counts[cipher[i]] || 0) + 1;
    }
    for (let i = 0; i < LEN; i++) {
      if (res[i] !== "hit" && counts[guess[i]]) {
        res[i] = "near";
        counts[guess[i]]--;
      }
    }
    return res;
  }
  // Shift checks are optional: a probe with no shift guess has shift === null.
  const arrow = (k) => (k == null ? "none" : k === shift ? "exact" : k < shift ? "up" : "down");

  // A probe is a real word, or a real word written in today's shift.
  function classify(word) {
    if (VALID.has(word)) return "word";
    if (VALID.has(rot(word, -shift))) return "cipher";
    return null;
  }

  // Was shift guess k already ruled out by earlier arrows?
  function ruledOut(k, earlier) {
    if (k == null) return false;
    return earlier.some((p) => {
      if (p.shift == null) return false;
      const a = arrow(p.shift);
      if (a === "exact") return k !== p.shift;
      if (a === "up") return k <= p.shift;
      return k >= p.shift;
    });
  }

  function points() {
    const items = [];
    const won = state.status === "won";
    const n = state.probes.length;
    const rej = state.rejected;
    const rejItem = [`🚫 Barbarians at the gate × ${rej}`, -REJECT_COST * rej];
    if (!won) {
      items.push(["💀 Wrong final answer", -25]);
      if (rej) items.push(rejItem);
      return { total: items.reduce((s, [, v]) => s + v, 0), items };
    }
    items.push(["Correct final answer", 100]);
    items.push([n === 0 ? "🏛️ Veni, vidi, vici (no probes)" : `Solved after ${n} probe${n > 1 ? "s" : ""}`, ROW_POINTS[n]]);
    if (state.probes.some((p) => p.shift === shift)) items.push(["🔑 Cracked the key", 25]);
    if (state.probes.every((p) => p.shift == null)) items.push(["🕶️ No shift checks", NO_SHIFT_BONUS]);
    if (state.probes.some((p) => p.kind === "cipher")) items.push(["📜 Speaks cipher", 15]);
    const ignored = state.probes.filter((p, i) => ruledOut(p.shift, state.probes.slice(0, i))).length;
    if (ignored) items.push([`🙈 Ignored the signs × ${ignored}`, -10 * ignored]);
    if (state.probes.some((p) => p.word === answer)) items.push(["🗡️ Et tu?", -15]);
    if (rej) items.push(rejItem);
    return { total: items.reduce((s, [, v]) => s + v, 0), items };
  }

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const boardEl = $("board");
  const kbEl = $("keyboard");
  const finalEl = $("finalRow");
  $("dayLabel").textContent = `#${day}`;

  function buildBoard() {
    boardEl.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = "<span class='tile'></span>".repeat(LEN) + "<span class='badge'></span>";
      boardEl.appendChild(row);
    }
    finalEl.innerHTML = "<span class='tile'></span>".repeat(LEN);
  }

  const ARROW = { exact: "✓", up: "↑", down: "↓", none: "" };

  function paintProbe(r, p, animate) {
    const row = boardEl.children[r];
    row.classList.remove("active");
    colors(p.word).forEach((cls, i) => {
      const t = row.children[i];
      t.textContent = p.word[i];
      const go = () => (t.className = `tile ${cls}${animate ? " reveal" : ""}`);
      animate ? setTimeout(go, i * 160) : go();
    });
    const b = row.children[LEN];
    const a = arrow(p.shift);
    const go = () => {
      b.className = `badge ${a === "exact" ? "exact" : a === "none" ? "skip" : "done"}`;
      b.textContent = a === "none" ? "—" : `${p.shift} ${ARROW[a]}`;
    };
    animate ? setTimeout(go, LEN * 160) : go();
  }

  function paintInput() {
    const r = state.probes.length;
    // probe row
    [...boardEl.children].forEach((row, i) => row.classList.toggle("active", i === r && mode === "probe" && state.status === "playing"));
    if (r < ROWS && state.status === "playing") {
      const row = boardEl.children[r];
      for (let i = 0; i < LEN; i++) {
        const t = row.children[i];
        t.textContent = current[i] || "";
        t.className = `tile${current[i] ? " filled" : ""}`;
      }
      const b = row.children[LEN];
      b.className = `badge${mode === "probe" ? " pending" : ""}`;
      b.textContent = shiftStr ? `${shiftStr} ?` : mode === "probe" ? "shift" : "";
    }
    // final row
    const word = state.final || finalStr;
    [...finalEl.children].forEach((t, i) => {
      t.textContent = word[i] || "";
      t.className = `tile${word[i] ? " filled" : ""}`;
    });
    finalEl.classList.toggle("active", mode === "final" && state.status === "playing");
    finalEl.classList.toggle("won", state.status === "won");
    finalEl.classList.toggle("lost", state.status === "lost");
    $("lockBtn").disabled = state.status !== "playing" || (mode === "final" && finalStr.length < LEN);
    $("lockBtn").textContent = mode === "final" || state.status !== "playing" ? "Lock in" : "Final answer…";
  }

  const KB = ["1234567890", "qwertyuiop", "asdfghjkl", "+zxcvbnm-"];
  function buildKeyboard() {
    kbEl.innerHTML = KB.map((row) =>
      `<div class="kb-row">${[...row].map((k) => {
        if (k === "+") return `<button class="key wide" data-key="enter">Enter</button>`;
        if (k === "-") return `<button class="key wide" data-key="back" aria-label="Backspace">⌫</button>`;
        return `<button class="key${/\d/.test(k) ? " digit" : ""}" data-key="${k}">${k}</button>`;
      }).join("")}</div>`
    ).join("");
  }

  function paintKeyboard() {
    const rank = { miss: 1, near: 2, hit: 3 };
    const best = {};
    state.probes.forEach(({ word }) =>
      colors(word).forEach((cls, i) => {
        const ch = word[i];
        if (!best[ch] || rank[cls] > rank[best[ch]]) best[ch] = cls;
      })
    );
    kbEl.querySelectorAll(".key[data-key]").forEach((el) => {
      el.classList.remove("hit", "near", "miss");
      if (best[el.dataset.key]) el.classList.add(best[el.dataset.key]);
    });
  }

  function toast(msg, ms = 1700) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), ms);
  }

  function shake(el) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  }

  // ---------- input ----------
  function setMode(m) {
    if (state.status !== "playing") return;
    if (m === "probe" && state.probes.length >= ROWS) return;
    mode = m;
    paintInput();
  }

  function press(key) {
    if (state.status !== "playing" || busy) return;
    if (key === "tab") return setMode(mode === "probe" ? "final" : "probe");

    if (mode === "final") {
      if (key === "enter") return askLockIn();
      if (key === "back") finalStr = finalStr.slice(0, -1);
      else if (/^[a-z]$/.test(key) && finalStr.length < LEN) finalStr += key;
      return paintInput();
    }

    if (key === "enter") return probe();
    if (key === "back") {
      if (shiftStr) shiftStr = shiftStr.slice(0, -1);
      else current = current.slice(0, -1);
    } else if (/^[0-9]$/.test(key)) {
      const next = shiftStr + key;
      const n = parseInt(next, 10);
      if (next.length <= 2 && n >= 1 && n <= 25) shiftStr = String(n);
      else if (key !== "0") shiftStr = key; // start over, e.g. "3" then "7" -> 37 is too big -> "7"
    } else if (/^[a-z]$/.test(key) && current.length < LEN) {
      current += key;
    }
    paintInput();
  }

  function probe() {
    const row = boardEl.children[state.probes.length];
    if (current.length < LEN) { shake(row); return toast("Not enough letters"); }
    const kind = classify(current);
    if (!kind) {
      state.rejected++;
      Daily.saveDay(STORE, state, day);
      shake(row);
      return toast(`Not a word in English or today's cipher · −${REJECT_COST}`, 2000);
    }

    const p = { word: current, shift: shiftStr ? parseInt(shiftStr, 10) : null, kind };
    const r = state.probes.length;
    state.probes.push(p);
    if (state.probes.length === 1 && source !== "custom") track("caesarle/started", "Caesarle: started a game");
    Daily.saveDay(STORE, state, day);
    busy = true;
    paintProbe(r, p, true);
    current = "";
    shiftStr = "";
    setTimeout(() => {
      busy = false;
      paintKeyboard();
      if (state.probes.length >= ROWS) {
        mode = "final";
        toast("Out of probes. Time to lock in.");
      }
      paintInput();
    }, LEN * 160 + 220);
  }

  function askLockIn() {
    if (mode !== "final") return setMode("final");
    if (finalStr.length < LEN) { shake(finalEl); return toast("Not enough letters"); }
    if (!VALID.has(finalStr)) { shake(finalEl); return toast("Final answer must be a real word"); }
    $("confirmWord").textContent = finalStr.toUpperCase();
    $("confirmModal").classList.add("open");
  }

  function lockIn() {
    closeModals();
    state.final = finalStr;
    state.status = finalStr === answer ? "won" : "lost";
    if (source !== "custom") track(`caesarle/${state.status}`, `Caesarle: ${state.status}`);
    Daily.saveDay(STORE, state, day);

    const before = Daily.stats(STORE).lastDay;
    const s = Daily.recordResult(STORE, state.status === "won", state.probes.length);
    if (s.lastDay !== before) {
      const pts = Daily.load(`dg:${STORE}:points`, { total: 0, best: null, games: 0 });
      const t = points().total;
      pts.total += t;
      pts.games += 1;
      pts.best = pts.best === null ? t : Math.max(pts.best, t);
      Daily.save(`dg:${STORE}:points`, pts);
    }
    paintInput();
    const t = points().total;
    toast(state.status === "won" ? `${t >= 0 ? "+" : ""}${t} points` : `Not quite… ${t} points`, 1600);
    setTimeout(openStats, 1100);
  }

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // typing in the wheel's word box or turning the wheel shouldn't type into the board
    if (e.target.closest && e.target.closest(".wheel input, .wheel-stage")) return;
    if (e.key === "Escape" && $("wheelPanel").classList.contains("open")) return toggleWheel(false);
    if ($("confirmModal").classList.contains("open")) {
      if (e.key === "Enter") { e.preventDefault(); lockIn(); }
      if (e.key === "Escape") closeModals();
      return;
    }
    if (document.querySelector(".modal.open")) {
      if (e.key === "Escape") closeModals();
      return;
    }
    if (e.key === "Tab") { e.preventDefault(); return press("tab"); }
    if (e.key === "Enter") return press("enter");
    if (e.key === "Backspace") return press("back");
    if (e.key.length === 1) press(e.key.toLowerCase());
  });
  kbEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-key]");
    if (b) { press(b.dataset.key); b.blur(); }
  });
  finalEl.addEventListener("click", () => setMode("final"));
  boardEl.addEventListener("click", () => setMode("probe"));
  $("lockBtn").addEventListener("click", (e) => { e.currentTarget.blur(); askLockIn(); });
  $("confirmYes").addEventListener("click", lockIn);

  // ---------- modals ----------
  function closeModals() { document.querySelectorAll(".modal.open").forEach((m) => m.classList.remove("open")); }
  document.querySelectorAll(".modal").forEach((m) =>
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) closeModals(); })
  );
  $("helpBtn").addEventListener("click", () => $("helpModal").classList.add("open"));
  $("statsBtn").addEventListener("click", openStats);

  function shareText() {
    const { total, items } = points();
    const emoji = { hit: "🟩", near: "🟨", miss: "⬛" };
    const arr = { exact: "✅", up: "⬆️", down: "⬇️", none: "▪️" };
    const rows = state.probes.map((p) => colors(p.word).map((c) => emoji[c]).join("") + " " + arr[arrow(p.shift)]);
    const badges = items.map(([l]) => l.match(/^\p{Extended_Pictographic}/u)?.[0]).filter(Boolean).join("");
    const end = state.status === "won" ? `🔓 Cracked${badges ? " · " + badges : ""}` : "💀 Wrong answer";
    return `Caesarle #${day} · ${total} points\n${rows.join("\n")}${rows.length ? "\n" : ""}${end}\n${location.origin}${location.pathname}`;
  }

  let timer;
  function openStats() {
    const s = Daily.stats(STORE);
    const pts = Daily.load(`dg:${STORE}:points`, { total: 0, best: null, games: 0 });
    const avg = pts.games ? Math.round(pts.total / pts.games) : 0;
    const max = Math.max(1, ...Object.values(s.dist));
    const today = state.status === "won" ? state.probes.length : null;
    let dist = "";
    for (let i = 0; i <= ROWS; i++) {
      const v = s.dist[i] || 0;
      dist += `<div class="bar"><span>${i}</span><span class="fill${today === i ? " today" : ""}" style="width:${Math.max(8, (v / max) * 100)}%">${v}</span></div>`;
    }
    $("statsBody").innerHTML = `
      <div class="stat-row">
        <div><b>${s.played}</b><small>Played</small></div>
        <div><b>${s.played ? Math.round((s.wins / s.played) * 100) : 0}</b><small>Win %</small></div>
        <div><b>${s.streak}</b><small>Streak</small></div>
        <div><b>${avg}</b><small>Avg pts</small></div>
        <div><b>${pts.best ?? "–"}</b><small>Best pts</small></div>
      </div>
      <div class="muted" style="margin-bottom:6px">Probes used on wins</div>
      <div class="dist">${dist}</div>`;

    const end = $("endBlock");
    if (state.status === "playing") {
      end.innerHTML = "";
    } else {
      const { total, items } = points();
      end.innerHTML = `
        <div class="verdict ${state.status}">${state.status === "won" ? "Cipher cracked" : "The legions are lost"}</div>
        <div class="score">${total} <small style="font-size:1rem">points</small></div>
        <table class="points">${items.map(([l, v]) => `<tr><td>${l}</td><td>${v > 0 ? "+" : ""}${v}</td></tr>`).join("")}</table>
        <div class="reveal">The word was <b>${answer.toUpperCase()}</b><br>shift ${shift} → ${cipher.toUpperCase()}</div>
        <div class="actions"><button class="btn" id="shareBtn">Share</button>
          <a class="btn secondary" href="../" style="text-decoration:none">More games</a></div>
        <div class="next">Next cipher in <span id="cd">${Daily.countdown()}</span></div>
        <div class="next"><a href="../contact/?game=caesarle">Suggest a word or report a problem</a></div>`;
      $("shareBtn").addEventListener("click", async () => {
        const r = await Daily.share(shareText());
        track("caesarle/shared", "Caesarle: shared a result");
        toast(r === "copied" ? "Copied to clipboard" : r === "shared" ? "Shared" : "Couldn't copy");
      });
      clearInterval(timer);
      timer = setInterval(() => {
        const el = $("cd");
        if (!el) return clearInterval(timer);
        el.textContent = Daily.countdown();
      }, 1000);
    }
    $("statsModal").classList.add("open");
  }

  // ---------- cipher wheel ----------
  const wheel = CipherWheel($("wheelPanel"), {
    useLabel: "Use as my shift guess",
    onUse: (k) => {
      if (state.status !== "playing" || state.probes.length >= ROWS) return toast("No probe rows left");
      mode = "probe";
      shiftStr = String(k);
      paintInput();
      toggleWheel(false);
      toast(`Shift guess set to ${k}`);
    },
  });
  function toggleWheel(open) {
    const p = $("wheelPanel");
    const o = open ?? !p.classList.contains("open");
    p.classList.toggle("open", o);
    $("scrim").classList.toggle("open", o);
  }
  $("wheelBtn").addEventListener("click", () => toggleWheel());
  $("scrim").addEventListener("click", () => toggleWheel(false));

  // ---------- boot ----------
  buildBoard();
  buildKeyboard();
  state.probes.forEach((p, r) => paintProbe(r, p, false));
  paintKeyboard();
  paintInput();

  if (state.status !== "playing") setTimeout(openStats, 300);
  else if (!Daily.load(`dg:${GAME}:seenHelp2`, false)) {
    Daily.save(`dg:${GAME}:seenHelp2`, true);
    $("helpModal").classList.add("open");
  }

  // For you while testing (not shown to players): run caesarleAnswer() in the console.
  window.caesarleAnswer = () => ({ day, date, answer, shift, cipher, source });

  // Upcoming puzzles, for checking the schedule. In the console: caesarleCalendar(30)
  function puzzleFor(d) {
    const iso = Daily.dayToDate(d);
    const p = SCHEDULE[iso];
    const ok = p && /^[a-z]{5}$/i.test(p.word || "");
    let k = 1 + Math.floor(Daily.rng(`${GAME}:shift:${d}`)() * 25);
    if (ok && p.shift >= 1 && p.shift <= 25) k = p.shift;
    return { day: d, date: iso, word: ok ? p.word.toLowerCase() : Daily.pick(window.CAESARLE_ANSWERS, d), shift: k, from: ok ? "schedule" : "list" };
  }
  // How many days until the play-order list runs out and starts repeating.
  function runway() {
    const left = window.CAESARLE_ANSWERS.length - Daily.dayNumber() + 1;
    return { daysLeft: left, lastDate: Daily.dayToDate(window.CAESARLE_ANSWERS.length) };
  }
  if (TEST) {
    window.caesarleCalendar = (n = 30, from = Daily.dayNumber()) => {
      const rows = Array.from({ length: n }, (_, i) => puzzleFor(from + i));
      console.table(rows);
      return rows;
    };
  }

  // ---------- test panel ----------
  if (TEST) buildTestPanel();
  function buildTestPanel() {
    const go = (extra) => {
      const p = new URLSearchParams(location.search);
      ["day", "date", "word", "shift"].forEach((k) => p.delete(k));
      Object.entries(extra).forEach(([k, v]) => p.set(k, v));
      location.search = p.toString();
    };
    const panel = document.createElement("div");
    panel.className = "test-panel";
    panel.innerHTML = `
      <div class="tp-head"><b>TEST MODE</b><button class="tp-min" title="Collapse">–</button></div>
      <div class="tp-body">
        <div class="tp-ans">
          <span>answer <b data-reveal>${answer.toUpperCase()}</b></span>
          <span>shift <b data-reveal>${shift}</b></span>
          <span>cipher <b data-reveal>${cipher.toUpperCase()}</b></span>
          <label><input type="checkbox" data-hide> hide</label>
        </div>
        <div class="tp-row tp-meta">
          <span>${date} · ${source === "schedule" ? "pinned in schedule" : source === "custom" ? "custom puzzle" : "from word list"}</span>
          <span class="${runway().daysLeft < 60 ? "tp-warn" : ""}">list runs out ${runway().lastDate} (${runway().daysLeft} days)</span>
        </div>
        <div class="tp-row">
          <span>${forced ? "custom" : `day #${day}`}</span>
          <button data-act="prev">◀ day</button>
          <button data-act="next">day ▶</button>
          <button data-act="rand">random</button>
          <button data-act="today">today</button>
          <input data-date type="date" value="${date}" title="jump to a date">
        </div>
        <div class="tp-row">
          <input data-w maxlength="5" placeholder="word" value="${forced ? answer : ""}">
          <input data-s type="number" min="1" max="25" placeholder="shift" value="${forced ? shift : ""}">
          <button data-act="custom">play</button>
        </div>
        <div class="tp-row">
          <button data-act="reset">reset puzzle</button>
          <button data-act="clear">clear all test data</button>
          <button data-act="calendar">next 30 days → console</button>
          <button data-act="real">exit test mode</button>
        </div>
      </div>`;
    document.body.appendChild(panel);
    if (innerWidth < 600) panel.classList.add("min"); // don't cover the keyboard on phones
    const q = (s) => panel.querySelector(s);
    const hide = q("[data-hide]");
    hide.checked = Daily.load("dg:test:hide", false);
    const applyHide = () => panel.querySelectorAll("[data-reveal]").forEach((b) => b.classList.toggle("blur", hide.checked));
    hide.addEventListener("change", () => { Daily.save("dg:test:hide", hide.checked); applyHide(); });
    applyHide();
    q(".tp-min").addEventListener("click", () => panel.classList.toggle("min"));
    panel.addEventListener("click", (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (!act) return;
      if (act === "prev") go({ day: Math.max(1, day - 1) });
      if (act === "next") go({ day: day + 1 });
      if (act === "rand") go({ day: 1 + Math.floor(Math.random() * window.CAESARLE_ANSWERS.length) });
      if (act === "today") go({});
      if (act === "calendar") { window.caesarleCalendar(30); toast("Next 30 days printed to the console"); }
      if (act === "custom") {
        const w = q("[data-w]").value.trim().toLowerCase();
        const s = parseInt(q("[data-s]").value, 10);
        if (!/^[a-z]{5}$/.test(w)) return toast("Word must be 5 letters");
        if (!(s >= 1 && s <= 25)) return toast("Shift must be 1–25");
        go({ word: w, shift: s });
      }
      if (act === "reset") { try { localStorage.removeItem(`dg:${STORE}:day:${day}`); } catch (err) {} location.reload(); }
      if (act === "clear") {
        try { Object.keys(localStorage).filter((k) => k.startsWith(`dg:${GAME}-test`)).forEach((k) => localStorage.removeItem(k)); } catch (err) {}
        location.reload();
      }
      if (act === "real") go({ test: 0 });
    });
    q("[data-date]").addEventListener("change", (e) => {
      if (e.target.value && Daily.dateToDay(e.target.value) > 0) go({ date: e.target.value });
    });
    // keep typing in the panel out of the game board
    panel.addEventListener("keydown", (e) => e.stopPropagation());
  }
})();
