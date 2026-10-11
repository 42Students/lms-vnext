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
COHORT_ID="$(new_uuid)"
SECTION_ID="$(new_uuid)"
USER_ID="$(new_uuid)"
MEMBERSHIP_ID="$(new_uuid)"
HALL_ID="$(new_uuid)"

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v run_tag="$RUN_TAG" \
  -v org_id="$ORG_ID" \
  -v college_id="$COLLEGE_ID" \
  -v dept_id="$DEPT_ID" \
  -v program_id="$PROGRAM_ID" \
  -v period_id="$PERIOD_ID" \
  -v cohort_id="$COHORT_ID" \
  -v section_id="$SECTION_ID" \
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
trap 'rm -f "$PROMOTE_A" "$PROMOTE_B" "${BOOK_A:-}" "${ARCHIVE_B:-}" "${ARCHIVE_A:-}" "${BOOK_B:-}"' EXIT

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
echo "DB02 concurrency acceptance PASS"
echo "Fixture rows are intentionally left in this disposable database under tag: $RUN_TAG"
