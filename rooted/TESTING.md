# Rooted: review, test, publish

## 1. Review what will be published

From the repo folder (`~/Developer/Website/daily-games`):

```
git status                      # what's changed
git diff                        # line-by-line changes to files git already tracks
git add -n rooted               # dry run: every Rooted file that would be published
```

Expect `git add -n rooted` to list about 20 files: the game (index.html, rooted.js,
rooted.css, core.js, puzzles.js, words.js, words_wiki.js, misses.html, README.md),
the sprite sheet PNG and the tools. It must NOT list anything in `rooted/tools/data/`
(the 3.3 GB Wiktionary file) or the `.aseprite` file.

## 2. Test locally

```
python3 rooted/tools/serve.py
```

Then open these in the browser (hard refresh with Cmd+Shift+R if something looks old):

- [ ] http://localhost:8000/ : the hub shows a Rooted card with a gold "beta" tag; it links to the game
- [ ] http://localhost:8000/contact/ : Rooted is in the game list
- [ ] http://localhost:8000/rooted/ : title says **#1**, the beta note sits under it
- [ ] Play a whole puzzle: words accepted, roots grow, gold wave and tangle on a solve, points breakdown, share text says `Rooted #1`
- [ ] Reload after finishing: the end screen comes back, you can't replay
- [ ] Hub again: Rooted card says "played today"
- [ ] Type a made-up word: it's rejected, and http://localhost:8000/rooted/misses.html lists it
- [ ] Phone size: in the browser, View > Developer > Developer Tools, toggle the device toolbar, pick an iPhone
- [ ] Day numbers: `/rooted/?date=2026-11-17` says #2 (archive), `/rooted/?date=2026-11-18` says #3

Local play never writes to the Google Sheet (misses go to tools/data/misses.jsonl
instead), and test or archive days don't count toward your real stats.

Practice and tools: `/rooted/?endless=1` (endless random puzzles) and
`/rooted/?test=1&from=uniform&to=sacrifice` (any pair).

When done, stop the server with Ctrl+C. To clear your local test plays, run
`localStorage.clear()` in the browser console on localhost:8000 (this only
affects localhost, not the live site).

## 3. Publish

1. **Set day 1.** In `rooted/puzzles.js`, set `window.ROOTED_LAUNCH` to the date
   you're publishing, e.g. `"2026-11-17"`. That date is Rooted #1, the next day #2, and so on.
   Before that date the game stays on #1.
2. **Commit and push** (leaves out your unrelated `haikudle/README.md` edit):
   ```
   git add .gitignore index.html shared/games.js sitemap.xml rooted
   git commit -m "Rooted beta"
   git push
   ```
3. **Check the live site** after a minute or two (GitHub Pages takes a moment):
   https://romanserius.com/daily-games/ and https://romanserius.com/daily-games/rooted/
   - [ ] The game loads and says #1
   - [ ] Type a made-up word, then within a few seconds a row appears in your Google Sheet. Delete that row after.

## 4. After launch

- Pull missed words any time: `python3 rooted/tools/pull-misses.py`, then ask for a word sweep.
- There are 30 puzzles. On day 31 they start repeating from #1, so add more before then
  (append to the end of `ROOTED_PUZZLES`; never reorder ones that have been played).
