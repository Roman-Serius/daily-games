# Haikudle

Every day there's a new draw of words. Build a 5-7-5 haiku from them plus the
filler words, post it, then read and like everyone else's. At changeover the
top 3 are saved and shown the next day.

This folder holds the backend so far. The page itself (`index.html` etc.) comes next.

```
haikudle/
  README.md
  supabase/
    schema.sql     tables, rules, security, filler words (run first)
    seed_dev.sql   small sample word pool + random draws for days 1-60 (testing only)
  tools/
    words.csv      the word pool: word, syllables, pos (edit freely)
    build.py       checks words.csv and builds the daily draws
    schedule.csv   optional: curate specific dates (like Caesarle's schedule)
    .draw-seed     SECRET random seed (git-ignored)
    out/           SECRET generated SQL + preview of future draws (git-ignored)
```

## Word pool and daily draws

`tools/words.csv` has about 1,470 hand-picked words (830 nouns, 350 verbs,
220 adjectives, 70 adverbs) chosen for strong images. Words whose syllable
count people disagree on ("fire", "flower", "memory", "every") are left out
on purpose, so nobody fights the counter.

```sh
cd haikudle/tools
python3 build.py            # check words.csv, build days 1-365 into out/load.sql
python3 build.py --to 730   # build two years ahead
python3 build.py --check    # only check words.csv
```

Then paste `out/load.sql` into Supabase's SQL Editor and run it. It's safe to
re-run whenever you change anything: it updates the word list and replaces the
draws for **future days only**. Today and past days never change. Words you
delete from the CSV are switched off rather than removed, since old haiku use them.

Each day's draw is 18 words: 7 nouns, 5 verbs, 4 adjectives, 2 adverbs, with at
least 4 one-syllable words and 2–3 longer ones. A word doesn't come back within
30 days, and related forms (drift / drifting) never share a draw. All of this is
set at the top of `build.py`.

`out/preview.txt` lists every future draw with its date, so you can look ahead.

### Curating days (like Caesarle's schedule)

Add a line to `tools/schedule.csv` for any date:

```csv
date,theme,words
2026-12-25,christmas,snow candle bell
2026-12-31,new year,moth rain stone moon frost train bone salt smoke ash dusk dawn kettle lantern river window drift hum
```

- **A few words** are guaranteed in that day's draw; the rest is drawn as usual.
- **18 words** make exactly that day's draw.
- `theme` is just a note for you; players don't see it.
- Words must already be in `words.csv` (add them there first, with syllables).

Then publish it (below), or run `python3 build.py` and paste `out/load.sql` into
Supabase by hand (your saved "Haikudle – words & draws" query). Only future days change; today and the past never do.
To swap out one word you don't like on a coming day, pin a few words for that date,
or remove the word from `words.csv` and rebuild.

### Publishing in one command

`tools/publish.sh` rebuilds and uploads in one go, no copy-paste:

```sh
cd ~/Developer/daily-games/haikudle/tools
./publish.sh             # after editing words.csv or schedule.csv
./publish.sh --schema    # after changing supabase/schema.sql too
./publish.sh --to 730    # next October: build another year of draws
```

One-time setup:
1. Install psql: `brew install libpq` (or install Postgres.app).
2. In Supabase, click **Connect** (top of the project), choose **Session pooler**, and copy
   the URI. Replace `[YOUR-PASSWORD]` with your database password (Project Settings →
   Database → reset it there if you don't know it).
3. Save it as `tools/.supabase-db-url` (one line). It's git-ignored; never share it.

**Keep the seed secret.** Draws are shuffled using `.draw-seed`, so anyone with that
file could predict them. It and `out/` are git-ignored; back up `.draw-seed`
somewhere private. If it's lost, a new one is made and future draws just change.

The syllable check uses a rough rule, so its warnings are usually false alarms.
If you download the CMU Pronouncing Dictionary
(`github.com/cmusphinx/cmudict`, file `cmudict.dict`), run
`python3 build.py --check --cmudict cmudict.dict` for an exact check.

## The rules (enforced by the database)

| Rule | Detail |
|---|---|
| Day boundary | Midnight at UTC-12 = 12:00 UTC = 4am Pacific / 7am Eastern (5am / 8am in summer). Day #1 = Nov 12, 2026, same numbering as Caesarle. |
| Future draws | A day's words can't be read before that day starts. |
| Haiku shape | 3 lines, 5-7-5 syllables. |
| Draw words | Each one can be used once. |
| Glue (filler) words | 37 one-syllable words (the, of, and…). Up to 7 in a haiku. |
| Posting | One haiku per player per day. |
| Hidden feed | Other people's haiku for today stay hidden until you've posted. |
| Likes | Like as many as you want, never your own. Tap again to unlike. |
| Closing | Liking closes at changeover. |
| Results | Top 3 by likes. Ties: earliest submitted wins. |
| Duplicates | Allowed. `today()` tells you how many other people wrote the exact same haiku. |

Haiku are stored as word IDs (`[[12, 4, 88], [...], [...]]`). The text is
rendered from them on the server, so it can't be faked.

Rules that are easy to change later, all in `submit_haiku` in `schema.sql`:
the 7-glue-word cap, single-use draw words, and the 5-7-5 targets.

Note: the daily *draw* changes at the UTC-12 changeover, while Caesarle changes at
each player's local midnight. They're separate games, so that's fine; just don't use
`Daily.dayNumber()` from `shared/daily.js` for Haikudle. Ask the server (`today()`).

## Setup (one time, about 10 minutes)

1. Make a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste all of `supabase/schema.sql` → Run.
   (It's safe to run again after edits.)
3. Run `tools/out/load.sql` (made by `tools/build.py`, see below) to load the real
   words and a year of draws. You don't need `seed_dev.sql` anymore; it's only a
   small fallback for testing.
4. **Project Settings → API → Exposed schemas**: add `haikudle`.
5. **Authentication → Sign In / Providers**: turn on **Allow anonymous sign-ins**.
   Turning on CAPTCHA there too is a good idea before launch, so nobody can
   script thousands of fake players to like their own haiku.
6. Optional: **Database → Extensions** → enable `pg_cron`, then run the two
   commented-out lines at the bottom of `schema.sql`. Without it, the top 3 are
   saved the first time someone loads the page after changeover, which also works.
7. Copy the **Project URL** and **anon public key** (Settings → API). Both are
   safe to put in the page source; the rules above are what protect the data.

## Calling it from the page

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const db = sb.schema("haikudle");

  // Once per visit: sign in anonymously (the session is remembered by the browser).
  const { data: { session } } = await sb.auth.getSession();
  if (!session) await sb.auth.signInAnonymously();

  // Everything for the page: day, ends_at, words, fillers, submitted, mine, same_as_mine
  const { data: today } = await db.rpc("today");

  // Post. lines = arrays of word IDs. On a rule break, error.message is
  // a friendly sentence ("Line 2 has 6 syllables; it needs 7").
  const { data, error } = await db.rpc("submit_haiku", { p_lines: [[12, 4], [9, 31, 2], [7, 15]] });

  // Feed: 'newest' (default) | 'oldest' | 'most_liked' | 'least_liked'
  const { data: feed } = await db.rpc("get_feed", { p_sort: "most_liked", p_limit: 50, p_offset: 0 });

  // Like / unlike. Returns true if it's now liked.
  const { data: liked } = await db.rpc("toggle_like", { p_haiku_id: 42 });

  // Yesterday's top 3 (or pass p_day for any finished day)
  const { data: top } = await db.rpc("day_top");

  // Flag one for review
  await db.rpc("report_haiku", { p_haiku_id: 42, p_reason: "spam" });
</script>
```

| Function | Who | Returns |
|---|---|---|
| `today()` | anyone | `{ day, ends_at, words[], fillers[], submitted, mine, same_as_mine }` |
| `submit_haiku(p_lines)` | signed in | `{ id, body, day, created_at }` |
| `get_feed(p_sort, p_limit, p_offset)` | signed in, after posting | rows of `id, body, lines, like_count, created_at, liked_by_me, is_mine` (max 100 per page) |
| `toggle_like(p_haiku_id)` | signed in, after posting | `true` / `false` |
| `day_top(p_day)` | anyone | up to 3 rows of `day, rank, haiku_id, body, like_count` |
| `report_haiku(p_haiku_id, p_reason)` | signed in | nothing |

Use `ends_at` from `today()` for the countdown to the next puzzle, and refresh
when it passes, since liking stops then.

## Moderation

Reports land in the `reports` table (only visible in your dashboard), and
`haiku.report_count` goes up. Nothing hides automatically. To remove one:

```sql
update haikudle.haiku set hidden = true where id = 123;
```

If you hide one that was already in a day's top 3, re-save that day:

```sql
delete from haikudle.daily_top where day = 5;
select haikudle.finalize_day(5);
```

## Still to build

- The page: tiles, live syllable counter, 5-7-5 lines, feed with sort buttons,
  like hearts, yesterday's top 3, share card.
- Add Haikudle to `shared/games.js`.
