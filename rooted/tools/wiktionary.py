#!/usr/bin/env python3
"""Import word splits from Wiktionary (kaikki.org wiktextract data) into Rooted.

  1. node tools/export.js > tools/data/current.json
  2. python3 tools/wiktionary.py extract tools/data/<kaikki file>.jsonl[.gz]
        -> tools/data/en-etym.jsonl   (only words Hunspell knows, only etymology templates)
  3. python3 tools/wiktionary.py build
        -> words_wiki.js              (loaded after words.js by the game)
        -> tools/data/report.txt      (what was added, what was skipped, roots worth adding)

Only words.js is ever trusted as hand-checked. words_wiki.js is regenerated
from scratch every time, so never edit it by hand: fix a word by adding it to
words.js (hand entries always win) or to SKIP in tools/wiki-skip.txt.

Standard library only.
"""
import gzip, json, re, sys, unicodedata
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
ROOT = HERE.parent
HUNSPELL = Path("/usr/share/hunspell/en_US.dic")

AFFIX_TEMPLATES = {"affix", "af", "prefix", "pre", "suffix", "suf", "confix", "con", "compound", "com", "surf"}
ETYMON_TEMPLATES = {"der", "inh", "bor", "lbor", "der+", "inh+", "bor+", "slbor", "obor", "ubor", "lbor+", "m", "l"}
LATIN = {"la", "la-lat", "la-new", "la-med", "la-ecc", "la-vul", "la-lat", "LL.", "ML.", "NL.", "VL.", "CL.", "la-cla"}
GREEK = {"grc", "grc-koi", "gkm", "el", "grc-att", "grc-ion"}

# Native English affixes that happen to look like classical roots (mis- is not Greek miso "hate").
ENGLISH_AFFIXES = {"mis", "nor", "non", "out", "over", "under", "fore", "mid", "with", "up", "off", "after",
                   "less", "ness", "ship", "hood", "dom", "ful", "some", "wise", "ward", "like", "ling", "kin"}

# English combining forms -> root, where the spelling alone is ambiguous (-cide: kill, not fall)
COMBINING = {"cide": "cid", "cidal": "cid", "cracy": "crat", "crat": "crat", "cratic": "crat",
             "logy": "log", "logist": "log", "logical": "log", "phile": "phil", "philia": "phil",
             "phobe": "phob", "phobia": "phob", "phobic": "phob", "vore": "vor", "vorous": "vor",
             "ferous": "fer", "graphy": "graph", "graph": "graph", "gram": "graph", "meter": "metr",
             "metry": "metr", "scope": "scop", "scopy": "scop", "phone": "phon", "phony": "phon",
             "pathy": "path", "path": "path", "archy": "arch", "arch": "arch", "nomy": "nomos",
             "sophy": "soph", "cracies": "crat", "morph": "morph", "morphic": "morph", "pod": "pod",
             "ped": "ped", "derm": "derm", "dermal": "derm", "gen": "gen", "genic": "gen", "genesis": "gen"}

# Prefix spellings that change before the next sound (ad + tract = attract).
ASSIMILATE = {
    "ad": "a ac af ag al an ap ar as at",
    "con": "co col com cor",
    "inN": "il im ir ig i",
    "inI": "il im ir i",
    "ob": "oc of op o",
    "sub": "suc suf sug sum sup sur sus su",
    "ex": "e ef ec es",
    "dis": "di dif",
    "syn": "sym syl sy",
    "en": "em",
}

# ---------------------------------------------------------------- helpers
def plain(s):
    """Lowercase ASCII: strips macrons, accents, Greek breathings."""
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()

GREEK_MAP = {
    "α": "a", "β": "b", "γ": "g", "δ": "d", "ε": "e", "ζ": "z", "η": "e", "θ": "th", "ι": "i", "κ": "k",
    "λ": "l", "μ": "m", "ν": "n", "ξ": "x", "ο": "o", "π": "p", "ρ": "r", "σ": "s", "ς": "s", "τ": "t",
    "υ": "u", "φ": "ph", "χ": "kh", "ψ": "ps", "ω": "o", "ϝ": "w",
}

def translit(s):
    """Greek script -> Latin letters the way English borrowed them (γράφω -> grapho)."""
    out = []
    raw = unicodedata.normalize("NFD", s.lower())
    rough = "̔" in raw  # rough breathing on the first vowel -> h
    t = plain(s)
    for i, c in enumerate(t):
        if c == "γ" and i + 1 < len(t) and t[i + 1] in "γκξχ":
            out.append("n"); continue
        if c == "υ" and i > 0 and t[i - 1] in "αεηο":
            out.append("u"); continue
        out.append(GREEK_MAP.get(c, c if c.isascii() else ""))
    w = "".join(out).replace("kh", "ch").replace("k", "c").replace("u", "y").replace("ay", "au").replace("ey", "eu").replace("oy", "ou")
    if rough and w and w[0] in "aeiouy":
        w = "h" + w
    if w.startswith("r") and "̔" in raw[:3]:
        w = "rh" + w[1:]
    return w

def norm_lemma(lemma, lang):
    lemma = re.sub(r"<[^>]*>", "", lemma).strip().strip("*")
    if lang in GREEK:
        return translit(lemma)
    w = plain(lemma).replace("j", "i")
    return re.sub(r"[^a-z]", "", w)

LAT_ENDINGS = ["ire", "ere", "are", "eo", "io", "or", "ri", "o", "us", "um", "a", "is", "es", "ens", "ans", "x", "e", "i", "ae"]
GRK_ENDINGS = ["ein", "o", "os", "on", "e", "es", "a", "is", "ia", "ma"]

def stems(w, lang):
    """Possible stems of a Latin/Greek lemma: videre -> vid, video -> vid."""
    out = {w}
    for e in (GRK_ENDINGS if lang in GREEK else LAT_ENDINGS):
        if w.endswith(e) and len(w) - len(e) >= 3:
            out.add(w[: -len(e)])
    return out

def load_hunspell(expand=False):
    """Every word Hunspell lists. With expand=True, also its affixed forms (cure/B -> curable)."""
    aff = HUNSPELL.with_suffix(".aff")
    rules = defaultdict(list)            # flag -> [(kind, strip, add, condition regex)]
    if aff.exists():
        for line in aff.read_text(encoding="utf-8", errors="ignore").splitlines():
            f = line.split()
            if len(f) >= 5 and f[0] in ("SFX", "PFX"):
                kind, flag, strip, add, cond = f[0], f[1], f[2], f[3].split("/")[0], f[4]
                strip = "" if strip == "0" else strip
                add = "" if add == "0" else add
                pat = re.compile((cond + "$") if kind == "SFX" else ("^" + cond))
                rules[flag].append((kind, strip, add, pat))
    words = set()
    with open(HUNSPELL, encoding="utf-8", errors="ignore") as f:
        next(f)
        for line in f:
            w, _, flags = line.strip().partition("/")
            if not re.fullmatch(r"[a-z]+", w):
                continue
            words.add(w)
            for flag in (flags if expand else ""):
                for kind, strip, add, pat in rules.get(flag, ()):
                    if kind == "SFX" and w.endswith(strip) and pat.search(w):
                        x = w[: len(w) - len(strip)] + add
                    elif kind == "PFX" and w.startswith(strip) and pat.search(w):
                        x = add + w[len(strip):]
                    else:
                        continue
                    if re.fullmatch(r"[a-z]+", x):
                        words.add(x)
    return words

def clean_arg(v):
    """'videō<t:to see>' -> ('videō', 'to see')"""
    gloss = None
    m = re.search(r"<t:([^>]*)>", v)
    if m:
        gloss = m.group(1)
    return re.sub(r"<[^>]*>", "", v).strip(), gloss

# ---------------------------------------------------------------- extract
def extract(src):
    hun = load_hunspell()
    opener = gzip.open if str(src).endswith(".gz") else open
    DATA.mkdir(exist_ok=True)
    out = open(DATA / "en-etym.jsonl", "w", encoding="utf-8")
    n = kept = 0
    seen = defaultdict(list)
    with opener(src, "rt", encoding="utf-8") as f:
        for line in f:
            n += 1
            if n % 200000 == 0:
                print(f"  {n:,} lines, {kept:,} kept", file=sys.stderr, flush=True)
            if '"etymology_templates"' not in line:
                continue
            try:
                e = json.loads(line)
            except ValueError:
                continue
            w = e.get("word", "")
            if e.get("lang_code", "en") != "en" or w not in hun or len(w) < 3:
                continue
            tpls = [{"name": t.get("name"), "args": t.get("args", {})} for t in e.get("etymology_templates", [])
                    if t.get("name") in AFFIX_TEMPLATES or t.get("name") in ETYMON_TEMPLATES]
            if not tpls:
                continue
            key = json.dumps(tpls, sort_keys=True)
            if key in seen[w]:
                continue
            seen[w].append(key)
            out.write(json.dumps({"word": w, "pos": e.get("pos"), "templates": tpls}, ensure_ascii=False) + "\n")
            kept += 1
    out.close()
    print(f"done: {n:,} lines read, {kept:,} entries kept -> {DATA / 'en-etym.jsonl'}")

# ---------------------------------------------------------------- build
class Dictionary:
    def __init__(self, cur):
        self.parts = cur["parts"]
        self.words = {w: [tuple(s) for s in segs] for w, segs in cur["words"].items()}
        self.hand = set(self.words)
        self.ambiguous = set()
        # surface spellings of every part
        self.variants = defaultdict(set)
        for pid, p in self.parts.items():
            for v in re.split(r"[ /]+", p["label"]):
                v = v.strip("-()").lower()
                if v.isalpha():
                    self.variants[pid].add(v)
        for segs in self.words.values():
            for text, pid in segs:
                if pid:
                    self.variants[pid].add(text)
        for pid, vs in ASSIMILATE.items():
            if pid in self.parts:
                self.variants[pid].update(vs.split())
        # affix spellings -> part ids (labels + assimilation only, not odd hand splits like entire = en=inN)
        self.prefix = defaultdict(set)
        self.suffix = defaultdict(set)
        for pid, p in self.parts.items():
            if p["kind"] not in "ps":
                continue
            vs = {v.strip("-()").lower() for v in re.split(r"[ /]+", p["label"])} | set(ASSIMILATE.get(pid, "").split())
            for v in vs:
                if v.isalpha():
                    (self.prefix if p["kind"] == "p" else self.suffix)[v].add(pid)
        # which classical language each root comes from ("la", "grc", or both)
        self.fam = {}
        for pid, p in self.parts.items():
            o = p.get("origin") or ""
            self.fam[pid] = ({"la"} if "Latin" in o else set()) | ({"grc"} if "Greek" in o else set())
        # root spellings -> root ids (for combining forms and lemma stems)
        self.rootvar = defaultdict(set)
        for pid, p in self.parts.items():
            if p["kind"] == "r":
                for v in self.variants[pid]:
                    if len(v) >= 3:
                        self.rootvar[v].add(pid)
        # Latin/Greek lemmas -> root ids, from each part's "origin" note
        self.lemma = defaultdict(set)      # exact normalized lemma
        self.stem = defaultdict(set)       # stem
        for pid, p in self.parts.items():
            if p["kind"] != "r":
                continue
            origin = p.get("origin") or ""
            lang = "grc" if "Greek" in origin else "la" if "Latin" in origin else None
            if not lang:
                continue
            for tok in re.findall(r"[A-Za-zāēīōūȳĀĒĪŌŪ]+", origin):
                if tok in ("Latin", "Greek", "and", "from", "the", "past", "of", "Old", "English", "Norse", "French", "Sanskrit"):
                    continue
                t = norm_lemma(tok, "la")
                forms = {t}
                if lang == "la":  # infinitive -> 1st person, the form Wiktionary cites
                    for inf, firsts in (("are", ["o"]), ("ere", ["o", "eo", "io"]), ("ire", ["io"]), ("i", ["or"])):
                        if t.endswith(inf):
                            forms.update(t[: -len(inf)] + f for f in firsts)
                for f in forms:
                    self.lemma[f].add(pid)
                    for s in stems(f, lang):
                        if len(s) >= 4:
                            self.stem[s].add(pid)

    def root_for_lemma(self, lemma, lang):
        raw = re.sub(r"<[^>]*>", "", lemma).strip()
        if not raw or raw.startswith("-") or raw.endswith("-"):
            return None                      # com-, -tor: affixes, not roots
        w = norm_lemma(raw, lang)
        if not w:
            return None
        fam = "grc" if lang in GREEK else "la"
        ok = lambda ids: {i for i in ids if fam in self.fam.get(i, set())}
        ids = ok(self.lemma.get(w, ()))
        if len(ids) == 1:
            return next(iter(ids))
        cands = set()
        for s in stems(w, lang):
            cands |= ok(self.stem.get(s, set()))
        if len(cands) == 1:
            return next(iter(cands))
        if cands:
            return None
        # dictō -> dict: a stem (4+ letters) that is already a known spelling of one root
        for s in sorted(stems(w, lang), key=len, reverse=True):
            if len(s) < 4:
                break
            ids = ok(self.rootvar.get(s, set()))
            if len(ids) == 1:
                return next(iter(ids))
            if ids:
                return None
        return None

    def combining(self, text, side):
        """tele-, geo-, -meter -> a root, if the spelling belongs to exactly one."""
        t = plain(text).strip("-")
        if t in ENGLISH_AFFIXES:
            return None
        if t in COMBINING and COMBINING[t] in self.parts:
            return COMBINING[t]
        cands = []
        if len(t) >= 4 or (len(t) == 3 and side == "p"):   # -tor, -ure: suffixes, not roots
            cands.append(t)
        if t[-1:] in "oi" and len(t) >= 5:                   # pedo- -> ped is too short to trust
            cands.append(t[:-1])
        if t[-1:] == "e" and len(t) >= 4:                    # -cide -> cid
            cands.append(t[:-1])
        for c in cands:
            ids = self.rootvar.get(c, set())
            if len(ids) == 1:
                return next(iter(ids))
        return None

    SUFFIX_ALIAS = {"tor": "or", "sor": "or", "ator": "or", "tion": "ion", "sion": "ion", "ation": "ion",
                    "ition": "ion", "itas": "ity", "tas": "ity", "osus": "ous", "alis": "al", "aris": "al",
                    "ivus": "ive", "ible": "able", "abilis": "able", "ibilis": "able", "entia": "ence",
                    "antia": "ance", "ens": "ent", "ans": "ant", "ura": "ure", "orius": "ory", "izo": "ize",
                    "izein": "ize", "ikos": "ic", "icus": "ic", "ismos": "ism", "istes": "ist", "mentum": "ment"}

    def affix_id(self, text, side, gloss=""):
        t = plain(text).strip("-").replace("ise", "ize")
        if side == "s":
            t = self.SUFFIX_ALIAS.get(t, t)
        ids = (self.prefix if side == "p" else self.suffix).get(t, set())
        if len(ids) == 1:
            return next(iter(ids))
        g = (gloss or "").lower()
        if ids >= {"inN", "inI"}:
            if re.search(r"\bnot\b|negat|un-|without", g):
                return "inN"
            if re.search(r"\binto?\b|within|intensive|upon|toward", g):
                return "inI"
            return "?in"
        return None

def first_root_seen(items, d):
    return any(it[0] == "part" and d.parts[it[1]]["kind"] == "r" for it in items)

# Items: ("part", id, preferred_text) or ("glue", text)
def components(d, tpl, gloss_for):
    """Template -> list of items, or None if any piece can't be understood."""
    name, args = tpl["name"], tpl["args"]
    lang = args.get("1", "en")
    pos = sorted((int(k), v) for k, v in args.items() if k.isdigit() and int(k) >= 2 and v)
    comps = []
    text_raw_ids = {}
    for i, (k, raw) in enumerate(pos):
        if "<id:" in raw or args.get(f"id{k - 1}"):
            text_raw_ids[clean_arg(raw)[0]] = "id:"
        text, gl = clean_arg(raw)
        gl = gl or args.get(f"t{k - 1}") or args.get(f"gloss{k - 1}") or args.get(f"id{k - 1}") or ""
        clang = args.get(f"lang{k - 1}", lang)
        first, last = i == 0, i == len(pos) - 1
        if name in ("prefix", "pre") and first:
            side = "p"
        elif name in ("suffix", "suf") and last:
            side = "s"
        elif name in ("confix", "con") and (first or last):
            side = "p" if first else "s"
        elif text.endswith("-") and not text.startswith("-"):
            side = "p"
        elif text.startswith("-") and not text.endswith("-"):
            side = "s"
        else:
            side = None
        comps.append((text, gl, clang, side))

    items = []
    for text, gl, clang, side in comps:
        t = plain(text).strip("-")
        if not t:
            return None
        if side:
            pid = d.affix_id(text, side, gl)
            if pid == "?in":
                # English in- + a standalone English word is almost always "not"
                base = next((c for c in comps if not c[3]), None)
                pid = "inN" if clang == "en" and base and plain(base[0]) in d.words else "inI"
            if not pid and t in d.words:      # -logic, tele-: a whole known word used as a piece
                for stext, sid in d.words[t]:
                    items.append(("part", sid, stext) if sid else ("glue", stext))
                continue
            if not pid:
                pid = d.combining(text, side)
                if pid:
                    items.append(("part", pid, None)); continue
            if pid:
                items.append(("part", pid, t))
            elif re.fullmatch(r"[a-z]+", t) and side == "s":
                items.append(("glue", t))          # Germanic suffix etc: -ness, -ful
            else:
                return None
        elif clang == "en":
            homograph = t not in d.hand and (t in d.ambiguous or "id:" in text_raw_ids.get(text, ""))
            if t in d.words and not homograph:
                segs = d.words[t]
                for n, (stext, sid) in enumerate(segs):
                    opt = n == len(segs) - 1 and sid and d.parts[sid]["kind"] == "s" and len(stext) <= 2
                    items.append(("part", sid, stext, True) if opt else ("part", sid, stext) if sid else ("glue", stext))
            elif re.fullmatch(r"[a-z]+", t):
                items.append(("glue", t))
            else:
                return None
        elif clang in LATIN or clang in GREEK:
            pid = d.root_for_lemma(text, clang)
            if not pid and not first_root_seen(items, d):
                pid = d.affix_id(text, "p", gl)
                if pid == "?in":
                    pid = "inN" if re.search(r"\bnot\b", gl or "") and not re.search(r"\bin\b", gl or "") else "inI"
                if pid:
                    items.append(("part", pid, t)); continue
            if not pid:
                nl = norm_lemma(text, clang)
                if len(nl) >= 3 and nl not in d.prefix:
                    gloss_for.setdefault((clang, nl), Counter())[gl] += 1
                return None
            items.append(("part", pid, None))
        else:
            return None
    return items

def align(d, word, items):
    """Find the item spellings in `word`, in order. Returns [(text, id|None)] or None."""
    best = {}

    def opts(item):
        if item[0] == "glue":
            t = item[1]
            return [(t, None)] + [(t[:-k], None) for k in (1, 2) if len(t) - k >= 2]
        pid, pref = item[1], item[2]
        vs = sorted(d.variants[pid] | ({pref} if pref else set()), key=len, reverse=True)
        out = []
        for v in vs:
            out.append((v, pid))
            if len(v) >= 4 and v[-1] in "ey":   # project+ion, vary+ation
                out.append((v[:-1], pid))
        return out

    def go(k, i):
        if (k, i) in best:
            return best[(k, i)]
        if k == len(items):
            rest = len(word) - i
            res = (rest * 2, [(word[i:], None)] if rest else []) if rest <= 4 else None
            best[(k, i)] = res
            return res
        res = None
        if len(items[k]) == 4 and k + 1 < len(items):   # optional piece: try leaving it out
            sub = go(k + 1, i)
            if sub is not None:
                res = (sub[0] + 1, sub[1])
        maxgap = 1 if k == 0 else 3
        for gap in range(0, maxgap + 1):
            j = i + gap
            if j > len(word):
                break
            for text, pid in opts(items[k]):
                if not text or not word.startswith(text, j):
                    continue
                if pid and len(text) < 2 and not (k == 0 and j == 0):
                    continue
                sub = go(k + 1, j + len(text))
                if sub is None:
                    continue
                cost = sub[0] + gap * 2 + (0 if pid else 1)
                segs = ([(word[i:j], None)] if gap else []) + [(text, pid)] + sub[1]
                if res is None or cost < res[0]:
                    res = (cost, segs)
        best[(k, i)] = res
        return res

    r = go(0, 0)
    if not r:
        return None
    segs = []
    for text, pid in r[1]:
        if not text:
            continue
        if pid is None and segs and segs[-1][1] is None:
            segs[-1] = (segs[-1][0] + text, None)
        else:
            segs.append((text, pid))
    return segs if "".join(t for t, _ in segs) == word else None

def tail_suffixes(d, word, segs):
    """Turn trailing glue into known suffixes when it spells them exactly (vision -> vis.ion)."""
    if not segs or segs[-1][1] is not None:
        return segs
    glue = segs[-1][0]
    for cut in (0,):
        t = glue[cut:]
        ids = d.suffix.get(t)
        if ids and len(ids) == 1:
            pre = glue[:cut]
            return segs[:-1] + ([(pre, None)] if pre else []) + [(t, next(iter(ids)))]
    return segs

def spec(segs):
    out = []
    for text, pid in segs:
        out.append("_" + text if pid is None else text if text == pid else f"{text}={pid}")
    return ".".join(out)

def good(d, segs):
    ids = [p for _, p in segs if p]
    return any(d.parts[p]["kind"] == "r" for p in ids)

GROW_CYCLES = 3
GROW_MIN = 3          # a lemma must block this many entries to become a new root

def grow_parts(d, gloss_for, new_parts):
    """Turn the Latin/Greek lemmas that block the most words into new roots."""
    by_stem = {}
    for (lang, lemma), gl in sorted(gloss_for.items(), key=lambda kv: -sum(kv[1].values())):
        n = sum(gl.values())
        if n < GROW_MIN or not re.fullmatch(r"[a-z]{3,}", lemma):
            continue
        meaning = next((g for g, _ in gl.most_common() if g and len(g) < 60), "")
        meaning = ", ".join(re.split(r"[;(]", meaning)[0].strip(" ,.").split(", ")[:2])
        if not meaning:
            continue
        sts = sorted((s for s in stems(lemma, lang) if len(s) >= 3), key=len)
        main = sts[0] if sts else lemma
        if main in d.rootvar or main in d.prefix or main in d.suffix:
            continue          # spelling already belongs to something else: leave for a human
        fam = "grc" if lang in GREEK else "la"
        lang_name = "Greek" if fam == "grc" else "Latin"
        shown = translit_back(lemma) if fam == "grc" else lemma
        if main in by_stem:   # draco + dracon, Latin + Greek canna: one root
            pid = by_stem[main]
            if lang_name not in new_parts[pid][3]:
                new_parts[pid][3] += f", {lang_name} {shown}"
            d.fam[pid].add(fam)
            continue
        pid = "w" + main
        if pid in d.parts:
            continue
        by_stem[main] = pid
        new_parts[pid] = ["r", main, meaning, f"{lang_name} {shown}"]
        d.parts[pid] = {"kind": "r", "label": main, "meaning": meaning, "origin": f"{lang_name} {shown}", "rel": []}
        d.fam[pid] = {fam}
        for s in set(sts) | {lemma}:
            d.variants[pid].add(s)
            if len(s) >= 3:
                d.rootvar[s].add(pid)
            d.stem[s].add(pid)
        d.lemma[lemma].add(pid)
    return len(by_stem)

def translit_back(w):
    return w

DERIVE_SUFFIX = {"ion": "ion", "ation": "ion", "ist": "ist", "ism": "ism", "ize": "ize", "ity": "ity",
                 "ive": "ive", "ous": "ous", "ment": "ment", "able": "able", "ible": "able", "ence": "ence",
                 "ance": "ence", "ent": "ent", "ant": "ent", "ure": "ure", "ory": "ory", "ic": "ic", "al": "al",
                 "ical": None, "ian": "ian", "ate": "ate", "er": "er", "or": "er"}
# Ending swaps: (last piece id, its text) -> possible replacement endings.
SWAPS = {
    ("y", "y"):       [[("ist", "ist")], [("ic", "ic")], [("ic", "ic"), ("al", "al")], [("ism", "ism")]],
    ("ent", "ent"):   [[("ence", "ence")], [("ency", "ence")]],
    ("ent", "ant"):   [[("ance", "ence")], [("ancy", "ence")]],
    ("ence", "ence"): [[("ent", "ent")]],
    ("ence", "ance"): [[("ant", "ent")]],
    ("ist", "ist"):   [[("ism", "ism")]],
    ("ism", "ism"):   [[("ist", "ist")]],
    ("ic", "ic"):     [[("ism", "ism")], [("ist", "ist")]],
}
DERIVE_PREFIX = ["re", "un", "dis", "pre", "de", "inter", "super", "sub", "trans", "anti", "co", "semi",
                 "hyper", "hypo", "counter", "multi", "over", "mis", "non", "pro", "post", "ex"]

def mentions(e_list, *pieces):
    """Does any Wiktionary etymology for this word mention one of these pieces?"""
    want = {plain(p).strip("-") for p in pieces if p}
    for e in e_list:
        for t in e["templates"]:
            for k, v in t["args"].items():
                if k.isdigit() and plain(clean_arg(v)[0]).strip("-") in want:
                    return True
    return False

def derive(d, added, skip, entries):
    """projector = project + -or, rediscover = re- + discover. Kept only if Hunspell knows the result."""
    stems_only = load_hunspell()
    hun = load_hunspell(expand=True)   # -er/-or use stems_only: expanded forms add comparatives (crass -> crasser)
    prefix_id = {p: (d.affix_id(p, "p") if p not in ("over", "mis", "non", "counter", "multi") else None) for p in DERIVE_PREFIX}
    if "multi" in d.parts:
        prefix_id["multi"] = "multi"
    total = 0
    for rnd in range(3):
        new = {}
        for base, segs in list(d.words.items()):
            if not any(pid and d.parts[pid]["kind"] == "r" and d.fam.get(pid) for _, pid in segs):
                continue      # needs a Latin or Greek root: Latin suffixes on wise, light... go wrong
            # suffixes
            for suf, sid in DERIVE_SUFFIX.items():
                if len(suf) <= 2 and len(base) < 5 or len(base) < 4:
                    continue          # corn + -er = corner, pet + -al = petal: too risky
                if base.endswith(suf):
                    continue
                forms = []
                if base[-1] == "e" and suf[0] in "aeiou":
                    forms.append((base[:-1], "drop"))
                elif base[-1] == "y" and suf[0] != "i":
                    forms.append((base[:-1] + "i", "y"))
                else:
                    forms.append((base, "same"))
                if base.endswith("fy") and suf == "ation":
                    forms = [(base[:-1] + "ic", "fication")]
                for stem, how in forms:
                    w = stem + suf
                    if w in d.words or w in new or w in skip or w not in (stems_only if suf in ("er", "or") else hun):
                        continue
                    last_text, last_id = segs[-1]
                    if how == "drop":
                        last_text = last_text[:-1]
                    elif how == "y":
                        last_text = last_text[:-1] + "i"
                    elif how == "fication":          # magnify -> magnific.ation
                        last_text = last_text[:-1] + "ic"
                    body = list(segs[:-1]) + ([(last_text, last_id)] if last_text else [])
                    if suf == "ical":
                        tail = [("ic", "ic"), ("al", "al")]
                    else:
                        tail = [(suf, sid)]
                    out = body + tail
                    if w in entries and not mentions(entries[w], base, suf, "-" + suf):
                        continue      # wisent is not wise + -ent
                    if "".join(t for t, _ in out) == w and all(t for t, _ in out):
                        new[w] = (out, f"derive:{base}+-{suf}")
            # ending swaps: neurology -> neurologist, telepathy -> telepathic, benevolent -> benevolence
            last_text, last_id = segs[-1]
            for (from_id, from_text), outs in SWAPS.items():
                if last_id != from_id or last_text != from_text or len(base) < 6:
                    continue
                for tail in outs:
                    w = base[: len(base) - len(from_text)] + "".join(t for t, _ in tail)
                    if w in d.words or w in new or w in skip or w not in hun:
                        continue
                    if w in entries and not mentions(entries[w], base, *(t for t, _ in tail), *("-" + t for t, _ in tail),
                                                     base[: len(base) - len(from_text)]):
                        # Wiktionary often says neuro- + -logist rather than neurology + -ist: accept that too
                        if not any(mentions(entries[w], pre_t) for pre_t, pid in segs[:-1] if pid):
                            continue
                    new[w] = (list(segs[:-1]) + list(tail), f"swap:{base}:{from_text}->{''.join(t for t, _ in tail)}")
            # prefixes
            for pre in DERIVE_PREFIX:
                w = pre + base
                if w in d.words or w in new or w in skip or w not in hun or len(base) < 4:
                    continue
                if w not in entries or not mentions(entries[w], base, pre, pre + "-"):
                    continue          # semination is not semi- + nation: Wiktionary must agree
                pid = prefix_id.get(pre)
                new[w] = ([(pre, pid) if pid else (pre, None)] + list(segs), f"derive:{pre}-+{base}")
        for w, v in new.items():
            added[w] = v
            d.words[w] = v[0]
        total += len(new)
        if not new:
            break
    return total

def build():
    cur = json.load(open(DATA / "current.json"))
    d = Dictionary(cur)
    skip = set()
    sk = HERE / "wiki-skip.txt"
    if sk.exists():
        skip = {l.split("#")[0].strip() for l in sk.read_text().splitlines()} - {""}
    entries = defaultdict(list)
    all_entries = defaultdict(list)
    for line in open(DATA / "en-etym.jsonl", encoding="utf-8"):
        e = json.loads(line)
        all_entries[e["word"]].append(e)
        if e["word"] not in d.hand and e["word"] not in skip:
            entries[e["word"]].append(e)

    def etyma(e):
        return frozenset((t["args"].get("2"), norm_lemma(t["args"].get("3", ""), t["args"].get("2"))) for t in e["templates"]
                         if t["name"] in ETYMON_TEMPLATES and t["name"] not in ("m", "l") and t["args"].get("2") in LATIN | GREEK)
    d.ambiguous = {w for w, es in entries.items() if len({etyma(e) for e in es}) > 1}
    added = {}            # word -> (segs, source)
    gloss_for = {}
    why = Counter()
    new_parts = {}        # id -> [kind, label, meaning, origin]
    for cycle in range(GROW_CYCLES + 1):
        gloss_for.clear()
        for rnd in range(4):  # later rounds can use words found earlier
            new = 0
            gf = gloss_for if rnd == 0 else {}
            for w, es in entries.items():
                if w in added:
                    continue
                found = None
                for e in es:
                    tpls = e["templates"]
                    order = [t for t in tpls if t["name"] in AFFIX_TEMPLATES and t["args"].get("1") == "en"] + \
                            [t for t in tpls if t["name"] in AFFIX_TEMPLATES and t["args"].get("1") in LATIN | GREEK]
                    for t in order:
                        items = components(d, t, gf)
                        if not items:
                            continue
                        segs = align(d, w, items)
                        if segs and good(d, segs):
                            found = (tail_suffixes(d, w, segs), t["name"] + ":" + "+".join(v for k, v in sorted(t["args"].items()) if k.isdigit() and k != "1"))
                            break
                    if found:
                        break
                    # every Latin/Greek source the word lists, in order: der la ad + der la veniō -> ad + ven
                    seq, seen_ids = [], set()
                    for t in tpls:
                        if t["name"] not in ETYMON_TEMPLATES or t["name"] in ("m", "l"):
                            continue
                        a = t["args"]
                        lang, lemma = a.get("2"), a.get("3", "")
                        if lang not in LATIN | GREEK or not lemma:
                            continue
                        pid = d.root_for_lemma(lemma, lang)
                        if not pid and not first_root_seen(seq, d) and len(norm_lemma(lemma, lang)) <= 6:
                            pid = d.affix_id(lemma, "p", a.get("5") or a.get("t") or "")
                            pid = None if pid == "?in" else pid
                        if pid and pid not in seen_ids:
                            seen_ids.add(pid)
                            seq.append(("part", pid, None))
                    if len(seq) >= 2:
                        segs = align(d, w, seq)
                        if segs and good(d, segs):
                            found = (tail_suffixes(d, w, segs), "etyma:" + "+".join(x[1] for x in seq))
                            break
                    # single borrowed etymon: der/bor/inh from Latin or Greek
                    for t in tpls:
                        if t["name"] in ETYMON_TEMPLATES and t["name"] not in ("m", "l"):
                            a = t["args"]
                            lang, lemma = a.get("2"), a.get("3", "")
                            if lang in LATIN | GREEK and lemma:
                                pid = d.root_for_lemma(lemma, lang)
                                if not pid:
                                    nl = norm_lemma(lemma, lang)
                                    if len(nl) >= 3 and not lemma.strip().endswith("-") and nl not in d.prefix:
                                        gf.setdefault((lang, nl), Counter())[a.get("t") or a.get("5") or ""] += 1
                                    continue
                                segs = align(d, w, [("part", pid, None)])
                                if not segs:
                                    # root can sit mid-word (provide <- providere): allow a leading prefix
                                    for v in sorted(d.variants[pid], key=len, reverse=True):
                                        i = w.find(v)
                                        if i > 0 and len(v) >= 3:
                                            segs = [(w[:i], None), (v, pid)] + ([(w[i + len(v):], None)] if w[i + len(v):] else [])
                                            if w[:i] in d.prefix and len(d.prefix[w[:i]]) == 1:
                                                segs[0] = (w[:i], next(iter(d.prefix[w[:i]])))
                                            break
                                if segs and good(d, segs):
                                    found = (tail_suffixes(d, w, segs), f"{t['name']}:{lang}:{lemma}")
                                    break
                    if found:
                        break
                if found:
                    added[w] = found
                    d.words[w] = found[0]
                    for text, pid in found[0]:
                        if pid:
                            d.variants[pid].add(text)
                    new += 1
            print(f"round {rnd + 1}: +{new}")
            if not new:
                break

        if cycle == GROW_CYCLES:
            break
        made = grow_parts(d, gloss_for, new_parts)
        print(f"cycle {cycle + 1}: {made} new roots from Wiktionary")
        if not made:
            break
    for w in entries:
        if w not in added:
            why["unresolved"] += 1

    # ---- derivation: known word + one prefix or suffix, if the result is a real word
    derived = derive(d, added, skip, all_entries)
    print(f"derived: +{derived}")

    # ---- a new root in only one word links nothing: turn it back into plain letters
    cnt = Counter(pid for segs, _ in added.values() for _, pid in segs if pid in new_parts)
    lonely = {pid for pid in new_parts if cnt[pid] < 2}
    for w in list(added):
        segs, src = added[w]
        if any(pid in lonely for _, pid in segs):
            merged = []
            for text, pid in segs:
                pid = None if pid in lonely else pid
                if pid is None and merged and merged[-1][1] is None:
                    merged[-1] = (merged[-1][0] + text, None)
                else:
                    merged.append((text, pid))
            if good(d, merged):
                added[w] = (merged, src)
            else:
                del added[w]
    for pid in lonely:
        new_parts.pop(pid, None)

    # ---- write words_wiki.js
    lines = []
    row = []
    for w in sorted(added):
        row.append(spec(added[w][0]))
        if len(" ".join(row)) > 100:
            lines.append(" ".join(row)); row = []
    if row:
        lines.append(" ".join(row))
    used = {pid for segs, _ in added.values() for _, pid in segs if pid}
    parts_js = ",\n".join(f"  {pid}: {json.dumps(v, ensure_ascii=False)}" for pid, v in sorted(new_parts.items()) if pid in used)
    js = ("// GENERATED by tools/wiktionary.py from Wiktionary (CC BY-SA 4.0, via kaikki.org).\n"
          "// Don't edit: fix words in words.js (hand entries win) or tools/wiki-skip.txt, then rebuild.\n"
          f"// {len(added)} words, {sum(1 for p in new_parts if p in used)} roots.\n"
          "Object.assign(window.ROOTED_PARTS, {\n" + parts_js + "\n});\n"
          "window.ROOTED_WORDS_WIKI = `\n" + "\n".join(lines) + "\n`;\n")
    (ROOT / "words_wiki.js").write_text(js)

    # ---- report
    rep = [f"Added {len(added)} words ({len(entries) - len(added)} Wiktionary words with etymologies not resolved).", ""]
    rep.append("== Roots created from Wiktionary (id: label, meaning, origin, words) ==")
    cnt = Counter(pid for segs, _ in added.values() for _, pid in segs if pid in new_parts)
    for pid, v in sorted(new_parts.items(), key=lambda kv: -cnt[kv[0]]):
        if cnt[pid]:
            rep.append(f"{cnt[pid]:5d}  {pid:14s} {v[1]:10s} {v[2][:40]:40s} {v[3]}")
    rep += ["", "== Latin/Greek lemmas that still block words (candidates for new parts) =="]
    blocked = sorted(gloss_for.items(), key=lambda kv: -sum(kv[1].values()))
    for (lang, lemma), gl in blocked[:150]:
        g = ", ".join(x for x, _ in gl.most_common(3) if x)
        rep.append(f"{sum(gl.values()):5d}  {lang:4s} {lemma:18s} {g}")
    rep += ["", "== Added words (spec  <-  source template) =="]
    for w in sorted(added):
        rep.append(f"{spec(added[w][0]):45s} <- {added[w][1]}")
    (DATA / "report.txt").write_text("\n".join(rep))
    print(f"wrote words_wiki.js ({len(added)} words) and {DATA / 'report.txt'}")

if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "extract":
        extract(sys.argv[2])
    elif len(sys.argv) >= 2 and sys.argv[1] == "build":
        build()
    else:
        print(__doc__)
