#!/usr/bin/env python3
"""Local server for the daily-games repo, with a Rooted miss log.

    python3 rooted/tools/serve.py          (from the daily-games folder, or anywhere)
    -> http://localhost:8000/rooted/?endless=1

Works like `python3 -m http.server 8000`, plus:
  POST /__rooted/miss     appends one rejected guess to rooted/tools/data/misses.jsonl
  GET  /__rooted/misses   returns every saved guess (misses.html shows them)
It also tells the browser not to cache, so edits show up on a normal refresh.
"""
import json, sys
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
LOG = REPO / "rooted" / "tools" / "data" / "misses.jsonl"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(REPO), **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        if self.path != "/__rooted/miss":
            return self.send_error(404)
        try:
            n = int(self.headers.get("Content-Length", 0))
            entry = json.loads(self.rfile.read(min(n, 10000)))
            if not isinstance(entry, dict):
                raise ValueError
        except ValueError:
            return self.send_error(400)
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path.split("?")[0] == "/__rooted/misses":
            rows = []
            if LOG.exists():
                for line in LOG.read_text(encoding="utf-8").splitlines():
                    try:
                        rows.append(json.loads(line))
                    except ValueError:
                        pass
            body = json.dumps(rows).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def log_message(self, fmt, *args):
        if "/__rooted/" not in (args[0] if args else ""):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    print(f"Serving {REPO} at http://localhost:{PORT}/")
    print(f"Rooted testing: http://localhost:{PORT}/rooted/?endless=1")
    print(f"Rejected guesses are saved to {LOG}")
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()
