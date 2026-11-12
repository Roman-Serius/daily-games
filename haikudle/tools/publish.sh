#!/bin/bash
# Rebuild Haikudle's words + draws and load them straight into Supabase.
#
#   ./publish.sh            rebuild from words.csv + schedule.csv, then upload
#   ./publish.sh --schema   also re-apply ../supabase/schema.sql first (after rule changes)
#   ./publish.sh --to 730   anything else is passed to build.py (here: build two years ahead)
#
# One-time setup (see README): put your Supabase connection string in
# tools/.supabase-db-url, and install psql (brew install libpq).
# Only future days ever change; today and past days are never touched.
set -euo pipefail
cd "$(dirname "$0")"

SCHEMA=0
if [ "${1:-}" = "--schema" ]; then SCHEMA=1; shift; fi

URL_FILE=".supabase-db-url"
if [ ! -s "$URL_FILE" ]; then
  echo "Missing $URL_FILE: paste your Supabase Session pooler connection string into it (see README)." >&2
  exit 1
fi
PSQL="$(command -v psql || true)"
for p in /opt/homebrew/opt/libpq/bin/psql /usr/local/opt/libpq/bin/psql /Applications/Postgres.app/Contents/Versions/latest/bin/psql; do
  [ -z "$PSQL" ] && [ -x "$p" ] && PSQL="$p"
done
if [ -z "$PSQL" ]; then
  echo "psql isn't installed. Run: brew install libpq   (or install Postgres.app)" >&2
  exit 1
fi
DB_URL="$(tr -d '[:space:]' < "$URL_FILE")"

echo "== Building words and draws"
python3 build.py "$@"

if [ "$SCHEMA" = 1 ]; then
  echo "== Applying schema.sql"
  "$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 -q -f ../supabase/schema.sql
fi

echo "== Uploading to Supabase"
"$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 -q -f out/load.sql

echo "== Check"
"$PSQL" "$DB_URL" -At -c "select 'Live: day ' || haikudle.current_day() || ', ' || (select count(*) from haikudle.draws where day > haikudle.current_day()) || ' future days ready, last one ' || to_char(date '2026-11-12' + (select max(day) from haikudle.draws) - 1, 'Mon DD, YYYY')"
echo "Done."
