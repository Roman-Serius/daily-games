// Shared helpers for every daily game on the site.
// Load with <script src="../shared/daily.js"></script>; exposes window.Daily.
(function () {
  // ---- TEST MODE ----
  // While true, every game shows its test panel and keeps its saves and stats
  // separate from real play. Set to false before launch.
  // A URL can override it either way: ?test=1 or ?test=0
  const TEST_MODE = false;
  const testParam = new URLSearchParams(location.search).get("test");
  const TEST = testParam === null ? TEST_MODE : testParam !== "0";

  // Day #1 of the site. Every game counts from here.
  const LAUNCH = Date.UTC(2026, 10, 12); // months are 0-based: 10 = November

  // Today's puzzle number, based on the player's local calendar date
  // (same approach as Wordle: everyone gets puzzle N on their own "today").
  function dayNumber(date = new Date()) {
    const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((local - LAUNCH) / 86400000) + 1;
  }

  // "2026-11-12" <-> day 1
  function dayToDate(day) {
    return new Date(LAUNCH + (day - 1) * 86400000).toISOString().slice(0, 10);
  }
  function dateToDay(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return Math.floor((Date.UTC(y, m - 1, d) - LAUNCH) / 86400000) + 1;
  }

  // Allow ?day=12 or ?date=2026-12-25 in the URL for testing / an archive later.
  function currentDay() {
    const p = new URLSearchParams(location.search);
    const date = p.get("date");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && dateToDay(date) > 0) return dateToDay(date);
    const n = parseInt(p.get("day"), 10);
    return Number.isFinite(n) && n > 0 ? n : dayNumber();
  }

  function isArchiveDay() {
    return currentDay() !== dayNumber();
  }

  // Deterministic string hash -> 32-bit seed.
  function hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  // Small, fast seeded PRNG. Returns a function giving floats in [0, 1).
  function rng(seedText) {
    let a = hash(String(seedText));
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Seeded Fisher-Yates shuffle (returns a new array).
  function shuffle(arr, seedText) {
    const r = rng(seedText);
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // Today's item from a list kept in PLAY ORDER: item 1 = day 1, item 2 = day 2...
  // Append new items to the end; never insert, delete or reorder earlier ones,
  // or every later day changes. Wraps around when the list runs out.
  function pick(list, day = currentDay()) {
    return list[(day - 1) % list.length];
  }

  // ---- storage (wrapped: storage can be unavailable in some contexts) ----
  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  // Per-game, per-day saved progress.
  function loadDay(gameId, day = currentDay()) {
    return load(`dg:${gameId}:day:${day}`, null);
  }
  function saveDay(gameId, state, day = currentDay()) {
    save(`dg:${gameId}:day:${day}`, state);
  }

  // Stats: played, wins, streaks, guess distribution.
  function stats(gameId) {
    return load(`dg:${gameId}:stats`, {
      played: 0, wins: 0, streak: 0, maxStreak: 0, lastDay: 0, dist: {},
    });
  }
  function recordResult(gameId, won, score) {
    if (isArchiveDay()) return stats(gameId); // archive plays don't touch streaks
    const s = stats(gameId);
    const day = currentDay();
    if (s.lastDay === day) return s; // already recorded today
    s.played++;
    if (won) {
      s.wins++;
      s.streak = s.lastDay === day - 1 ? s.streak + 1 : 1;
      s.maxStreak = Math.max(s.maxStreak, s.streak);
      s.dist[score] = (s.dist[score] || 0) + 1;
    } else {
      s.streak = 0;
    }
    s.lastDay = day;
    save(`dg:${gameId}:stats`, s);
    return s;
  }

  // Copy share text (falls back to native share sheet on phones).
  async function share(text) {
    try {
      if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        await navigator.share({ text });
        return "shared";
      }
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch (e) {
      return "failed";
    }
  }

  // Time until the next local midnight, as "HH:MM:SS".
  function countdown() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const s = Math.max(0, Math.floor((next - now) / 1000));
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  }

  // ---- colour-blind mode (site-wide, remembered per browser) ----
  // Adds the "cb" class to <html>; shared/style.css swaps the colours and adds
  // shape marks. Games read Daily.colorBlind() for things like share emoji.
  function colorBlind() {
    return !!load("dg:colorblind", false);
  }
  function setColorBlind(on) {
    save("dg:colorblind", !!on);
    document.documentElement.classList.toggle("cb", !!on);
  }
  document.documentElement.classList.toggle("cb", colorBlind());

  window.Daily = {
    colorBlind, setColorBlind,
    TEST,
    dayNumber, dayToDate, dateToDay, currentDay, isArchiveDay, rng, shuffle, pick,
    load, save, loadDay, saveDay, stats, recordResult, share, countdown,
  };
})();
