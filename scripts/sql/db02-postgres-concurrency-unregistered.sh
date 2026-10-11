#!/usr/bin/env bash
# DB02 two-session PostgreSQL acceptance harness — UNREGISTERED.
# Requires: DATABASE_URL pointing at a DISPOSABLE database after Chat 1 registers DB02.
# This script commits fixture rows because independent sessions must observe them.
# Do not run against production or any shared persistent environment.

set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to a disposable PostgreSQL database}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required" >&2
  exit 2
fi

new_uuid() {
  if [[ -r /proc/sys/kernel/random/uuid ]]; then
    cat /proc/sys/kernel/random/uuid
  elif command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  else
    python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
  fi
}

RUN_TAG="db02-$(date +%s)-$$"
ORG_ID="$(new_uuid)"
COLLEGE_ID="$(new_uuid)"
DEPT_ID="$(new_uuid)"
PROGRAM_ID="$(new_uuid)"
PERIOD_ID="$(new_uuid)"
ALT_PERIOD_ID="$(new_uuid)"
COHORT_ID="$(new_uuid)"
SECTION_ID="$(new_uuid)"
RACE_SECTION_A_ID="$(new_uuid)"
RACE_SECTION_B_ID="$(new_uuid)"
USER_ID="$(new_uuid)"
MEMBERSHIP_ID="$(new_uuid)"
HALL_ID="$(new_uuid)"
COURSE_RACE_A_ID="$(new_uuid)"
COURSE_RACE_B_ID="$(new_uuid)"
COURSE_RACE_C_ID="$(new_uuid)"
COURSE_RACE_D_ID="$(new_uuid)"
TERM_RACE_ID="$(new_uuid)"
OFFERING_RACE_A_ID="$(new_uuid)"
OFFERING_RACE_B_ID="$(new_uuid)"
OFFERING_RACE_C_ID="$(new_uuid)"
OFFERING_RACE_D_ID="$(new_uuid)"
EVENT_RACE_A_ID="$(new_uuid)"
EVENT_RACE_B_ID="$(new_uuid)"
PERIOD_RACE_A_ID="$(new_uuid)"
PERIOD_RACE_B_ID="$(new_uuid)"
COHORT_RACE_A_ID="$(new_uuid)"
COHORT_RACE_B_ID="$(new_uuid)"

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v run_tag="$RUN_TAG" \
  -v org_id="$ORG_ID" \
  -v college_id="$COLLEGE_ID" \
  -v dept_id="$DEPT_ID" \
  -v program_id="$PROGRAM_ID" \
  -v period_id="$PERIOD_ID" \
  -v alt_period_id="$ALT_PERIOD_ID" \
  -v cohort_id="$COHORT_ID" \
  -v section_id="$SECTION_ID" \
  -v race_section_a_id="$RACE_SECTION_A_ID" \
  -v race_section_b_id="$RACE_SECTION_B_ID" \
  -v user_id="$USER_ID" \
  -v membership_id="$MEMBERSHIP_ID" \
  -v hall_id="$HALL_ID" <<'SQL'
INSERT INTO organizations(id, name)
VALUES (:'org_id', :'run_tag' || ' org');

INSERT INTO colleges(id, organization_id, name, code)
VALUES (:'college_id', :'org_id', :'run_tag' || ' college', :'run_tag' || '-college');

INSERT INTO departments(id, college_id, name)
VALUES (:'dept_id', :'college_id', :'run_tag' || ' dept');

INSERT INTO programs(id, department_id, name, code, duration_terms)
VALUES (:'program_id', :'dept_id', :'run_tag' || ' program', :'run_tag' || '-program', 4);

INSERT INTO academic_periods(id, college_id, name, code, start_date, end_date, status)
VALUES (
  :'period_id', :'college_id', :'run_tag' || ' period', :'run_tag' || '-period',
  current_date - 30, current_date + 365, 'ACTIVE'
);

INSERT INTO academic_periods(id, college_id, name, code, start_date, end_date, status)
VALUES (
  :'alt_period_id', :'college_id', :'run_tag' || ' alt period', :'run_tag' || '-alt-period',
  current_date - 30, current_date + 365, 'ACTIVE'
);

INSERT INTO cohorts(
  id, program_id, name, code, start_period_id, expected_end_period_id, status,
  start_date, end_date
) VALUES (
  :'cohort_id', :'program_id', :'run_tag' || ' cohort', :'run_tag' || '-cohort',
  :'period_id', :'period_id', 'ACTIVE', current_date - 30, current_date + 365
);

INSERT INTO sections(
  id, cohort_id, academic_period_id, name, code, capacity, minimum_capacity
) VALUES (
  :'section_id', :'cohort_id', :'period_id', :'run_tag' || ' section',
  :'run_tag' || '-section', 60, 0
);

INSERT INTO sections(
  id, cohort_id, academic_period_id, name, code, capacity, minimum_capacity
) VALUES (
  :'race_section_a_id', :'cohort_id', :'period_id', :'run_tag' || ' race section A',
  :'run_tag' || '-race-a', 60, 0
);

INSERT INTO sections(
  id, cohort_id, academic_period_id, name, code, capacity, minimum_capacity
) VALUES (
  :'race_section_b_id', :'cohort_id', :'period_id', :'run_tag' || ' race section B',
  :'run_tag' || '-race-b', 60, 0
);

INSERT INTO users(id, identity_uid, email, display_name)
VALUES (
  :'user_id', :'run_tag' || '-faculty',
  :'run_tag' || '@example.invalid', :'run_tag' || ' faculty'
);

INSERT INTO college_memberships(id, user_id, college_id, status)
VALUES (:'membership_id', :'user_id', :'college_id', 'ACTIVE');

INSERT INTO membership_roles(membership_id, role)
VALUES (:'membership_id', 'FACULTY');

INSERT INTO lecture_halls(id, college_id, department_id, name, capacity, room_type, status)
VALUES (
  :'hall_id', :'college_id', :'dept_id', :'run_tag' || ' hall',
  120, 'LECTURE_HALL', 'ACTIVE'
);
SQL

echo "Fixture committed: $RUN_TAG"

# ---------------------------------------------------------------------------
# Race 1: two promotions with the same expected version -> exactly one winner.
# Session A holds the row lock after its successful CAS update.
# Session B blocks, then its identical version=0 predicate must affect zero rows.
# ---------------------------------------------------------------------------
PROMOTE_A="$(mktemp)"
PROMOTE_B="$(mktemp)"
trap 'rm -f "$PROMOTE_A" "$PROMOTE_B" "${BOOK_A:-}" "${ARCHIVE_B:-}" "${ARCHIVE_A:-}" "${BOOK_B:-}" "${HISTORY_A:-}" "${MOVE_B:-}" "${MOVE_A:-}" "${HISTORY_B:-}" "${DELIVERY_FIRST:-}" "${OFFERING_MOVE_AFTER:-}" "${OFFERING_MOVE_FIRST:-}" "${DELIVERY_AFTER_MOVE:-}" "${ATTENDANCE_FIRST:-}" "${EVENT_MOVE_AFTER:-}" "${EVENT_MOVE_FIRST:-}" "${ATTENDANCE_AFTER_MOVE:-}" "${OFFERING_FIRST:-}" "${CURRICULUM_DELETE_AFTER:-}" "${CURRICULUM_DELETE_FIRST:-}" "${OFFERING_AFTER_DELETE:-}" "${COHORT_FIRST:-}" "${PERIOD_EDIT_AFTER:-}" "${PERIOD_EDIT_FIRST:-}" "${COHORT_AFTER_EDIT:-}"' EXIT

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v cohort_id="$COHORT_ID" -v period_id="$PERIOD_ID" <<'SQL'
BEGIN;
WITH changed AS (
  UPDATE cohort_progression_state
     SET current_term_number = 2,
         current_period_id = :'period_id',
         version = 1
   WHERE cohort_id = :'cohort_id'
     AND version = 0
  RETURNING 1
)
SELECT count(*) FROM changed;
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$PROMOTE_A" 2>&1 &
PID_A=$!

sleep 0.5

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v cohort_id="$COHORT_ID" -v period_id="$PERIOD_ID" <<'SQL'
BEGIN;
WITH changed AS (
  UPDATE cohort_progression_state
     SET current_term_number = 2,
         current_period_id = :'period_id',
         version = 1
   WHERE cohort_id = :'cohort_id'
     AND version = 0
  RETURNING 1
)
SELECT count(*) FROM changed;
COMMIT;
SQL
) >"$PROMOTE_B" 2>&1 &
PID_B=$!

wait "$PID_A"
wait "$PID_B"

WIN_A="$(grep -E '^[01]$' "$PROMOTE_A" | head -n1 || true)"
WIN_B="$(grep -E '^[01]$' "$PROMOTE_B" | head -n1 || true)"

if [[ "$WIN_A" != "1" || "$WIN_B" != "0" ]]; then
  echo "Promotion race failed: session A=$WIN_A session B=$WIN_B" >&2
  echo "--- A ---" >&2; cat "$PROMOTE_A" >&2
  echo "--- B ---" >&2; cat "$PROMOTE_B" >&2
  exit 1
fi

PROMOTION_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v cohort_id="$COHORT_ID" <<'SQL'
SELECT current_term_number || ':' || version || ':' ||
       (SELECT count(*) FROM cohort_progression_events e
         WHERE e.cohort_id = s.cohort_id AND e.state_version = 1)
  FROM cohort_progression_state s
 WHERE cohort_id = :'cohort_id';
SQL
)"

if [[ "$PROMOTION_STATE" != "2:1:1" ]]; then
  echo "Promotion final state/history mismatch: $PROMOTION_STATE" >&2
  exit 1
fi

echo "PASS promotion CAS race: one winner, state/history=2:1:1"

# ---------------------------------------------------------------------------
# Race 2A: archive locks hall first -> concurrent future booking must fail.
# ---------------------------------------------------------------------------
ARCHIVE_A="$(mktemp)"
BOOK_B="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v hall_id="$HALL_ID" <<'SQL'
BEGIN;
UPDATE lecture_halls SET status = 'ARCHIVED' WHERE id = :'hall_id';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$ARCHIVE_A" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v section_id="$SECTION_ID" -v membership_id="$MEMBERSHIP_ID" -v hall_id="$HALL_ID" <<'SQL' >"$BOOK_B" 2>&1
INSERT INTO section_schedule_events(
  section_id, faculty_membership_id, lecture_hall_id, title, starts_at, ends_at
) VALUES (
  :'section_id', :'membership_id', :'hall_id', 'db02 archive-wins booking',
  date_trunc('day', now()) + interval '7 days 09 hours',
  date_trunc('day', now()) + interval '7 days 10 hours'
);
SQL
BOOK_STATUS=$?
set -e

wait "$PID_A"

if [[ "$BOOK_STATUS" -eq 0 ]]; then
  echo "Hall archive-wins race failed: booking unexpectedly succeeded" >&2
  cat "$BOOK_B" >&2
  exit 1
fi

echo "PASS hall race A: archive winner caused booking rejection"

# Reset hall for reverse race.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v hall_id="$HALL_ID" <<'SQL' >/dev/null
UPDATE lecture_halls SET status = 'ACTIVE' WHERE id = :'hall_id';
SQL

# ---------------------------------------------------------------------------
# Race 2B: booking takes hall FOR SHARE first -> concurrent archive must fail
# after booking commits and archive guard observes the future scheduled event.
# ---------------------------------------------------------------------------
BOOK_A="$(mktemp)"
ARCHIVE_B="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
    -v section_id="$SECTION_ID" -v membership_id="$MEMBERSHIP_ID" -v hall_id="$HALL_ID" <<'SQL'
BEGIN;
INSERT INTO section_schedule_events(
  section_id, faculty_membership_id, lecture_hall_id, title, starts_at, ends_at
) VALUES (
  :'section_id', :'membership_id', :'hall_id', 'db02 booking-wins event',
  date_trunc('day', now()) + interval '8 days 09 hours',
  date_trunc('day', now()) + interval '8 days 10 hours'
);
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$BOOK_A" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v hall_id="$HALL_ID" <<'SQL' >"$ARCHIVE_B" 2>&1
UPDATE lecture_halls SET status = 'ARCHIVED' WHERE id = :'hall_id';
SQL
ARCHIVE_STATUS=$?
set -e

wait "$PID_A"

if [[ "$ARCHIVE_STATUS" -eq 0 ]]; then
  echo "Hall booking-wins race failed: archive unexpectedly succeeded" >&2
  cat "$ARCHIVE_B" >&2
  exit 1
fi

HALL_STATUS="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v hall_id="$HALL_ID" <<'SQL'
SELECT status FROM lecture_halls WHERE id = :'hall_id';
SQL
)"

if [[ "$HALL_STATUS" != "ACTIVE" ]]; then
  echo "Hall status mismatch after booking-wins race: $HALL_STATUS" >&2
  exit 1
fi

echo "PASS hall race B: booking winner kept hall ACTIVE and archive was rejected"

# ---------------------------------------------------------------------------
# Race 3A: history insert obtains SHARE first -> section reparent must block,
# then reject after the history transaction commits.
# ---------------------------------------------------------------------------
HISTORY_A="$(mktemp)"
MOVE_B="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v section_id="$RACE_SECTION_A_ID" <<'SQL'
BEGIN;
INSERT INTO section_schedule_events(section_id, title, starts_at, ends_at)
VALUES (
  :'section_id', 'db02 history-first event',
  date_trunc('day', now()) + interval '10 days 09 hours',
  date_trunc('day', now()) + interval '10 days 10 hours'
);
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$HISTORY_A" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1   -v section_id="$RACE_SECTION_A_ID" -v alt_period_id="$ALT_PERIOD_ID" <<'SQL' >"$MOVE_B" 2>&1
UPDATE sections
   SET academic_period_id = :'alt_period_id'
 WHERE id = :'section_id';
SQL
MOVE_STATUS=$?
set -e

wait "$PID_A"

if [[ "$MOVE_STATUS" -eq 0 ]]; then
  echo "Section history-first race failed: reparent unexpectedly succeeded" >&2
  cat "$MOVE_B" >&2
  exit 1
fi

RACE_A_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1   -v section_id="$RACE_SECTION_A_ID" -v period_id="$PERIOD_ID" <<'SQL'
SELECT
  (academic_period_id = :'period_id')::int || ':' ||
  (SELECT count(*) FROM section_schedule_events e WHERE e.section_id = s.id)
FROM sections s
WHERE id = :'section_id';
SQL
)"

if [[ "$RACE_A_STATE" != "1:1" ]]; then
  echo "Section history-first final state mismatch: $RACE_A_STATE" >&2
  exit 1
fi

echo "PASS section race A: committed history prevented structural reparent"

# ---------------------------------------------------------------------------
# Race 3B: reparent obtains NO KEY UPDATE first -> history insert must block,
# then succeed against the newly committed section parent. Both commits are valid
# because history is created only after the structural move is visible.
# ---------------------------------------------------------------------------
MOVE_A="$(mktemp)"
HISTORY_B="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1     -v section_id="$RACE_SECTION_B_ID" -v alt_period_id="$ALT_PERIOD_ID" <<'SQL'
BEGIN;
UPDATE sections
   SET academic_period_id = :'alt_period_id'
 WHERE id = :'section_id';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$MOVE_A" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v section_id="$RACE_SECTION_B_ID" <<'SQL' >"$HISTORY_B" 2>&1
INSERT INTO section_schedule_events(section_id, title, starts_at, ends_at)
VALUES (
  :'section_id', 'db02 move-first event',
  date_trunc('day', now()) + interval '11 days 09 hours',
  date_trunc('day', now()) + interval '11 days 10 hours'
);
SQL
HISTORY_STATUS=$?
set -e

wait "$PID_A"

if [[ "$HISTORY_STATUS" -ne 0 ]]; then
  echo "Section move-first race failed: history insert did not succeed after reparent" >&2
  cat "$HISTORY_B" >&2
  exit 1
fi

RACE_B_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1   -v section_id="$RACE_SECTION_B_ID" -v alt_period_id="$ALT_PERIOD_ID" <<'SQL'
SELECT
  (academic_period_id = :'alt_period_id')::int || ':' ||
  (SELECT count(*) FROM section_schedule_events e WHERE e.section_id = s.id)
FROM sections s
WHERE id = :'section_id';
SQL
)"

if [[ "$RACE_B_STATE" != "1:1" ]]; then
  echo "Section move-first final state mismatch: $RACE_B_STATE" >&2
  exit 1
fi

echo "PASS section race B: reparent committed before serialized history insert"

# ---------------------------------------------------------------------------
# Prepare isolated offering/event fixtures for historic-parent races.
# Race section A stayed on period_id; race section B was moved to alt_period_id above.
# ---------------------------------------------------------------------------
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v run_tag="$RUN_TAG" \
  -v dept_id="$DEPT_ID" \
  -v program_id="$PROGRAM_ID" \
  -v cohort_id="$COHORT_ID" \
  -v period_id="$PERIOD_ID" \
  -v race_section_a_id="$RACE_SECTION_A_ID" \
  -v course_race_a_id="$COURSE_RACE_A_ID" \
  -v course_race_b_id="$COURSE_RACE_B_ID" \
  -v course_race_c_id="$COURSE_RACE_C_ID" \
  -v course_race_d_id="$COURSE_RACE_D_ID" \
  -v term_race_id="$TERM_RACE_ID" \
  -v offering_race_a_id="$OFFERING_RACE_A_ID" \
  -v offering_race_b_id="$OFFERING_RACE_B_ID" \
  -v offering_race_c_id="$OFFERING_RACE_C_ID" \
  -v offering_race_d_id="$OFFERING_RACE_D_ID" \
  -v event_race_a_id="$EVENT_RACE_A_ID" \
  -v event_race_b_id="$EVENT_RACE_B_ID" <<'SQL' >/dev/null
INSERT INTO courses(id, department_id, name, code)
VALUES
  (:'course_race_a_id', :'dept_id', :'run_tag' || ' history course A', :'run_tag' || '-hist-course-a'),
  (:'course_race_b_id', :'dept_id', :'run_tag' || ' history course B', :'run_tag' || '-hist-course-b'),
  (:'course_race_c_id', :'dept_id', :'run_tag' || ' curriculum race course C', :'run_tag' || '-curr-course-c'),
  (:'course_race_d_id', :'dept_id', :'run_tag' || ' curriculum race course D', :'run_tag' || '-curr-course-d');

INSERT INTO program_terms(id, program_id, term_number, name, is_active)
VALUES (:'term_race_id', :'program_id', 1, :'run_tag' || ' history term', true);

INSERT INTO program_term_courses(program_term_id, course_id, type, credits, display_order)
VALUES
  (:'term_race_id', :'course_race_a_id', 'CORE', 3, 1),
  (:'term_race_id', :'course_race_b_id', 'CORE', 3, 2),
  (:'term_race_id', :'course_race_c_id', 'CORE', 3, 3),
  (:'term_race_id', :'course_race_d_id', 'CORE', 3, 4);

INSERT INTO course_offerings(
  id, course_id, cohort_id, academic_period_id, program_term_id, type, credits, display_order
) VALUES
  (:'offering_race_a_id', :'course_race_a_id', :'cohort_id', :'period_id', :'term_race_id', 'CORE', 3, 1),
  (:'offering_race_b_id', :'course_race_b_id', :'cohort_id', :'period_id', :'term_race_id', 'CORE', 3, 2);

INSERT INTO section_schedule_events(id, section_id, title, starts_at, ends_at)
VALUES
  (
    :'event_race_a_id', :'race_section_a_id', 'db02 attendance-first parent race',
    date_trunc('day', now()) + interval '12 days 09 hours',
    date_trunc('day', now()) + interval '12 days 10 hours'
  ),
  (
    :'event_race_b_id', :'race_section_a_id', 'db02 event-move-first parent race',
    date_trunc('day', now()) + interval '13 days 09 hours',
    date_trunc('day', now()) + interval '13 days 10 hours'
  );
SQL

# ---------------------------------------------------------------------------
# Race 4A: delivery creation takes offering SHARE first. A concurrent otherwise-valid
# offering period move must block and then reject once delivery history is committed.
# ---------------------------------------------------------------------------
DELIVERY_FIRST="$(mktemp)"
OFFERING_MOVE_AFTER="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
    -v offering_id="$OFFERING_RACE_A_ID" -v section_id="$RACE_SECTION_A_ID" <<'SQL'
BEGIN;
INSERT INTO course_section_deliveries(offering_id, section_id)
VALUES (:'offering_id', :'section_id');
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$DELIVERY_FIRST" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v offering_id="$OFFERING_RACE_A_ID" -v alt_period_id="$ALT_PERIOD_ID" <<'SQL' >"$OFFERING_MOVE_AFTER" 2>&1
UPDATE course_offerings
   SET academic_period_id = :'alt_period_id'
 WHERE id = :'offering_id';
SQL
MOVE_STATUS=$?
set -e

wait "$PID_A"

if [[ "$MOVE_STATUS" -eq 0 ]]; then
  echo "Offering history-first race failed: offering reparent unexpectedly succeeded" >&2
  cat "$OFFERING_MOVE_AFTER" >&2
  exit 1
fi

OFFER_A_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v offering_id="$OFFERING_RACE_A_ID" -v period_id="$PERIOD_ID" <<'SQL'
SELECT
  (academic_period_id = :'period_id')::int || ':' ||
  (SELECT count(*) FROM course_section_deliveries d WHERE d.offering_id = o.id)
FROM course_offerings o
WHERE id = :'offering_id';
SQL
)"

if [[ "$OFFER_A_STATE" != "1:1" ]]; then
  echo "Offering history-first final state mismatch: $OFFER_A_STATE" >&2
  exit 1
fi

echo "PASS offering race A: committed delivery prevented offering reparent"

# ---------------------------------------------------------------------------
# Race 4B: offering reparent wins first. Delivery creation blocks on the offering,
# then validates against the newly committed alt period and must reject a period_id section.
# ---------------------------------------------------------------------------
OFFERING_MOVE_FIRST="$(mktemp)"
DELIVERY_AFTER_MOVE="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
    -v offering_id="$OFFERING_RACE_B_ID" -v alt_period_id="$ALT_PERIOD_ID" <<'SQL'
BEGIN;
UPDATE course_offerings
   SET academic_period_id = :'alt_period_id'
 WHERE id = :'offering_id';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$OFFERING_MOVE_FIRST" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v offering_id="$OFFERING_RACE_B_ID" -v section_id="$RACE_SECTION_A_ID" <<'SQL' >"$DELIVERY_AFTER_MOVE" 2>&1
INSERT INTO course_section_deliveries(offering_id, section_id)
VALUES (:'offering_id', :'section_id');
SQL
DELIVERY_STATUS=$?
set -e

wait "$PID_A"

if [[ "$DELIVERY_STATUS" -eq 0 ]]; then
  echo "Offering move-first race failed: stale-period delivery unexpectedly succeeded" >&2
  cat "$DELIVERY_AFTER_MOVE" >&2
  exit 1
fi

OFFER_B_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v offering_id="$OFFERING_RACE_B_ID" -v alt_period_id="$ALT_PERIOD_ID" <<'SQL'
SELECT
  (academic_period_id = :'alt_period_id')::int || ':' ||
  (SELECT count(*) FROM course_section_deliveries d WHERE d.offering_id = o.id)
FROM course_offerings o
WHERE id = :'offering_id';
SQL
)"

if [[ "$OFFER_B_STATE" != "1:0" ]]; then
  echo "Offering move-first final state mismatch: $OFFER_B_STATE" >&2
  exit 1
fi

echo "PASS offering race B: reparent winner invalidated stale delivery creation"

# ---------------------------------------------------------------------------
# Race 5A: attendance creation takes schedule-event SHARE first. Concurrent section
# reparent must block and then reject once attendance history commits.
# ---------------------------------------------------------------------------
ATTENDANCE_FIRST="$(mktemp)"
EVENT_MOVE_AFTER="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v event_id="$EVENT_RACE_A_ID" <<'SQL'
BEGIN;
INSERT INTO attendance_sessions(schedule_event_id) VALUES (:'event_id');
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$ATTENDANCE_FIRST" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v event_id="$EVENT_RACE_A_ID" -v section_id="$SECTION_ID" <<'SQL' >"$EVENT_MOVE_AFTER" 2>&1
UPDATE section_schedule_events
   SET section_id = :'section_id'
 WHERE id = :'event_id';
SQL
EVENT_MOVE_STATUS=$?
set -e

wait "$PID_A"

if [[ "$EVENT_MOVE_STATUS" -eq 0 ]]; then
  echo "Attendance-first event race failed: event section move unexpectedly succeeded" >&2
  cat "$EVENT_MOVE_AFTER" >&2
  exit 1
fi

EVENT_A_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v event_id="$EVENT_RACE_A_ID" -v section_id="$RACE_SECTION_A_ID" <<'SQL'
SELECT
  (section_id = :'section_id')::int || ':' ||
  (SELECT count(*) FROM attendance_sessions a WHERE a.schedule_event_id = e.id)
FROM section_schedule_events e
WHERE id = :'event_id';
SQL
)"

if [[ "$EVENT_A_STATE" != "1:1" ]]; then
  echo "Attendance-first event final state mismatch: $EVENT_A_STATE" >&2
  exit 1
fi

echo "PASS event race A: committed attendance prevented event section rewrite"

# ---------------------------------------------------------------------------
# Race 5B: event section move wins first. Attendance creation blocks on the event
# parent lock, then succeeds against the newly committed identity.
# ---------------------------------------------------------------------------
EVENT_MOVE_FIRST="$(mktemp)"
ATTENDANCE_AFTER_MOVE="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
    -v event_id="$EVENT_RACE_B_ID" -v section_id="$SECTION_ID" <<'SQL'
BEGIN;
UPDATE section_schedule_events
   SET section_id = :'section_id'
 WHERE id = :'event_id';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$EVENT_MOVE_FIRST" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v event_id="$EVENT_RACE_B_ID" <<'SQL' >"$ATTENDANCE_AFTER_MOVE" 2>&1
INSERT INTO attendance_sessions(schedule_event_id) VALUES (:'event_id');
SQL
ATTENDANCE_STATUS=$?
set -e

wait "$PID_A"

if [[ "$ATTENDANCE_STATUS" -ne 0 ]]; then
  echo "Event move-first race failed: attendance insert did not serialize and succeed" >&2
  cat "$ATTENDANCE_AFTER_MOVE" >&2
  exit 1
fi

EVENT_B_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v event_id="$EVENT_RACE_B_ID" -v section_id="$SECTION_ID" <<'SQL'
SELECT
  (section_id = :'section_id')::int || ':' ||
  (SELECT count(*) FROM attendance_sessions a WHERE a.schedule_event_id = e.id)
FROM section_schedule_events e
WHERE id = :'event_id';
SQL
)"

if [[ "$EVENT_B_STATE" != "1:1" ]]; then
  echo "Event move-first final state mismatch: $EVENT_B_STATE" >&2
  exit 1
fi

echo "PASS event race B: move committed before serialized attendance history"

# ---------------------------------------------------------------------------
# Race 6A: CORE offering creation takes SHARE on its curriculum row first.
# Concurrent curriculum deletion must block and reject after the offering commits.
# ---------------------------------------------------------------------------
OFFERING_FIRST="$(mktemp)"
CURRICULUM_DELETE_AFTER="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
    -v offering_id="$OFFERING_RACE_C_ID" -v course_id="$COURSE_RACE_C_ID" \
    -v cohort_id="$COHORT_ID" -v period_id="$PERIOD_ID" -v term_id="$TERM_RACE_ID" <<'SQL'
BEGIN;
INSERT INTO course_offerings(
  id, course_id, cohort_id, academic_period_id, program_term_id, type, credits, display_order
) VALUES (
  :'offering_id', :'course_id', :'cohort_id', :'period_id', :'term_id', 'CORE', 3, 3
);
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$OFFERING_FIRST" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v course_id="$COURSE_RACE_C_ID" -v term_id="$TERM_RACE_ID" <<'SQL' >"$CURRICULUM_DELETE_AFTER" 2>&1
DELETE FROM program_term_courses
 WHERE program_term_id = :'term_id'
   AND course_id = :'course_id';
SQL
DELETE_STATUS=$?
set -e

wait "$PID_A"

if [[ "$DELETE_STATUS" -eq 0 ]]; then
  echo "Curriculum offering-first race failed: materialized curriculum delete succeeded" >&2
  cat "$CURRICULUM_DELETE_AFTER" >&2
  exit 1
fi

CURR_A_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v offering_id="$OFFERING_RACE_C_ID" -v course_id="$COURSE_RACE_C_ID" -v term_id="$TERM_RACE_ID" <<'SQL'
SELECT
  (SELECT count(*) FROM course_offerings WHERE id = :'offering_id') || ':' ||
  (SELECT count(*) FROM program_term_courses
    WHERE program_term_id = :'term_id' AND course_id = :'course_id');
SQL
)"

if [[ "$CURR_A_STATE" != "1:1" ]]; then
  echo "Curriculum offering-first final state mismatch: $CURR_A_STATE" >&2
  exit 1
fi

echo "PASS curriculum race A: committed CORE offering protected curriculum row"

# ---------------------------------------------------------------------------
# Race 6B: curriculum deletion owns the row first. CORE offering creation blocks
# on SELECT ... FOR SHARE and must reject after the delete commits.
# ---------------------------------------------------------------------------
CURRICULUM_DELETE_FIRST="$(mktemp)"
OFFERING_AFTER_DELETE="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
    -v course_id="$COURSE_RACE_D_ID" -v term_id="$TERM_RACE_ID" <<'SQL'
BEGIN;
DELETE FROM program_term_courses
 WHERE program_term_id = :'term_id'
   AND course_id = :'course_id';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$CURRICULUM_DELETE_FIRST" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v offering_id="$OFFERING_RACE_D_ID" -v course_id="$COURSE_RACE_D_ID" \
  -v cohort_id="$COHORT_ID" -v period_id="$PERIOD_ID" -v term_id="$TERM_RACE_ID" <<'SQL' >"$OFFERING_AFTER_DELETE" 2>&1
INSERT INTO course_offerings(
  id, course_id, cohort_id, academic_period_id, program_term_id, type, credits, display_order
) VALUES (
  :'offering_id', :'course_id', :'cohort_id', :'period_id', :'term_id', 'CORE', 3, 4
);
SQL
OFFERING_STATUS=$?
set -e

wait "$PID_A"

if [[ "$OFFERING_STATUS" -eq 0 ]]; then
  echo "Curriculum delete-first race failed: CORE offering unexpectedly succeeded" >&2
  cat "$OFFERING_AFTER_DELETE" >&2
  exit 1
fi

CURR_B_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v offering_id="$OFFERING_RACE_D_ID" -v course_id="$COURSE_RACE_D_ID" -v term_id="$TERM_RACE_ID" <<'SQL'
SELECT
  (SELECT count(*) FROM course_offerings WHERE id = :'offering_id') || ':' ||
  (SELECT count(*) FROM program_term_courses
    WHERE program_term_id = :'term_id' AND course_id = :'course_id');
SQL
)"

if [[ "$CURR_B_STATE" != "0:0" ]]; then
  echo "Curriculum delete-first final state mismatch: $CURR_B_STATE" >&2
  exit 1
fi

echo "PASS curriculum race B: committed curriculum delete rejected stale CORE offering"

# ---------------------------------------------------------------------------
# Prepare two unused periods for parent-date mutation races.
# ---------------------------------------------------------------------------
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v run_tag="$RUN_TAG" -v college_id="$COLLEGE_ID" \
  -v period_race_a_id="$PERIOD_RACE_A_ID" -v period_race_b_id="$PERIOD_RACE_B_ID" <<'SQL' >/dev/null
INSERT INTO academic_periods(id, college_id, name, code, start_date, end_date, status)
VALUES
  (
    :'period_race_a_id', :'college_id', :'run_tag' || ' period race A',
    :'run_tag' || '-period-race-a', current_date + 400, current_date + 500, 'PLANNED'
  ),
  (
    :'period_race_b_id', :'college_id', :'run_tag' || ' period race B',
    :'run_tag' || '-period-race-b', current_date + 600, current_date + 700, 'PLANNED'
  );
SQL

# ---------------------------------------------------------------------------
# Race 7A: cohort creation locks its period first. Concurrent date edit blocks,
# then rejects because the period became historical parent state.
# ---------------------------------------------------------------------------
COHORT_FIRST="$(mktemp)"
PERIOD_EDIT_AFTER="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
    -v cohort_id="$COHORT_RACE_A_ID" -v program_id="$PROGRAM_ID" \
    -v period_id="$PERIOD_RACE_A_ID" -v run_tag="$RUN_TAG" <<'SQL'
BEGIN;
INSERT INTO cohorts(
  id, program_id, name, code, start_period_id, expected_end_period_id, status
) VALUES (
  :'cohort_id', :'program_id', :'run_tag' || ' cohort period-race A',
  :'run_tag' || '-cohort-period-race-a', :'period_id', :'period_id', 'PLANNED'
);
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$COHORT_FIRST" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v period_id="$PERIOD_RACE_A_ID" <<'SQL' >"$PERIOD_EDIT_AFTER" 2>&1
UPDATE academic_periods
   SET start_date = start_date + 1,
       end_date = end_date + 1
 WHERE id = :'period_id';
SQL
PERIOD_EDIT_STATUS=$?
set -e

wait "$PID_A"

if [[ "$PERIOD_EDIT_STATUS" -eq 0 ]]; then
  echo "Period child-first race failed: referenced period date edit unexpectedly succeeded" >&2
  cat "$PERIOD_EDIT_AFTER" >&2
  exit 1
fi

PERIOD_A_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v cohort_id="$COHORT_RACE_A_ID" -v period_id="$PERIOD_RACE_A_ID" <<'SQL'
SELECT
  (SELECT count(*) FROM cohorts WHERE id = :'cohort_id') || ':' ||
  (SELECT count(*) FROM cohorts
    WHERE id = :'cohort_id' AND start_period_id = :'period_id' AND expected_end_period_id = :'period_id');
SQL
)"

if [[ "$PERIOD_A_STATE" != "1:1" ]]; then
  echo "Period child-first final state mismatch: $PERIOD_A_STATE" >&2
  exit 1
fi

echo "PASS period race A: cohort creation froze referenced period dates"

# ---------------------------------------------------------------------------
# Race 7B: unused period date edit owns the row first. Cohort creation blocks,
# then validates the newly committed period and succeeds.
# ---------------------------------------------------------------------------
PERIOD_EDIT_FIRST="$(mktemp)"
COHORT_AFTER_EDIT="$(mktemp)"

(
  psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 -v period_id="$PERIOD_RACE_B_ID" <<'SQL'
BEGIN;
UPDATE academic_periods
   SET start_date = start_date + 1,
       end_date = end_date + 1
 WHERE id = :'period_id';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$PERIOD_EDIT_FIRST" 2>&1 &
PID_A=$!

sleep 0.5

set +e
psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v cohort_id="$COHORT_RACE_B_ID" -v program_id="$PROGRAM_ID" \
  -v period_id="$PERIOD_RACE_B_ID" -v run_tag="$RUN_TAG" <<'SQL' >"$COHORT_AFTER_EDIT" 2>&1
INSERT INTO cohorts(
  id, program_id, name, code, start_period_id, expected_end_period_id, status
) VALUES (
  :'cohort_id', :'program_id', :'run_tag' || ' cohort period-race B',
  :'run_tag' || '-cohort-period-race-b', :'period_id', :'period_id', 'PLANNED'
);
SQL
COHORT_STATUS=$?
set -e

wait "$PID_A"

if [[ "$COHORT_STATUS" -ne 0 ]]; then
  echo "Period edit-first race failed: cohort insert did not validate new period state" >&2
  cat "$COHORT_AFTER_EDIT" >&2
  exit 1
fi

PERIOD_B_STATE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v cohort_id="$COHORT_RACE_B_ID" -v period_id="$PERIOD_RACE_B_ID" <<'SQL'
SELECT
  (SELECT count(*) FROM cohorts WHERE id = :'cohort_id') || ':' ||
  (SELECT count(*) FROM academic_periods
    WHERE id = :'period_id' AND start_date = current_date + 601 AND end_date = current_date + 701);
SQL
)"

if [[ "$PERIOD_B_STATE" != "1:1" ]]; then
  echo "Period edit-first final state mismatch: $PERIOD_B_STATE" >&2
  exit 1
fi

echo "PASS period race B: parent edit committed before serialized cohort creation"
echo "DB02 concurrency acceptance PASS"
echo "Fixture rows are intentionally left in this disposable database under tag: $RUN_TAG"
