#!/usr/bin/env python3
"""
Haikudle word pool + daily draw builder.

    python3 build.py            check words.csv and write out/load.sql for days 1-365
    python3 build.py --to 730   build further ahead
    python3 build.py --check    only check words.csv (syllable warnings etc.)
    python3 build.py --cmudict cmudict.dict   also check syllables against the CMU dictionary

Then paste out/load.sql into Supabase -> SQL Editor -> Run.

Safe to re-run any time (after editing words.csv, the recipe, or themes.csv):
the SQL updates the word list and replaces draws for FUTURE days only.
Today and past days are never changed, because people have already played them.

SECRET: draws are shuffled with the random seed in .draw-seed (made on first run).
Anyone with that file and this script could work out every future draw, so
.draw-seed and out/ are git-ignored. Keep a backup of .draw-seed somewhere private:
without it, re-running gives different future draws (harmless, just different).

Standard library only; no installs needed.
"""
import argparse
import csv
import random
import re
import secrets
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORDS_CSV = HERE / "words.csv"
THEMES_CSV = HERE / "themes.csv"   # optional
SEED_FILE = HERE / ".draw-seed"
OUT_DIR = HERE / "out"

# ---- Draw recipe -----------------------------------------------------------
RECIPE = {"noun": 7, "verb": 5, "adj": 4, "adv": 2}   # 18 words a day
MIN_ONE_SYLLABLE = 4     # enough short words to finish lines neatly
MIN_LONG = 2             # at least this many words of 3+ syllables...
MAX_VERY_LONG = 2        # ...but at most this many of 4+
SPACING_DAYS = 30        # a word doesn't come back within this many days

# Must match the filler words in supabase/schema.sql.
FILLERS = set("""a an the i you it we they me my your its is are was be of to in on at
by with from for through and but or as if so not no this that all""".split())

POS = {"noun", "verb", "adj", "adv", "other"}


def die(msg):
    sys.exit(f"error: {msg}")


def guess_syllables(word):
    """Rough rule-of-thumb count, only used to flag possible typos in words.csv."""
    w = word.lower().replace("-", "")
    if len(w) <= 3:
        return 1
    # silent e before common suffixes: basement, careful, lately, homeward
    w = re.sub(r"(?<=[aeiou][^aeiouy])e(?=(ment|less|ly|ful|ness|ward|where|times)$)", "", w)
    if re.search(r"[^aeiouy]ed$", w) and not re.search(r"[td]ed$", w):
        w = w[:-2]                                   # walked (but not waited)
    elif re.search(r"[^aeiouy]es$", w) and not re.search(r"(s|x|z|ch|sh|g|c)es$", w):
        w = w[:-2]                                   # flames (but not ashes)
    elif w.endswith("e") and not re.search(r"[^aeiouy]le$", w):
        w = w[:-1]                                   # silent e (but candle keeps it)
    w = re.sub(r"^y", "", w)
    count = len(re.findall(r"[aeiouy]+", w))
    # vowel pairs that are usually two syllables: piano, radio, museum, giant, poet
    # (but not -tion, -sion, -cian, -geon, onion, or the u in qu)
    count += len(re.findall(r"(?<![tscgn])i[aou]|eo|oe|(?<!q)ua|eu(?=m)|yi|ei(?=ng)|ie(?=t)", w))
    return max(1, count)


def stem(word):
    """Crude stem so 'drift', 'drifted' and 'drifting' don't share a draw."""
    w = word.lower()
    for suffix in ("ing", "ed", "s"):
        if w.endswith(suffix) and len(w) - len(suffix) >= 3:
            w = w[: -len(suffix)]
            break
    if len(w) > 3 and w[-1] == w[-2]:   # running -> runn -> run
        w = w[:-1]
    return w.rstrip("e")


def load_words():
    if not WORDS_CSV.exists():
        die(f"{WORDS_CSV} not found")
    words, seen, problems = [], {}, []
    with WORDS_CSV.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != ["word", "syllables", "pos"]:
            die("words.csv header must be: word,syllables,pos")
        for line, row in enumerate(reader, start=2):
            word = (row["word"] or "").strip().lower()
            pos = (row["pos"] or "").strip().lower()
            try:
                syl = int(row["syllables"])
            except (TypeError, ValueError):
                problems.append(f"line {line}: syllables must be a number ({row})")
                continue
            if not re.fullmatch(r"[a-z][a-z'-]*", word):
                problems.append(f"line {line}: '{word}' should be lowercase letters only")
            if not 1 <= syl <= 7:
                problems.append(f"line {line}: '{word}' syllables must be 1-7")
            if pos not in POS:
                problems.append(f"line {line}: '{word}' pos must be one of {sorted(POS)}")
            if word in FILLERS:
                problems.append(f"line {line}: '{word}' is already a filler word")
            if word in seen:
                problems.append(f"line {line}: '{word}' is a duplicate of line {seen[word]}")
            seen[word] = line
            words.append({"word": word, "syllables": syl, "pos": pos})
    if problems:
        die("words.csv has problems:\n  " + "\n  ".join(problems))
    return words


def load_themes(by_word):
    """Optional themes.csv: day,theme,words  (words = space-separated, must be in words.csv)"""
    themes = {}
    if not THEMES_CSV.exists():
        return themes
    with THEMES_CSV.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            day = int(row["day"])
            forced = (row.get("words") or "").lower().split()
            for w in forced:
                if w not in by_word:
                    die(f"themes.csv day {day}: '{w}' isn't in words.csv")
            themes[day] = {"theme": (row.get("theme") or "").strip() or None, "words": forced}
    return themes


def check_syllables(words, cmudict_path=None):
    warnings = []
    for w in words:
        g = guess_syllables(w["word"])
        if g != w["syllables"]:
            warnings.append(f"  {w['word']}: csv says {w['syllables']}, rule of thumb says {g}")
    print(f"{len(warnings)} words where the rule of thumb disagrees (usually the rule is wrong;"
          " worth a glance):")
    print("\n".join(warnings) if warnings else "  none")

    if cmudict_path:
        prons = {}
        with open(cmudict_path, encoding="latin-1") as f:
            for line in f:
                if not line.strip() or line.startswith(";;;"):
                    continue
                head, *phones = line.split()
                base = re.sub(r"\(\d+\)$", "", head).lower()
                prons.setdefault(base, set()).add(sum(p[-1].isdigit() for p in phones))
        missing, wrong, ambiguous = [], [], []
        for w in words:
            counts = prons.get(w["word"])
            if not counts:
                missing.append(w["word"])
            elif w["syllables"] not in counts:
                wrong.append(f"  {w['word']}: csv {w['syllables']}, CMU {sorted(counts)}")
            elif len(counts) > 1:
                ambiguous.append(f"  {w['word']}: CMU allows {sorted(counts)}")
        print(f"\nCMU dictionary: {len(wrong)} mismatches, {len(ambiguous)} with more than one"
              f" accepted count, {len(missing)} not found")
        for line in wrong + ambiguous:
            print(line)


def get_seed():
    if not SEED_FILE.exists():
        SEED_FILE.write_text(secrets.token_hex(16) + "\n")
        print(f"made a new secret seed in {SEED_FILE.name} (back it up privately; don't commit it)")
    return SEED_FILE.read_text().strip()


def draw_ok(draw):
    syl = [w["syllables"] for w in draw]
    return (sum(s == 1 for s in syl) >= MIN_ONE_SYLLABLE
            and sum(s >= 3 for s in syl) >= MIN_LONG
            and sum(s >= 4 for s in syl) <= MAX_VERY_LONG)


def make_draws(words, themes, last_day, seed):
    by_pos = {p: [w for w in words if w["pos"] == p] for p in RECIPE}
    for p, n in RECIPE.items():
        if len(by_pos[p]) < n * 2:
            die(f"not enough '{p}' words ({len(by_pos[p])}) for {n} a day")
    by_word = {w["word"]: w for w in words}
    last_used = {}
    draws = {}

    for day in range(1, last_day + 1):
        rng = random.Random(f"{seed}:{day}")
        forced = [by_word[w] for w in themes.get(day, {}).get("words", [])]
        spacing = SPACING_DAYS
        draw = None
        for attempt in range(400):
            if attempt and attempt % 100 == 0:
                spacing //= 2           # pool too thin for the spacing: relax it
            pick = list(forced)
            stems = {stem(w["word"]) for w in pick}
            for p, n in RECIPE.items():
                need = n - sum(w["pos"] == p for w in pick)
                pool = [w for w in by_pos[p]
                        if day - last_used.get(w["word"], -10**9) > spacing
                        and w not in pick]
                rng.shuffle(pool)
                for w in pool:
                    if need <= 0:
                        break
                    s = stem(w["word"])
                    if s in stems:
                        continue
                    pick.append(w)
                    stems.add(s)
                    need -= 1
            if len(pick) >= sum(RECIPE.values()) and draw_ok(pick):
                draw = pick
                break
        if draw is None:
            die(f"couldn't build a valid draw for day {day}; add more words or loosen the recipe")
        for w in draw:
            last_used[w["word"]] = day
        draw.sort(key=lambda w: (list(RECIPE).index(w["pos"]) if w["pos"] in RECIPE else 9, w["word"]))
        draws[day] = {"words": draw, "theme": themes.get(day, {}).get("theme")}
    return draws


def sql_str(s):
    return "null" if s is None else "'" + s.replace("'", "''") + "'"


def sql_text_array(items):
    return "array[" + ",".join(sql_str(i) for i in items) + "]::text[]"


def write_sql(words, draws, first_day):
    OUT_DIR.mkdir(exist_ok=True)
    out = OUT_DIR / "load.sql"
    lines = [
        "-- Generated by tools/build.py. SECRET: contains future draws. Don't commit or share.",
        "-- Paste into Supabase -> SQL Editor -> Run. Safe to run again.",
        "begin;",
        "",
        "-- 1. Word pool (adds new words, updates changed ones)",
        "insert into haikudle.words (text, syllables, pos, is_filler, active) values",
        ",\n".join(f"  ({sql_str(w['word'])}, {w['syllables']}, {sql_str(w['pos'])}, false, true)"
                   for w in words),
        "on conflict ((lower(text))) do update",
        "  set syllables = excluded.syllables, pos = excluded.pos, active = true",
        "  where not haikudle.words.is_filler;",
        "",
        "-- Words removed from words.csv are switched off, not deleted (old haiku use them).",
        "update haikudle.words set active = false",
        f"where not is_filler and lower(text) <> all ({sql_text_array(w['word'] for w in words)});",
        "",
        "-- 2. Daily draws. Only future days are replaced; today and the past never change.",
        "insert into haikudle.draws (day, word_ids, theme)",
        "select v.day,",
        "       (select array_agg(w.id order by w.id) from haikudle.words w",
        "        where lower(w.text) = any (v.words) and not w.is_filler),",
        "       v.theme",
        "from (values",
        ",\n".join(f"  ({d}, {sql_text_array(x['word'] for x in draws[d]['words'])}, {sql_str(draws[d]['theme'])})"
                   for d in sorted(draws) if d >= first_day),
        ") as v(day, words, theme)",
        "on conflict (day) do update",
        "  set word_ids = excluded.word_ids, theme = excluded.theme",
        "  where haikudle.draws.day > haikudle.current_day();",
        "",
        "-- Sanity check: every draw found all its words.",
        "do $$ begin",
        "  if exists (select 1 from haikudle.draws d where d.day > haikudle.current_day()",
        f"            and cardinality(d.word_ids) <> {sum(RECIPE.values())}) then",
        "    raise exception 'a future draw is missing words; nothing was saved';",
        "  end if;",
        "end $$;",
        "",
        "commit;",
        "",
    ]
    out.write_text("\n".join(lines), encoding="utf-8")

    preview = OUT_DIR / "preview.txt"
    with preview.open("w", encoding="utf-8") as f:
        f.write("SECRET: future draws. Don't commit or share.\n\n")
        for d in sorted(draws):
            if d < first_day:
                continue
            theme = f"  [{draws[d]['theme']}]" if draws[d]["theme"] else ""
            f.write(f"#{d}{theme}\n")
            for p in RECIPE:
                ws = [f"{w['word']}({w['syllables']})" for w in draws[d]["words"] if w["pos"] == p]
                f.write(f"  {p:5} {', '.join(ws)}\n")
            f.write("\n")
    return out, preview


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--to", type=int, default=365, help="last day to build (default 365)")
    ap.add_argument("--from", dest="first", type=int, default=1,
                    help="first day to include in the SQL (default 1; released days are skipped by the SQL anyway)")
    ap.add_argument("--check", action="store_true", help="only check words.csv")
    ap.add_argument("--cmudict", help="path to a CMU pronouncing dictionary file, to verify syllables")
    args = ap.parse_args()

    words = load_words()
    counts = Counter(w["pos"] for w in words)
    syl = Counter(min(w["syllables"], 4) for w in words)
    print(f"{len(words)} words: " + ", ".join(f"{counts[p]} {p}" for p in sorted(counts)))
    print("by syllables: " + ", ".join(f"{k if k < 4 else '4+'}: {syl[k]}" for k in sorted(syl)))
    print()
    check_syllables(words, args.cmudict)
    if args.check:
        return

    by_word = {w["word"]: w for w in words}
    themes = load_themes(by_word)
    draws = make_draws(words, themes, args.to, get_seed())
    out, preview = write_sql(words, draws, args.first)

    used = Counter(w["word"] for d in draws.values() for w in d["words"])
    never = len(words) - len(used)
    print(f"\nbuilt days {args.first}-{args.to}: {out.relative_to(HERE)} (+ {preview.relative_to(HERE)})")
    print(f"most uses of one word: {max(used.values())}; words never drawn: {never}")


if __name__ == "__main__":
    main()
