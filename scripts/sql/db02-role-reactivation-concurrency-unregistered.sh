#!/usr/bin/env bash
# DB02 / Chat4 role-revocation vs faculty-association reactivation races.
# UNEXECUTED / UNREGISTERED. Run ONLY on a disposable PostgreSQL database
# AFTER DB02 numbered migration replay; drops nothing, fixtures remain committed.
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
: "${DB02_EXPECTED_DATABASE:?Exact disposable PostgreSQL database name required}"
if [[ "${DB02_DISPOSABLE_ACCEPTANCE:-}" != "YES" ]]; then
  echo "Refusing to run: explicitly set DB02_DISPOSABLE_ACCEPTANCE=YES" >&2
  exit 2
fi
command -v psql >/dev/null || { echo "psql required" >&2; exit 2; }
ACTUAL_DATABASE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -c 'SELECT current_database()')"
if [[ "$ACTUAL_DATABASE" != "$DB02_EXPECTED_DATABASE" ]]; then
  echo "DB name mismatch: expected $DB02_EXPECTED_DATABASE, actual $ACTUAL_DATABASE" >&2
  exit 2
fi

uuid() {
  if [[ -r /proc/sys/kernel/random/uuid ]]; then cat /proc/sys/kernel/random/uuid
  elif command -v uuidgen >/dev/null; then uuidgen
  else python3 -c 'import uuid;print(uuid.uuid4())'; fi
}
RUN_TAG="db02-role-race-$(date +%s)-$$"
ORG="$(uuid)"; COLLEGE="$(uuid)"; DEPT="$(uuid)"
COURSE="$(uuid)"; USER_ID="$(uuid)"; MEMBERSHIP="$(uuid)"; ASSOCIATION="$(uuid)"
A_LOG="$(mktemp)"; B_LOG="$(mktemp)"
trap 'rm -f "$A_LOG" "$B_LOG"' EXIT

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v tag="$RUN_TAG" -v org="$ORG" -v college="$COLLEGE" \
  -v dept="$DEPT" -v course="$COURSE" \
  -v uid="$USER_ID" -v member="$MEMBERSHIP" -v assoc="$ASSOCIATION" <<'SQL'
INSERT INTO organizations(id,name) VALUES(:'org',:'tag' || ' org');
INSERT INTO colleges(id,organization_id,name,code)
  VALUES(:'college',:'org',:'tag' || ' college',:'tag' || '-college');
INSERT INTO departments(id,college_id,name)
  VALUES(:'dept',:'college',:'tag' || ' dept');
INSERT INTO courses(id,department_id,name,code)
  VALUES(:'course',:'dept',:'tag' || ' course',:'tag' || '-course');
INSERT INTO users(id,identity_uid,email,display_name)
  VALUES(:'uid',:'tag' || '-uid',
         :'tag' || '@example.invalid',:'tag' || ' faculty');
INSERT INTO college_memberships(id,user_id,college_id)
  VALUES(:'member',:'uid',:'college');
INSERT INTO membership_roles(membership_id,role)
  VALUES(:'member','FACULTY');
INSERT INTO faculty_course_associations(id,membership_id,course_id,ended_at)
  VALUES(:'assoc',:'member',:'course',statement_timestamp());
SQL

# Race A: role DELETE wins row lock and commits first. Reopen must fail due
# to missing FACULTY role and must not resurrect a live association.
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v member="$MEMBERSHIP" <<'SQL'
BEGIN;
DELETE FROM membership_roles WHERE membership_id=:'member' AND role='FACULTY';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$A_LOG" 2>&1 &
PID_A=$!
sleep 0.5
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v assoc="$ASSOCIATION" <<'SQL' >"$B_LOG" 2>&1
UPDATE faculty_course_associations SET ended_at=NULL WHERE id=:'assoc';
SQL
REOPEN_RC=$?
set -e
wait "$PID_A"
if [[ "$REOPEN_RC" -eq 0 ]] ||
   ! grep -Fq 'Cannot reactivate faculty assignment without FACULTY role' "$B_LOG"; then
  echo "FAIL role-delete-first: unexpected reopen success/error" >&2
  cat "$A_LOG" "$B_LOG" >&2
  exit 1
fi
STATE_A="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v assoc="$ASSOCIATION" -v member="$MEMBERSHIP" <<'SQL'
SELECT CASE WHEN ended_at IS NULL THEN 'OPEN' ELSE 'CLOSED' END || ':' ||
  (SELECT count(*) FROM membership_roles WHERE membership_id=:'member' AND role='FACULTY')::text
FROM faculty_course_associations WHERE id=:'assoc';
SQL
)"
if [[ "$STATE_A" != "CLOSED:0" ]]; then
  echo "FAIL role-delete-first persisted inconsistent state: $STATE_A" >&2
  exit 1
fi
echo "PASS role-delete-first: reopened faculty course rejected"

# Race B: role is regranted, reactivation wins first. It locks the FACULTY
# role FOR SHARE until COMMIT. Concurrent de-role must wait, then close the
# now-live association. Both transactions may commit; persisted state CLOSED.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v member="$MEMBERSHIP" <<'SQL'
INSERT INTO membership_roles(membership_id,role) VALUES(:'member','FACULTY');
SQL
(
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v assoc="$ASSOCIATION" <<'SQL'
BEGIN;
UPDATE faculty_course_associations SET ended_at=NULL WHERE id=:'assoc';
SELECT pg_sleep(3);
COMMIT;
SQL
) >"$A_LOG" 2>&1 &
PID_A=$!
sleep 0.5
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v member="$MEMBERSHIP" <<'SQL' >"$B_LOG" 2>&1
DELETE FROM membership_roles WHERE membership_id=:'member' AND role='FACULTY';
SQL
wait "$PID_A"

STATE_B="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -v assoc="$ASSOCIATION" -v member="$MEMBERSHIP" <<'SQL'
SELECT CASE WHEN ended_at IS NULL THEN 'OPEN' ELSE 'CLOSED' END || ':' ||
  (SELECT count(*) FROM membership_roles WHERE membership_id=:'member' AND role='FACULTY')::text
FROM faculty_course_associations WHERE id=:'assoc';
SQL
)"
if [[ "$STATE_B" != "CLOSED:0" ]]; then
  echo "FAIL reactivation-first persisted inconsistent state: $STATE_B" >&2
  cat "$A_LOG" "$B_LOG" >&2
  exit 1
fi
echo "PASS reactivation-first: subsequent role deletion closed faculty relationship"
echo "DB02 role-reactivation concurrency PASS"
echo "Fixture tag in disposable database: $RUN_TAG"
