# Daily Games

Small daily puzzles: one a day, the same for everyone. Plain HTML/CSS/JS with no build step, so it runs on GitHub Pages as is.

```
index.html          hub page (edit the GAMES list to add a game)
shared/daily.js     day number, seeded randomness, saved progress, stats, share
shared/style.css    shared palette and components
caesarle/           game 1
.nojekyll           tells GitHub Pages to serve files untouched
```

## Run locally

```sh
cd daily-games
python3 -m http.server 8000
# open http://localhost:8000
```

Test mode is ON while `TEST_MODE = true` in `shared/daily.js` (see TESTING.md).
It adds a test panel and keeps test saves separate. Set it to false before launch.

Testing tricks:
- `?day=5` on any game URL plays puzzle #5 (archive plays don't affect streaks).
- In the browser console, `caesarleAnswer()` shows today's word and shift.
- To reset: `localStorage.clear()` in the console.

## Deploy to GitHub Pages

1. Create a repo under Roman-Serius named `daily-games`. Because the homepage repo
   (`Roman-Serius.github.io`) uses the custom domain romanserius.com, this repo is
   served at `https://romanserius.com/daily-games/` automatically (old
   roman-serius.github.io links redirect there).
2. From this folder:
   ```sh
   git init && git add . && git commit -m "Daily games: hub + Caesarle"
   git branch -M main
   git remote add origin https://github.com/Roman-Serius/daily-games.git
   git push -u origin main
   ```
3. Repo → Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.

All links are relative, so the site works at a sub-path or on a custom domain.

## How "daily" works

`Daily.dayNumber()` counts days since launch (Nov 11, 2026 = #1) by the player's
local calendar date, like Wordle. Each game picks today's content with
`Daily.pick(list, "gameId")`, which shuffles the list with a fixed seed and walks
through it, so nothing repeats until the list runs out. Caesarle has 737 answers,
about two years' worth.

The answer list is visible in the page source, as it is for Wordle. That's fine for a
casual game.

## Adding a game

1. Copy the `caesarle/` folder as a starting point (or start blank).
2. Include `../shared/style.css` and `../shared/daily.js`.
3. Use `Daily.currentDay()`, `Daily.pick()`, `Daily.loadDay/saveDay()`,
   `Daily.recordResult()` and `Daily.share()`.
4. Add an entry to `GAMES` in `index.html`.

Games that need shared data (like the Trolley poll showing what % of people chose
each option) need a small backend. GitHub Pages only serves static files. Free
options: Supabase (Postgres + REST), Firebase, or a Cloudflare Worker + KV.

## Caesarle

Rules live in `caesarle/caesarle.js` (`classify`, `colors`, `points`).
- Probe rows score against the encrypted word; a probe may be a real word or a
  real word written in today's shift.
- The final answer is a separate one-shot row (Tab or tap to focus).
- `words.js` holds 737 answers and 6,551 valid guesses (from the Hunspell en_US
  dictionary with plurals/verb forms expanded). Add answers freely; any answer
  is also accepted as a guess.
