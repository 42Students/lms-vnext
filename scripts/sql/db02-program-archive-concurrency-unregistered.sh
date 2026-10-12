#!/usr/bin/env bash
# DB-005 W04: program ARCHIVE versus cohort INSERT, both commit orders.
# UNREGISTERED and NOT EXECUTED. Creates uniquely tagged rows; disposable
# PostgreSQL ONLY after Chat1 registers DB02 and replays numbered migrations.
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
: "${DB02_EXPECTED_DATABASE:?exact disposable database name required}"
if [[ "${DB02_DISPOSABLE_ACCEPTANCE:-}" != "YES" ]]; then
  echo "Refusing program-archive races without DB02_DISPOSABLE_ACCEPTANCE=YES" >&2
  exit 2
fi
if ! command -v psql >/dev/null 2>&1; then echo "psql required" >&2; exit 2; fi
ACTUAL_DATABASE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -c 'SELECT current_database()')"
if [[ "$ACTUAL_DATABASE" != "$DB02_EXPECTED_DATABASE" ]]; then
  echo "Refusing program-archive races: disposable database name mismatch" >&2
  exit 2
fi
new_uuid() {
  if [[ -r /proc/sys/kernel/random/uuid ]]; then cat /proc/sys/kernel/random/uuid
  elif command -v uuidgen >/dev/null; then uuidgen
  else python3 -c 'import uuid; print(uuid.uuid4())'; fi
}
TAG="db02-program-race-$(date +%s)-$$"
ORG=$(new_uuid); COLLEGE=$(new_uuid); DEPT=$(new_uuid)
PROGRAM_A=$(new_uuid); PROGRAM_B=$(new_uuid); PERIOD=$(new_uuid)
COHORT_A=$(new_uuid); COHORT_B=$(new_uuid)
LOG_A=$(mktemp); LOG_B=$(mktemp)
trap 'rm -f "$LOG_A" "$LOG_B"' EXIT

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v tag="$TAG" -v org="$ORG" -v college="$COLLEGE" -v dept="$DEPT" \
  -v pa="$PROGRAM_A" -v pb="$PROGRAM_B" -v period="$PERIOD" <<'SQL'
INSERT INTO organizations(id,name) VALUES(:'org',:'tag' || ' org');
INSERT INTO colleges(id,organization_id,name,code)
  VALUES(:'college',:'org',:'tag' || ' college',:'tag' || '-college');
INSERT INTO departments(id,college_id,name)
  VALUES(:'dept',:'college',:'tag' || ' department');
INSERT INTO programs(id,department_id,name,code,duration_terms,status)
  VALUES
    (:'pa',:'dept',:'tag' || ' program A',:'tag' || '-program-a',4,'ACTIVE'),
    (:'pb',:'dept',:'tag' || ' program B',:'tag' || '-program-b',4,'ACTIVE');
INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status)
  VALUES(:'period',:'college',:'tag' || ' period',:'tag' || '-period',
         '2026-07-01','2027-06-30','ACTIVE');
SQL

# Archive writer takes program row lock first; cohort INSERT must wait,
# re-read ARCHIVED and reject. The archive succeeds with zero cohorts.
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v pa="$PROGRAM_A" <<'SQL'
BEGIN;
UPDATE programs SET status='ARCHIVED' WHERE id=:'pa';
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v tag="$TAG" \
  -v ca="$COHORT_A" -v pa="$PROGRAM_A" -v period="$PERIOD" <<'SQL' >"$LOG_B" 2>&1
INSERT INTO cohorts(id,program_id,name,code,start_period_id,status)
VALUES(:'ca',:'pa',:'tag' || ' cohort A',:'tag' || '-cohort-a',:'period','PLANNED');
SQL
RC=$?
set -e
wait "$PID_A"
if [[ "$RC" -eq 0 ]] || ! grep -q 'Cannot activate or create a cohort under archived program' "$LOG_B"; then
  echo "FAIL archive-first cohort rejection" >&2; cat "$LOG_A" "$LOG_B" >&2; exit 1
fi
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v pa="$PROGRAM_A" <<'SQL'
SELECT status || ':' || (SELECT count(*) FROM cohorts c WHERE c.program_id=p.id)
FROM programs p WHERE id=:'pa';
SQL
)"
[[ "$STATE" == "ARCHIVED:0" ]] || { echo "FAIL archive-first state=$STATE" >&2; exit 1; }
echo "PASS archive-first: concurrent cohort insert rejected"

# Cohort writer takes SHARE on program row first and inserts; archive must
# wait, then fail because a PLANNED cohort is a real live dependent.
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v tag="$TAG" \
    -v cb="$COHORT_B" -v pb="$PROGRAM_B" -v period="$PERIOD" <<'SQL'
BEGIN;
INSERT INTO cohorts(id,program_id,name,code,start_period_id,status)
VALUES(:'cb',:'pb',:'tag' || ' cohort B',:'tag' || '-cohort-b',:'period','PLANNED');
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v pb="$PROGRAM_B" <<'SQL' >"$LOG_B" 2>&1
UPDATE programs SET status='ARCHIVED' WHERE id=:'pb';
SQL
RC=$?
set -e
wait "$PID_A"
if [[ "$RC" -eq 0 ]] || ! grep -q 'Cannot archive program with nonarchived cohorts' "$LOG_B"; then
  echo "FAIL cohort-first archive rejection" >&2; cat "$LOG_A" "$LOG_B" >&2; exit 1
fi
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v pb="$PROGRAM_B" <<'SQL'
SELECT status || ':' || (SELECT count(*) FROM cohorts c WHERE c.program_id=p.id)
FROM programs p WHERE id=:'pb';
SQL
)"
[[ "$STATE" == "ACTIVE:1" ]] || { echo "FAIL cohort-first state=$STATE" >&2; exit 1; }
echo "PASS cohort-first: concurrent program archive rejected"
echo "DB02 program archive/cohort two-session witnesses PASS; discard disposable database"
