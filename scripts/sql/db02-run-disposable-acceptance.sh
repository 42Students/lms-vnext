#!/usr/bin/env bash
# DB02 / DB-005 full acceptance entry point. Run from repository root only after
# Chat 1 integrates the canonical DB02 staging into numbered Drizzle migrations.
# This is NOT a migration and MUST NOT be run against production/shared DB.
#
# Invocation:
#   DB02_DISPOSABLE_ACCEPTANCE=YES \
#   DB02_EXPECTED_DATABASE=db02_verify_test \
#   DATABASE_URL='postgres://...@127.0.0.1:5432/db02_verify_test' \
#   bash scripts/sql/db02-run-disposable-acceptance.sh
#
# Requires node >=20, bash, psql, and an isolated database on which a clean
# zero-to-current numbered migration replay has ALREADY been performed.
# This runner does not automatically drop or create a database. Concurrent
# harnesses deliberately leave uniquely tagged fixtures; discard DB afterward.
#
# Existing CI billing is NOT a reason to skip independent local verification.
# Authoring this script alone is NOT evidence of an executed test.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must point at an isolated disposable PostgreSQL DB}"
: "${DB02_EXPECTED_DATABASE:?Set the exact disposable PostgreSQL database name}"
if [[ "${DB02_DISPOSABLE_ACCEPTANCE:-}" != "YES" ]]; then
  echo "Refusing to run: explicitly set DB02_DISPOSABLE_ACCEPTANCE=YES" >&2
  exit 2
fi

for bin in node psql bash; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Missing executable: $bin" >&2
    exit 2
  fi
done

if [[ ! -f "AGENTS.md" ]] ||
   [[ ! -f "scripts/sql/db02-academic-progression-and-rooms-staging.sql" ]]; then
  echo "Run this command from the lms-vnext repository root" >&2
  exit 2
fi

# A caller-controlled expected name alone is NOT a safe disposal boundary:
# before the first database connection, validate the actual URL as an explicitly
# named test/e2e target, reject redirecting DSN parameters, require exact
# confirmation for remote hosts, and reject an optional configured app target.
# The existing DB01 guard is shared and already covered by negative tests.
# Set DB02_APP_DATABASE_URL to the app/production URL when available; do not
# replace this with the disposable URL. Never echo either URL or credentials.
node --input-type=module <<'DB02_SAFE_TARGET'
import { assertSafeDb01TestTarget } from "./scripts/db01-test-database-guard.mjs";

const target = assertSafeDb01TestTarget({
  TEST_DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL: process.env.DB02_APP_DATABASE_URL,
  DB01_REMOTE_TEST_DATABASE_CONFIRM: process.env.DB01_REMOTE_TEST_DATABASE_CONFIRM,
});
if (target.database !== process.env.DB02_EXPECTED_DATABASE) {
  throw new Error("DB02 expected database does not match guarded URL target");
}
console.log(`DB02 guarded test-target preflight PASS: ${target.mode} ${target.host}/${target.database}`);
DB02_SAFE_TARGET

# Do not hardcode URL/password into error messages. The actual database name,
# not a guessed hostname, must match the caller's explicit disposable target.
ACTUAL_DATABASE="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -c 'SELECT current_database()')"
if [[ "$ACTUAL_DATABASE" != "$DB02_EXPECTED_DATABASE" ]]; then
  echo "Refusing to run: DB name mismatch; expected $DB02_EXPECTED_DATABASE, actual $ACTUAL_DATABASE" >&2
  exit 2
fi

# Registration must have already occurred. Avoid accidentally measuring the
# UNREGISTERED source artifacts against an older schema and reporting success.
# Derive the exact expected DB02 trigger manifest from the canonical staging source so this
# preflight cannot silently go stale as the source is hardened. Trigger names are part of the
# reviewable migration contract; a missing OR unexpected db02_* trigger fails closed.
EXPECTED_TRIGGER_NAMES="$(
  grep -Eo '^CREATE (OR REPLACE )?TRIGGER db02_[a-z0-9_]+' scripts/sql/db02-academic-progression-and-rooms-staging.sql | awk '{print $NF}' | sort -u
)"
if [[ -z "$EXPECTED_TRIGGER_NAMES" ]]; then
  echo "DB02 canonical staging exposes no trigger manifest" >&2
  exit 2
fi

REGISTERED_TRIGGER_NAMES="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 <<'SQL'
SELECT tgname
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname LIKE 'db02_%'
ORDER BY tgname;
SQL
)"

if [[ "$REGISTERED_TRIGGER_NAMES" != "$EXPECTED_TRIGGER_NAMES" ]]; then
  echo "DB02 canonical migration trigger manifest mismatch" >&2
  echo "Expected canonical triggers:" >&2
  printf '%s\n' "$EXPECTED_TRIGGER_NAMES" >&2
  echo "Registered database triggers:" >&2
  printf '%s\n' "$REGISTERED_TRIGGER_NAMES" >&2
  exit 2
fi

EXPECTED_TRIGGER_COUNT="$(printf '%s\n' "$EXPECTED_TRIGGER_NAMES" | sed '/^$/d' | wc -l | tr -d ' ')"
echo "DB02 trigger manifest preflight PASS ($EXPECTED_TRIGGER_COUNT canonical triggers registered)"

EXPECTED_TABLE_NAMES="$(
  grep -Eo '^CREATE TABLE (IF NOT EXISTS )?[a-z0-9_]+'     scripts/sql/db02-academic-progression-and-rooms-staging.sql     | awk '{print $NF}'     | sort -u
)"
if [[ -z "$EXPECTED_TABLE_NAMES" ]]; then
  echo "DB02 canonical staging exposes no created-table manifest" >&2
  exit 2
fi
for table in $EXPECTED_TABLE_NAMES; do
  if [[ ! "$table" =~ ^[a-z0-9_]+$ ]]; then
    echo "Invalid canonical DB02 table identifier: $table" >&2
    exit 2
  fi
  witness="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1     -c "SELECT count(*)::integer FROM information_schema.tables WHERE table_schema=current_schema() AND table_name='$table'")"
  if [[ "$witness" != "1" ]]; then
    echo "DB02 canonical migration is missing staged table: $table" >&2
    exit 2
  fi
done
EXPECTED_TABLE_COUNT="$(printf '%s\n' "$EXPECTED_TABLE_NAMES" | sed '/^$/d' | wc -l | tr -d ' ')"
echo "DB02 table manifest preflight PASS ($EXPECTED_TABLE_COUNT canonical tables registered)"

EXPECTED_COLUMN_PAIRS="$(
  awk '
    /^ALTER TABLE [a-z0-9_]+/ { table=$3 }
    /^[[:space:]]*ADD COLUMN / {
      column=$3
      if (column=="IF") column=$6
      gsub(/[,;]/, "", column)
      print table "." column
    }
  ' scripts/sql/db02-academic-progression-and-rooms-staging.sql     | sort -u
)"
if [[ -z "$EXPECTED_COLUMN_PAIRS" ]]; then
  echo "DB02 canonical staging exposes no added-column manifest" >&2
  exit 2
fi
for pair in $EXPECTED_COLUMN_PAIRS; do
  table="${pair%%.*}"
  column="${pair#*.}"
  if [[ ! "$table" =~ ^[a-z0-9_]+$ || ! "$column" =~ ^[a-z0-9_]+$ ]]; then
    echo "Invalid canonical DB02 column identifier: $pair" >&2
    exit 2
  fi
  witness="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1     -c "SELECT count(*)::integer FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='$table' AND column_name='$column'")"
  if [[ "$witness" != "1" ]]; then
    echo "DB02 canonical migration is missing staged column: $pair" >&2
    exit 2
  fi
done
EXPECTED_COLUMN_COUNT="$(printf '%s\n' "$EXPECTED_COLUMN_PAIRS" | sed '/^$/d' | wc -l | tr -d ' ')"
echo "DB02 column manifest preflight PASS ($EXPECTED_COLUMN_COUNT canonical columns registered)"

INACTIVE_ENUM_WITNESS="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 <<'SQL'
SELECT count(*)::integer
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname = 'cohort_status'
  AND e.enumlabel = 'INACTIVE';
SQL
)"
if [[ "$INACTIVE_ENUM_WITNESS" != "1" ]]; then
  echo "DB02 canonical migration is missing cohort_status.INACTIVE" >&2
  exit 2
fi

BTREE_GIST_WITNESS="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 <<'SQL'
SELECT count(*)::integer
FROM pg_extension
WHERE extname = 'btree_gist';
SQL
)"
if [[ "$BTREE_GIST_WITNESS" != "1" ]]; then
  echo "DB02 canonical migration is missing required btree_gist extension" >&2
  exit 2
fi

EXCLUSION_WITNESSES="$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 <<'SQL'
SELECT count(*)::integer
FROM pg_constraint
WHERE contype = 'x'
  AND conname IN (
    'section_schedule_events_section_no_overlap_excl',
    'section_schedule_events_faculty_no_overlap_excl',
    'section_schedule_events_hall_no_overlap_excl'
  );
SQL
)"
if [[ "$EXCLUSION_WITNESSES" != "3" ]]; then
  echo "DB02 canonical migration is missing schedule exclusion constraints (required: 3, found: $EXCLUSION_WITNESSES)" >&2
  exit 2
fi

source_tests=(
  tests/db02-staging-contract.test.mjs
  tests/db02-academic-parent-tenancy-contract.test.mjs
  tests/db02-schedule-progression-integrity-overlay.test.mjs
  tests/db02-historic-parent-reassignment-contract.test.mjs
  tests/db02-promotion-readiness-contract.test.mjs
  tests/db02-curriculum-type-history-contract.test.mjs
  tests/db02-disposable-runner-contract.test.mjs
  tests/db02-role-reactivation-contract.test.mjs
  tests/db02-active-parent-lifecycle-contract.test.mjs
  tests/db02-program-archive-integrity-contract.test.mjs
)
single_session_sql=(
  scripts/sql/db02-postgres-acceptance-unregistered.sql
  scripts/sql/db02-schedule-progression-integrity-acceptance-unregistered.sql
  scripts/sql/db02-historic-parent-reassignment-acceptance-unregistered.sql
  scripts/sql/db02-promotion-readiness-acceptance-unregistered.sql
  scripts/sql/db02-curriculum-type-history-acceptance-unregistered.sql
  scripts/sql/db02-activation-role-lifecycle-acceptance-unregistered.sql
  scripts/sql/db02-active-parent-lifecycle-acceptance-unregistered.sql
  scripts/sql/db02-program-archive-acceptance-unregistered.sql
)
two_session_bash=(
  scripts/sql/db02-postgres-concurrency-unregistered.sh
  scripts/sql/db02-promotion-readiness-concurrency-unregistered.sh
  scripts/sql/db02-curriculum-type-history-concurrency-unregistered.sh
  scripts/sql/db02-role-reactivation-concurrency-unregistered.sh
  scripts/sql/db02-active-parent-lifecycle-concurrency-unregistered.sh
  scripts/sql/db02-program-archive-concurrency-unregistered.sh
)

for path in "${source_tests[@]}" "${single_session_sql[@]}" "${two_session_bash[@]}"; do
  if [[ ! -f "$path" ]]; then
    echo "Required DB02 verification artifact is missing: $path" >&2
    exit 2
  fi
done

echo "DB02 verified disposable DB target: $ACTUAL_DATABASE"
echo "1/3 Node static source contract tests"
node --test "${source_tests[@]}"

echo "2/3 PostgreSQL rollback-only single-session acceptance"
for path in "${single_session_sql[@]}"; do
  echo "Running $path"
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$path"
done

echo "3/3 PostgreSQL multi-session race acceptance"
for path in "${two_session_bash[@]}"; do
  echo "Running $path"
  bash "$path"
done

echo "DB02 disposable acceptance all checks completed with exit code 0"
echo "Retain command/output, migration SHA, PostgreSQL version and server settings"
echo "as Chat 1 review evidence before DB-005 can be marked COMPLETED/DONE_VERIFIED."
echo "Discard this disposable database; concurrent fixture rows were committed."
