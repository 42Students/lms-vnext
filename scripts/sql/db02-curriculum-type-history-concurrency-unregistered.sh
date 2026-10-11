#!/usr/bin/env bash
# DB02 / DB-005 curriculum-type vs CORE-offering creation concurrency harness.
# UNREGISTERED / UNEXECUTED, requires an approved DISPOSABLE PostgreSQL database
# with canonical DB02 and db02-academic-progression-and-rooms-staging.sql applied.
# Fixture rows are committed for two-session visibility. Dispose of entire DB.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must point to a disposable PostgreSQL database}"

: "${DB02_EXPECTED_DATABASE:?Set the exact disposable PostgreSQL database name}"
if [[ "${DB02_DISPOSABLE_ACCEPTANCE:-}" != "YES" ]]; then
  echo "Refusing to run: explicitly set DB02_DISPOSABLE_ACCEPTANCE=YES" >&2
  exit 2
fi
command -v psql >/dev/null || { echo "psql required" >&2; exit 2; }

ACTUAL_DATABASE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -c 'SELECT current_database()')"
if [[ "$ACTUAL_DATABASE" != "$DB02_EXPECTED_DATABASE" ]]; then
  echo "Refusing to run: DB name mismatch; expected $DB02_EXPECTED_DATABASE, actual $ACTUAL_DATABASE" >&2
  exit 2
fi

new_uuid() {
  if [[ -r /proc/sys/kernel/random/uuid ]]; then cat /proc/sys/kernel/random/uuid
  elif command -v uuidgen >/dev/null; then uuidgen
  else python3 -c 'import uuid;print(uuid.uuid4())'; fi
}
RUN_TAG="db02-core-history-$(date +%s)-$$"
ORG="$(new_uuid)"
COLLEGE="$(new_uuid)"
DEPT="$(new_uuid)"
PROGRAM="$(new_uuid)"
PERIOD="$(new_uuid)"
COHORT="$(new_uuid)"
TERM="$(new_uuid)"
COURSE_A="$(new_uuid)"
COURSE_B="$(new_uuid)"
MAPPING_A="$(new_uuid)"
MAPPING_B="$(new_uuid)"
A_LOG="$(mktemp)"
B_LOG="$(mktemp)"
trap 'rm -f "$A_LOG" "$B_LOG"' EXIT

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v tag="$RUN_TAG" -v org="$ORG" -v college="$COLLEGE" \
  -v dept="$DEPT" -v program="$PROGRAM" -v period="$PERIOD" \
  -v cohort="$COHORT" -v term="$TERM" -v ca="$COURSE_A" \
  -v cb="$COURSE_B" -v ma="$MAPPING_A" -v mb="$MAPPING_B" <<'SQL'
INSERT INTO organizations(id,name) VALUES(:'org',:'tag' || ' org');
INSERT INTO colleges(id,organization_id,name,code)
VALUES(:'college',:'org',:'tag' || ' college',:'tag' || '-college');
INSERT INTO departments(id,college_id,name)
VALUES(:'dept',:'college',:'tag' || ' dept');
INSERT INTO programs(id,department_id,name,code,duration_terms)
VALUES(:'program',:'dept',:'tag' || ' program',:'tag' || '-program',4);
INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status)
VALUES(:'period',:'college',:'tag' || ' period',:'tag' || '-period',
       current_date-30,current_date+365,'ACTIVE');
INSERT INTO cohorts(id,program_id,name,code,start_period_id,expected_end_period_id,status)
VALUES(:'cohort',:'program',:'tag' || ' cohort',:'tag' || '-cohort',
       :'period',:'period','ACTIVE');
INSERT INTO program_terms(id,program_id,term_number,name,is_active)
VALUES(:'term',:'program',1,'Semester 1',true);
INSERT INTO courses(id,department_id,name,code)
VALUES (:'ca',:'dept',:'tag' || ' course A',:'tag' || '-a'),
       (:'cb',:'dept',:'tag' || ' course B',:'tag' || '-b');
INSERT INTO program_term_courses(id,program_term_id,course_id,type,credits,display_order)
VALUES(:'ma',:'term',:'ca','CORE',0,1),
      (:'mb',:'term',:'cb','CORE',0,2);
SQL

# Race A: curriculum reclassification obtains row lock first. Offering insert
# waits and must reject the updated ELECTIVE mapping (canonical offering guard).
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v mapping="$MAPPING_A" <<'SQL'
BEGIN;
UPDATE program_term_courses SET type='ELECTIVE' WHERE id=:'mapping';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$A_LOG" 2>&1 &
PID_A=$!
sleep 0.5
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v program="$PROGRAM" -v term="$TERM" -v cohort="$COHORT" \
  -v period="$PERIOD" -v course="$COURSE_A" -v mapping="$MAPPING_A" <<'SQL' >"$B_LOG" 2>&1
INSERT INTO course_offerings(
  course_id,cohort_id,academic_period_id,program_term_id,
  program_term_course_id,type,credits,display_order
) VALUES(:'course',:'cohort',:'period',:'term',:'mapping','CORE',0,1);
SQL
INSERT_RC=$?
set -e
wait "$PID_A"

if [[ "$INSERT_RC" -eq 0 ]] || ! grep -Fq \
  'Core course offering curriculum row must match selected term and course' "$B_LOG"; then
  echo "FAIL race A: changed ELECTIVE curriculum accepted CORE offering or wrong error" >&2
  cat "$A_LOG" "$B_LOG" >&2
  exit 1
fi
RACE_A_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v mapping="$MAPPING_A" <<'SQL'
SELECT ptc.type::text || ':' ||
       (SELECT count(*) FROM course_offerings co WHERE co.program_term_course_id=ptc.id)::text
FROM program_term_courses ptc WHERE ptc.id=:'mapping';
SQL
)"
if [[ "$RACE_A_STATE" != "ELECTIVE:0" ]]; then
  echo "FAIL race A: inconsistent persisted type/offering: $RACE_A_STATE" >&2
  exit 1
fi
echo "PASS race A: curriculum reclassification won; CORE offering rejected"

# Race B: valid CORE offering insert holds FOR SHARE on the curriculum row
# until COMMIT. Competing curriculum type update must wait and then fail on
# history check; no write may leave CORE offering backed by ELECTIVE mapping.
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
    -v term="$TERM" -v cohort="$COHORT" -v period="$PERIOD" \
    -v course="$COURSE_B" -v mapping="$MAPPING_B" <<'SQL'
BEGIN;
INSERT INTO course_offerings(
  course_id,cohort_id,academic_period_id,program_term_id,
  program_term_course_id,type,credits,display_order
) VALUES(:'course',:'cohort',:'period',:'term',:'mapping','CORE',0,2);
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$A_LOG" 2>&1 &
PID_A=$!
sleep 0.5
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v mapping="$MAPPING_B" <<'SQL' >"$B_LOG" 2>&1
UPDATE program_term_courses SET type='ELECTIVE' WHERE id=:'mapping';
SQL
CHANGE_RC=$?
set -e
wait "$PID_A"
if [[ "$CHANGE_RC" -eq 0 ]] || ! grep -Fq \
  'Mapped curriculum cannot change type after CORE offering materialization' "$B_LOG"; then
  echo "FAIL race B: historic CORE curriculum reclassified or wrong error" >&2
  cat "$A_LOG" "$B_LOG" >&2
  exit 1
fi
RACE_B_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v mapping="$MAPPING_B" <<'SQL'
SELECT ptc.type::text || ':' ||
       (SELECT count(*) FROM course_offerings co
         WHERE co.program_term_course_id=ptc.id AND co.type='CORE')::text
FROM program_term_courses ptc WHERE ptc.id=:'mapping';
SQL
)"
if [[ "$RACE_B_STATE" != "CORE:1" ]]; then
  echo "FAIL race B: expected historical CORE mapping, got $RACE_B_STATE" >&2
  exit 1
fi
echo "PASS race B: CORE offering won; curriculum type reclassification rejected"
echo "DB02 curriculum type two-session acceptance PASS"
echo "Fixture rows remain in disposable DB with tag: $RUN_TAG"
