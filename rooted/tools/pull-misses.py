#!/usr/bin/env python3
"""Copy missed words from the Google Sheet into tools/data/misses.jsonl.

  python3 tools/pull-misses.py <web app URL> <KEY>     first time (saves both)
  python3 tools/pull-misses.py                         after that

URL and KEY are saved in tools/data/sheet.json, which git ignores. Rows already
in misses.jsonl are skipped, so it's safe to run as often as you like.
Standard library only.
"""
import json, ssl, subprocess, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent / "data"
CONF = DATA / "sheet.json"
OUT = DATA / "misses.jsonl"


def main():
    DATA.mkdir(exist_ok=True)
    if len(sys.argv) == 3:
        CONF.write_text(json.dumps({"url": sys.argv[1], "key": sys.argv[2]}))
    if not CONF.exists():
        sys.exit(__doc__)
    conf = json.loads(CONF.read_text())

    url = conf["url"] + "?" + urllib.parse.urlencode({"key": conf["key"]})
    try:
        with urllib.request.urlopen(url, timeout=60) as r:  # Apps Script redirects once; urllib follows it
            res = json.load(r)
    except urllib.error.URLError as e:
        if not isinstance(e.reason, ssl.SSLError):
            raise
        # python.org's Python on macOS ships without trusted certificates; curl uses the system's.
        out = subprocess.run(["curl", "-sSL", "-m", "60", url], capture_output=True, text=True, check=True).stdout
        res = json.loads(out)
    if not res.get("ok"):
        sys.exit(f"Sheet said no ({res.get('error', 'unknown')}). Check the URL and the KEY script property.")

    seen = set()
    if OUT.exists():
        for line in OUT.read_text().splitlines():
            try:
                m = json.loads(line)
                seen.add((m.get("t"), m.get("player", ""), m.get("typed")))
            except ValueError:
                pass

    added = 0
    with OUT.open("a") as f:
        for row in res["rows"]:
            k = (row.get("t"), str(row.get("player", "")), row.get("typed"))
            if k in seen:
                continue
            seen.add(k)
            row["source"] = "sheet"
            f.write(json.dumps(row) + "\n")
            added += 1
    print(f"{len(res['rows'])} rows in the sheet, {added} new -> {OUT}")


if __name__ == "__main__":
    main()
