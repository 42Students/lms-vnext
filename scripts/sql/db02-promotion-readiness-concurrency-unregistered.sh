#!/usr/bin/env bash
# DB02 / DB-005 two-session promotion readiness test. UNREGISTERED / UNEXECUTED.
# DATABASE_URL must point to a disposable PostgreSQL DB after Chat 1 integrates
# canonical DB02 + db02-promotion-readiness-guard.draft.sql.
# Creates committed fixtures for visibility; dispose entire database afterwards.
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to an approved disposable PostgreSQL connection}"
command -v psql >/dev/null || { echo "psql required" >&2; exit 2; }

new_uuid() {
  if [[ -r /proc/sys/kernel/random/uuid ]]; then cat /proc/sys/kernel/random/uuid
  elif command -v uuidgen >/dev/null; then uuidgen
  else python3 -c 'import uuid;print(uuid.uuid4())'; fi
}
RUN_TAG="db02-prom-race-$(date +%s)-$$"
ORG_ID="$(new_uuid)"
COLLEGE_ID="$(new_uuid)"
DEPT_ID="$(new_uuid)"
PROGRAM_ID="$(new_uuid)"
PERIOD_ID="$(new_uuid)"
COHORT_A="$(new_uuid)"
COHORT_B="$(new_uuid)"
TERM_2="$(new_uuid)"
COURSE_ID="$(new_uuid)"
MAP_ID="$(new_uuid)"
A_LOG="$(mktemp)"
B_LOG="$(mktemp)"
cleanup() { rm -f "$A_LOG" "$B_LOG"; }
trap cleanup EXIT

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v tag="$RUN_TAG" -v org="$ORG_ID" -v college="$COLLEGE_ID" \
  -v dept="$DEPT_ID" -v program="$PROGRAM_ID" -v period="$PERIOD_ID" \
  -v cohort_a="$COHORT_A" -v cohort_b="$COHORT_B" \
  -v term2="$TERM_2" -v course="$COURSE_ID" -v mapping="$MAP_ID" <<'SQL'
INSERT INTO organizations(id,name) VALUES(:'org',:'tag' || ' org');
INSERT INTO colleges(id,organization_id,name,code)
VALUES(:'college',:'org',:'tag' || ' college',:'tag' || '-college');
INSERT INTO departments(id,college_id,name)
VALUES(:'dept',:'college',:'tag' || ' dept');
INSERT INTO programs(id,department_id,name,code,duration_terms)
VALUES(:'program',:'dept',:'tag' || ' program',:'tag' || '-program',4);
INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status)
VALUES(:'period',:'college',:'tag' || ' period',:'tag' || '-period',
       current_date - 30,current_date + 365,'ACTIVE');
INSERT INTO cohorts(id,program_id,name,code,start_period_id,expected_end_period_id,status)
VALUES(:'cohort_a',:'program',:'tag' || ' cohort A',:'tag' || '-a',
       :'period',:'period','ACTIVE');
INSERT INTO cohorts(id,program_id,name,code,start_period_id,expected_end_period_id,status)
VALUES(:'cohort_b',:'program',:'tag' || ' cohort B',:'tag' || '-b',
       :'period',:'period','ACTIVE');
INSERT INTO program_terms(id,program_id,term_number,name,is_active)
VALUES(:'term2',:'program',2,'Semester 2',true);
INSERT INTO courses(id,department_id,name,code)
VALUES(:'course',:'dept',:'tag' || ' mapped course',:'tag' || '-course');
INSERT INTO program_term_courses(id,program_term_id,course_id,type,credits,display_order)
VALUES(:'mapping',:'term2',:'course','CORE',0,1);
SQL

# Race 1: term deactivation commits first. Competing promotion must wait for the
# locked destination term, then reject when it sees the inactive term.
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v term2="$TERM_2" <<'SQL'
BEGIN;
UPDATE program_terms SET is_active=false WHERE id=:'term2';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$A_LOG" 2>&1 &
PID_A=$!
sleep 0.5
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v VERBOSITY=verbose -v cohort="$COHORT_A" <<'SQL' >"$B_LOG" 2>&1
UPDATE cohort_progression_state
   SET current_term_number=2, version=1
 WHERE cohort_id=:'cohort' AND version=0;
SQL
PROMOTE_RC=$?
set -e
wait "$PID_A"
if [[ "$PROMOTE_RC" -eq 0 ]]; then
  echo "FAIL race 1: promotion succeeded into deactivated target term" >&2
  cat "$B_LOG" >&2
  exit 1
fi
if ! grep -Fq "Promotion target program term must be configured and ACTIVE" "$B_LOG"; then
  echo "FAIL: promotion failed for an unexpected reason, not DB02 readiness: Promotion target program term must be configured and ACTIVE" >&2
  cat "$B_LOG" >&2
  exit 1
fi
RACE1_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v cohort="$COHORT_A" <<'SQL'
SELECT current_term_number::text || ':' || version::text
FROM cohort_progression_state WHERE cohort_id=:'cohort';
SQL
)"
if [[ "$RACE1_STATE" != "1:0" ]]; then
  echo "FAIL race 1: rejected promotion altered state: $RACE1_STATE" >&2
  exit 1
fi
echo "PASS race 1: deactivation won and promotion was rejected"

# Race 2: last curriculum mapping DELETE commits first. Competing promotion
# must wait for its row lock, then reject an empty semester curriculum.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v term2="$TERM_2" <<'SQL'
UPDATE program_terms SET is_active=true WHERE id=:'term2';
SQL
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v mapping="$MAP_ID" <<'SQL'
BEGIN;
DELETE FROM program_term_courses WHERE id=:'mapping';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$A_LOG" 2>&1 &
PID_A=$!
sleep 0.5
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v VERBOSITY=verbose -v cohort="$COHORT_B" <<'SQL' >"$B_LOG" 2>&1
UPDATE cohort_progression_state
   SET current_term_number=2, version=1
 WHERE cohort_id=:'cohort' AND version=0;
SQL
PROMOTE_RC=$?
set -e
wait "$PID_A"
if [[ "$PROMOTE_RC" -eq 0 ]]; then
  echo "FAIL race 2: promotion succeeded into concurrently empty curriculum" >&2
  cat "$B_LOG" >&2
  exit 1
fi
if ! grep -Fq "Promotion target term requires at least one mapped course" "$B_LOG"; then
  echo "FAIL: promotion failed for an unexpected reason, not DB02 readiness: Promotion target term requires at least one mapped course" >&2
  cat "$B_LOG" >&2
  exit 1
fi
RACE2_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v cohort="$COHORT_B" -v term2="$TERM_2" <<'SQL'
SELECT (current_term_number::text || ':' || version::text) || ':' ||
       (SELECT count(*) FROM program_term_courses WHERE program_term_id=:'term2')::text
FROM cohort_progression_state WHERE cohort_id=:'cohort';
SQL
)"
if [[ "$RACE2_STATE" != "1:0:0" ]]; then
  echo "FAIL race 2: rejected promotion state/target curriculum mismatch $RACE2_STATE" >&2
  exit 1
fi
echo "PASS race 2: last-course deletion won and promotion was rejected"
echo "DB02 promotion readiness two-session acceptance PASS"
echo "Fixture tag remains in disposable database: $RUN_TAG"
