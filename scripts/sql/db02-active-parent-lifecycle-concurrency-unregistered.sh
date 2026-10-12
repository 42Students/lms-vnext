#!/usr/bin/env bash
# DB02 active-parent lifecycle two-session acceptance — UNREGISTERED / UNEXECUTED.
# Commits uniquely tagged fixtures; run ONLY on a disposable PostgreSQL database
# after Chat 1 registers DB02 and clean zero-to-current migration replay succeeds.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL required}"
: "${DB02_EXPECTED_DATABASE:?Exact disposable PostgreSQL database name required}"
if [[ "${DB02_DISPOSABLE_ACCEPTANCE:-}" != "YES" ]]; then
  echo "Refusing to run: explicitly set DB02_DISPOSABLE_ACCEPTANCE=YES" >&2
  exit 2
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "psql required" >&2
  exit 2
fi

source scripts/sql/db02-assert-disposable-target.sh

ACTUAL_DATABASE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -c 'SELECT current_database()')"
if [[ "$ACTUAL_DATABASE" != "$DB02_EXPECTED_DATABASE" ]]; then
  echo "Refusing to run: DB name mismatch; expected $DB02_EXPECTED_DATABASE, actual $ACTUAL_DATABASE" >&2
  exit 2
fi

new_uuid() {
  if [[ -r /proc/sys/kernel/random/uuid ]]; then
    cat /proc/sys/kernel/random/uuid
  elif command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  else
    python3 -c 'import uuid; print(uuid.uuid4())'
  fi
}

RUN_TAG="db02-parent-race-$(date +%s)-$$"
ORG="$(new_uuid)"; COLLEGE="$(new_uuid)"; DEPT="$(new_uuid)"
PROGRAM="$(new_uuid)"; PERIOD="$(new_uuid)"; TERM="$(new_uuid)"; COHORT="$(new_uuid)"
SECTION="$(new_uuid)"; SECTION_ARCHIVE_A="$(new_uuid)"; SECTION_ARCHIVE_B="$(new_uuid)"
COURSE_A="$(new_uuid)"; COURSE_B="$(new_uuid)"; COURSE_C="$(new_uuid)"; COURSE_D="$(new_uuid)"
OFFER_A="$(new_uuid)"; OFFER_B="$(new_uuid)"; OFFER_C="$(new_uuid)"; OFFER_D="$(new_uuid)"
DELIVERY_C="$(new_uuid)"; DELIVERY_D="$(new_uuid)"
FAC_USER="$(new_uuid)"; FAC_MEMBER="$(new_uuid)"
LEARNER1_USER="$(new_uuid)"; LEARNER1_MEMBER="$(new_uuid)"; LPE1="$(new_uuid)"
LEARNER2_USER="$(new_uuid)"; LEARNER2_MEMBER="$(new_uuid)"; LPE2="$(new_uuid)"
LOG_A="$(mktemp)"; LOG_B="$(mktemp)"
trap 'rm -f "$LOG_A" "$LOG_B"' EXIT

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1   -v tag="$RUN_TAG" -v org="$ORG" -v college="$COLLEGE" -v dept="$DEPT"   -v program="$PROGRAM" -v period="$PERIOD" -v term="$TERM" -v cohort="$COHORT"   -v section="$SECTION" -v section_a="$SECTION_ARCHIVE_A" -v section_b="$SECTION_ARCHIVE_B"   -v course_a="$COURSE_A" -v course_b="$COURSE_B" -v course_c="$COURSE_C" -v course_d="$COURSE_D"   -v offer_a="$OFFER_A" -v offer_b="$OFFER_B" -v offer_c="$OFFER_C" -v offer_d="$OFFER_D"   -v delivery_c="$DELIVERY_C" -v delivery_d="$DELIVERY_D"   -v fac_user="$FAC_USER" -v fac_member="$FAC_MEMBER"   -v learner1_user="$LEARNER1_USER" -v learner1_member="$LEARNER1_MEMBER" -v lpe1="$LPE1"   -v learner2_user="$LEARNER2_USER" -v learner2_member="$LEARNER2_MEMBER" -v lpe2="$LPE2" <<'SQL'
INSERT INTO organizations(id,name) VALUES(:'org', :'tag' || ' org');
INSERT INTO colleges(id,organization_id,name,code)
VALUES(:'college',:'org',:'tag' || ' college',:'tag' || '-college');
INSERT INTO departments(id,college_id,name)
VALUES(:'dept',:'college',:'tag' || ' dept');
INSERT INTO programs(id,department_id,name,code,duration_terms,status)
VALUES(:'program',:'dept',:'tag' || ' program',:'tag' || '-program',4,'ACTIVE');
INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status)
VALUES(
  :'period',:'college',:'tag' || ' period',:'tag' || '-period',
  current_date - 30,current_date + 365,'ACTIVE'
);
INSERT INTO program_terms(id,program_id,term_number,name,is_active)
VALUES(:'term',:'program',1,:'tag' || ' term 1',true);
INSERT INTO cohorts(
  id,program_id,name,code,start_period_id,expected_end_period_id,status
)
VALUES(
  :'cohort',:'program',:'tag' || ' cohort',:'tag' || '-cohort',
  :'period',:'period','ACTIVE'
);
INSERT INTO sections(id,cohort_id,academic_period_id,name,code,capacity,minimum_capacity,status)
VALUES
  (:'section',:'cohort',:'period',:'tag' || ' section',:'tag' || '-section',60,0,'ACTIVE'),
  (:'section_a',:'cohort',:'period',:'tag' || ' archive A',:'tag' || '-section-a',60,0,'ACTIVE'),
  (:'section_b',:'cohort',:'period',:'tag' || ' archive B',:'tag' || '-section-b',60,0,'ACTIVE');

INSERT INTO courses(id,department_id,name,code,status)
VALUES
  (:'course_a',:'dept',:'tag' || ' course A',:'tag' || '-course-a','ACTIVE'),
  (:'course_b',:'dept',:'tag' || ' course B',:'tag' || '-course-b','ACTIVE'),
  (:'course_c',:'dept',:'tag' || ' course C',:'tag' || '-course-c','ACTIVE'),
  (:'course_d',:'dept',:'tag' || ' course D',:'tag' || '-course-d','ACTIVE');

-- ELECTIVE offerings need stable term identity but deliberately no fixed curriculum-row FK.
INSERT INTO course_offerings(
  id,course_id,cohort_id,academic_period_id,program_term_id,type,credits,display_order,status
)
VALUES
  (:'offer_a',:'course_a',:'cohort',:'period',:'term','ELECTIVE',3,1,'ACTIVE'),
  (:'offer_b',:'course_b',:'cohort',:'period',:'term','ELECTIVE',3,2,'ACTIVE'),
  (:'offer_c',:'course_c',:'cohort',:'period',:'term','ELECTIVE',3,3,'ACTIVE'),
  (:'offer_d',:'course_d',:'cohort',:'period',:'term','ELECTIVE',3,4,'ACTIVE');

INSERT INTO course_section_deliveries(id,offering_id,section_id)
VALUES
  (:'delivery_c',:'offer_c',:'section'),
  (:'delivery_d',:'offer_d',:'section');

INSERT INTO users(id,identity_uid,email,display_name)
VALUES(
  :'fac_user',:'tag' || '-faculty',
  :'tag' || '-faculty@example.invalid',:'tag' || ' faculty'
);
INSERT INTO college_memberships(id,user_id,college_id,status)
VALUES(:'fac_member',:'fac_user',:'college','ACTIVE');
INSERT INTO membership_roles(membership_id,role) VALUES(:'fac_member','FACULTY');

INSERT INTO users(id,identity_uid,email,display_name)
VALUES(
  :'learner1_user',:'tag' || '-learner1',
  :'tag' || '-learner1@example.invalid',:'tag' || ' learner1'
);
INSERT INTO college_memberships(id,user_id,college_id,status)
VALUES(:'learner1_member',:'learner1_user',:'college','ACTIVE');
INSERT INTO membership_roles(membership_id,role) VALUES(:'learner1_member','LEARNER');
INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status)
VALUES(:'lpe1',:'learner1_member',:'program',:'cohort','ACTIVE');

INSERT INTO users(id,identity_uid,email,display_name)
VALUES(
  :'learner2_user',:'tag' || '-learner2',
  :'tag' || '-learner2@example.invalid',:'tag' || ' learner2'
);
INSERT INTO college_memberships(id,user_id,college_id,status)
VALUES(:'learner2_member',:'learner2_user',:'college','ACTIVE');
INSERT INTO membership_roles(membership_id,role) VALUES(:'learner2_member','LEARNER');
INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status)
VALUES(:'lpe2',:'learner2_member',:'program',:'cohort','ACTIVE');
SQL

echo "Fixture committed: $RUN_TAG"

# ---------------------------------------------------------------------------
# Race 1A: offering archive wins first -> stale delivery creation must fail.
# ---------------------------------------------------------------------------
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v offer="$OFFER_A" <<'SQL'
BEGIN;
UPDATE course_offerings SET status='ARCHIVED' WHERE id=:'offer';
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v offer="$OFFER_A" -v section="$SECTION" <<'SQL' >"$LOG_B" 2>&1
INSERT INTO course_section_deliveries(offering_id,section_id)
VALUES(:'offer',:'section');
SQL
RC=$?
set -e
wait "$PID_A"
if [[ "$RC" -eq 0 ]]; then
  echo "FAIL offering-archive-first: delivery unexpectedly succeeded" >&2
  cat "$LOG_A" "$LOG_B" >&2
  exit 1
fi
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v offer="$OFFER_A" <<'SQL'
SELECT status || ':' ||
  (SELECT count(*) FROM course_section_deliveries d WHERE d.offering_id=o.id AND d.ended_at IS NULL)
FROM course_offerings o WHERE id=:'offer';
SQL
)"
[[ "$STATE" == "ARCHIVED:0" ]] || { echo "FAIL offering-archive-first state=$STATE" >&2; exit 1; }
echo "PASS offering archive first -> stale delivery rejected"

# Race 1B: delivery wins first -> offering archive must wait then reject.
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v offer="$OFFER_B" -v section="$SECTION" <<'SQL'
BEGIN;
INSERT INTO course_section_deliveries(offering_id,section_id)
VALUES(:'offer',:'section');
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v offer="$OFFER_B" <<'SQL' >"$LOG_B" 2>&1
UPDATE course_offerings SET status='ARCHIVED' WHERE id=:'offer';
SQL
RC=$?
set -e
wait "$PID_A"
if [[ "$RC" -eq 0 ]]; then
  echo "FAIL delivery-first: offering archive unexpectedly succeeded" >&2
  cat "$LOG_A" "$LOG_B" >&2
  exit 1
fi
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v offer="$OFFER_B" <<'SQL'
SELECT status || ':' ||
  (SELECT count(*) FROM course_section_deliveries d WHERE d.offering_id=o.id AND d.ended_at IS NULL)
FROM course_offerings o WHERE id=:'offer';
SQL
)"
[[ "$STATE" == "ACTIVE:1" ]] || { echo "FAIL delivery-first state=$STATE" >&2; exit 1; }
echo "PASS delivery first -> offering archive rejected"

# ---------------------------------------------------------------------------
# Race 2A: delivery end wins first -> teaching assignment creation must fail.
# ---------------------------------------------------------------------------
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v delivery="$DELIVERY_C" <<'SQL'
BEGIN;
UPDATE course_section_deliveries SET ended_at=statement_timestamp() WHERE id=:'delivery';
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1   -v delivery="$DELIVERY_C" -v member="$FAC_MEMBER" <<'SQL' >"$LOG_B" 2>&1
INSERT INTO course_teaching_assignments(delivery_id,membership_id,role)
VALUES(:'delivery',:'member','PRIMARY');
SQL
RC=$?
set -e
wait "$PID_A"
if [[ "$RC" -eq 0 ]]; then
  echo "FAIL delivery-end-first: teaching assignment unexpectedly succeeded" >&2
  cat "$LOG_A" "$LOG_B" >&2
  exit 1
fi
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v delivery="$DELIVERY_C" <<'SQL'
SELECT (ended_at IS NOT NULL)::int || ':' ||
  (SELECT count(*) FROM course_teaching_assignments t WHERE t.delivery_id=d.id AND t.ended_at IS NULL)
FROM course_section_deliveries d WHERE id=:'delivery';
SQL
)"
[[ "$STATE" == "1:0" ]] || { echo "FAIL delivery-end-first state=$STATE" >&2; exit 1; }
echo "PASS delivery end first -> stale teaching assignment rejected"

# Race 2B: teaching assignment wins first -> delivery end must wait then reject.
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1     -v delivery="$DELIVERY_D" -v member="$FAC_MEMBER" <<'SQL'
BEGIN;
INSERT INTO course_teaching_assignments(delivery_id,membership_id,role)
VALUES(:'delivery',:'member','PRIMARY');
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v delivery="$DELIVERY_D" <<'SQL' >"$LOG_B" 2>&1
UPDATE course_section_deliveries SET ended_at=statement_timestamp() WHERE id=:'delivery';
SQL
RC=$?
set -e
wait "$PID_A"
if [[ "$RC" -eq 0 ]]; then
  echo "FAIL teaching-first: delivery end unexpectedly succeeded" >&2
  cat "$LOG_A" "$LOG_B" >&2
  exit 1
fi
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v delivery="$DELIVERY_D" <<'SQL'
SELECT (ended_at IS NULL)::int || ':' ||
  (SELECT count(*) FROM course_teaching_assignments t WHERE t.delivery_id=d.id AND t.ended_at IS NULL)
FROM course_section_deliveries d WHERE id=:'delivery';
SQL
)"
[[ "$STATE" == "1:1" ]] || { echo "FAIL teaching-first state=$STATE" >&2; exit 1; }
echo "PASS teaching first -> delivery end rejected"

# ---------------------------------------------------------------------------
# Race 3A: learner-program exit wins first -> stale ACTIVE section placement fails.
# ---------------------------------------------------------------------------
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v lpe="$LPE1" <<'SQL'
BEGIN;
UPDATE learner_program_enrollments
   SET status='WITHDRAWN', withdrawn_at=statement_timestamp(), completed_at=NULL
 WHERE id=:'lpe';
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1   -v lpe="$LPE1" -v section="$SECTION" -v period="$PERIOD" <<'SQL' >"$LOG_B" 2>&1
INSERT INTO section_enrollments(learner_enrollment_id,section_id,academic_period_id,status)
VALUES(:'lpe',:'section',:'period','ACTIVE');
SQL
RC=$?
set -e
wait "$PID_A"
if [[ "$RC" -eq 0 ]]; then
  echo "FAIL program-exit-first: section placement unexpectedly succeeded" >&2
  cat "$LOG_A" "$LOG_B" >&2
  exit 1
fi
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v lpe="$LPE1" <<'SQL'
SELECT status || ':' ||
  (SELECT count(*) FROM section_enrollments se WHERE se.learner_enrollment_id=l.id AND se.status='ACTIVE')
FROM learner_program_enrollments l WHERE id=:'lpe';
SQL
)"
[[ "$STATE" == "WITHDRAWN:0" ]] || { echo "FAIL program-exit-first state=$STATE" >&2; exit 1; }
echo "PASS learner-program exit first -> stale section placement rejected"

# Race 3B: section placement wins first -> learner-program exit must close it.
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1     -v lpe="$LPE2" -v section="$SECTION" -v period="$PERIOD" <<'SQL'
BEGIN;
INSERT INTO section_enrollments(learner_enrollment_id,section_id,academic_period_id,status)
VALUES(:'lpe',:'section',:'period','ACTIVE');
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v lpe="$LPE2" <<'SQL' >"$LOG_B" 2>&1
UPDATE learner_program_enrollments
   SET status='WITHDRAWN', withdrawn_at=statement_timestamp(), completed_at=NULL
 WHERE id=:'lpe';
SQL
wait "$PID_A"
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v lpe="$LPE2" <<'SQL'
SELECT status || ':' ||
  (SELECT count(*) FROM section_enrollments se WHERE se.learner_enrollment_id=l.id AND se.status='ACTIVE') || ':' ||
  (SELECT count(*) FROM section_enrollments se WHERE se.learner_enrollment_id=l.id AND se.status='WITHDRAWN')
FROM learner_program_enrollments l WHERE id=:'lpe';
SQL
)"
[[ "$STATE" == "WITHDRAWN:0:1" ]] || { echo "FAIL section-placement-first state=$STATE" >&2; exit 1; }
echo "PASS section placement first -> learner-program exit closed placement"

# ---------------------------------------------------------------------------
# Race 4A: section archive wins first -> stale faculty assignment fails.
# ---------------------------------------------------------------------------
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v section="$SECTION_ARCHIVE_A" <<'SQL'
BEGIN;
UPDATE sections SET status='ARCHIVED' WHERE id=:'section';
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1   -v section="$SECTION_ARCHIVE_A" -v member="$FAC_MEMBER" <<'SQL' >"$LOG_B" 2>&1
INSERT INTO section_faculty_assignments(section_id,membership_id,role)
VALUES(:'section',:'member','ADVISOR');
SQL
RC=$?
set -e
wait "$PID_A"
if [[ "$RC" -eq 0 ]]; then
  echo "FAIL section-archive-first: faculty assignment unexpectedly succeeded" >&2
  cat "$LOG_A" "$LOG_B" >&2
  exit 1
fi
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v section="$SECTION_ARCHIVE_A" <<'SQL'
SELECT status || ':' ||
  (SELECT count(*) FROM section_faculty_assignments sfa WHERE sfa.section_id=s.id AND sfa.ended_at IS NULL)
FROM sections s WHERE id=:'section';
SQL
)"
[[ "$STATE" == "ARCHIVED:0" ]] || { echo "FAIL section-archive-first state=$STATE" >&2; exit 1; }
echo "PASS section archive first -> stale faculty assignment rejected"

# Race 4B: faculty assignment wins first -> section archive must wait then reject.
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1     -v section="$SECTION_ARCHIVE_B" -v member="$FAC_MEMBER" <<'SQL'
BEGIN;
INSERT INTO section_faculty_assignments(section_id,membership_id,role)
VALUES(:'section',:'member','ADVISOR');
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$LOG_A" 2>&1 &
PID_A=$!
sleep 0.4
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v section="$SECTION_ARCHIVE_B" <<'SQL' >"$LOG_B" 2>&1
UPDATE sections SET status='ARCHIVED' WHERE id=:'section';
SQL
RC=$?
set -e
wait "$PID_A"
if [[ "$RC" -eq 0 ]]; then
  echo "FAIL faculty-assignment-first: section archive unexpectedly succeeded" >&2
  cat "$LOG_A" "$LOG_B" >&2
  exit 1
fi
STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v section="$SECTION_ARCHIVE_B" <<'SQL'
SELECT status || ':' ||
  (SELECT count(*) FROM section_faculty_assignments sfa WHERE sfa.section_id=s.id AND sfa.ended_at IS NULL)
FROM sections s WHERE id=:'section';
SQL
)"
[[ "$STATE" == "ACTIVE:1" ]] || { echo "FAIL faculty-assignment-first state=$STATE" >&2; exit 1; }
echo "PASS faculty assignment first -> section archive rejected"

echo "DB02 active-parent lifecycle concurrency PASS"
echo "Fixture tag in disposable database: $RUN_TAG"
